from __future__ import annotations

import hashlib
import json
import re
from collections import Counter
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, asdict, field
from pathlib import Path
from typing import Any, Dict, List, Tuple
from urllib.parse import urlparse

import requests
from scrapy.http import HtmlResponse

CACHE_DIR = Path(__file__).resolve().parent.parent / "data" / "cached_pages"
CACHE_DIR.mkdir(parents=True, exist_ok=True)

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

_HEADING_TAGS = {"h1", "h2", "h3", "h4", "h5", "h6"}
_CONTENT_TAGS = {
    "p", "li", "blockquote", "dt", "dd", "figcaption",
    "pre", "code", "td", "th", "caption", "summary",
}
# Reduced noise list — keep nav/header/footer for more coverage
_NOISE_TAGS = (
    "script", "style", "noscript",
    "iframe", "svg", "canvas", "select",
)
_NOISE_CLASSES = (
    "advertisement", "ads-", "-ads", "cookie-banner", "cookie-notice",
    "social-share", "share-bar",
    "popup", "modal", "tooltip",
)

_SKIP_EXTENSIONS = {
    ".pdf", ".zip", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico",
    ".css", ".js", ".woff", ".woff2", ".ttf", ".eot", ".mp4", ".mp3",
    ".webm", ".xml", ".json", ".rss", ".atom",
}
_SKIP_PATH_FRAGMENTS = (
    "/wp-admin/", "/wp-content/", "/wp-includes/",
    "/static/", "/assets/", "/fonts/",
    "/cdn-cgi/", "/__", "/api/",
)

_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".avif"}


def _no_noise_xpath() -> str:
    structural = " and ".join(f"not(ancestor-or-self::{t})" for t in _NOISE_TAGS)
    class_checks = " and ".join(
        f"not(contains(@class,'{k}') or contains(@id,'{k}'))"
        for k in _NOISE_CLASSES
    )
    return f"{structural} and {class_checks}"


@dataclass
class Section:
    title: str
    text: str
    anchor: str = field(default="")


@dataclass
class PageContent:
    url: str
    final_url: str
    title: str
    sections: List[Section]
    raw_text: str
    html_hash: str
    cached: bool = False
    images: List[str] = field(default_factory=list)
    theme: Dict[str, Any] = field(default_factory=dict)
    security: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "url": self.url,
            "final_url": self.final_url,
            "title": self.title,
            "sections": [asdict(s) for s in self.sections],
            "raw_text": self.raw_text,
            "html_hash": self.html_hash,
            "cached": self.cached,
            "images": self.images,
            "theme": self.theme,
            "security": self.security,
        }


_PC_FIELDS = set(PageContent.__dataclass_fields__)


def validate_url(url: str) -> bool:
    try:
        parsed = urlparse(url.strip())
        return parsed.scheme in {"http", "https"} and bool(parsed.netloc)
    except Exception:
        return False


def _should_crawl(url: str) -> bool:
    try:
        path = urlparse(url).path.lower()
    except Exception:
        return False
    if any(path.endswith(ext) for ext in _SKIP_EXTENSIONS):
        return False
    if any(frag in path for frag in _SKIP_PATH_FRAGMENTS):
        return False
    return True


def _cache_key(url: str) -> str:
    return hashlib.sha256(url.encode("utf-8")).hexdigest()


def _clean_text(text: str) -> str:
    return re.sub(r"\s+", " ", text or "").strip()


def _page_title(response: HtmlResponse) -> str:
    og_title = _clean_text(response.css('meta[property="og:title"]::attr(content)').get(""))
    if og_title:
        return og_title
    title = _clean_text(response.css("title::text").get(""))
    if title:
        return title
    h1 = _clean_text(response.css("h1::text").get(""))
    return h1 or "Untitled page"


def _slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def _is_near_white(hex_color: str) -> bool:
    try:
        h = hex_color.lstrip("#")
        if len(h) == 3:
            h = "".join(c * 2 for c in h)
        r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
        return r > 210 and g > 210 and b > 210
    except Exception:
        return False


def _is_near_black(hex_color: str) -> bool:
    try:
        h = hex_color.lstrip("#")
        if len(h) == 3:
            h = "".join(c * 2 for c in h)
        r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
        return r < 40 and g < 40 and b < 40
    except Exception:
        return False


def _check_security(url: str, resp: requests.Response) -> Dict[str, Any]:
    """Extract security posture from URL scheme and HTTP response headers."""
    parsed = urlparse(url)
    https_enabled = parsed.scheme == "https"

    hdrs = resp.headers
    csp = hdrs.get("Content-Security-Policy", "")
    x_frame = hdrs.get("X-Frame-Options", "")
    x_xss = hdrs.get("X-XSS-Protection", "")
    hsts = hdrs.get("Strict-Transport-Security", "")

    raw_cookies: List[str] = []
    try:
        raw_cookies = resp.raw.headers.getlist("set-cookie")
    except Exception:
        cookie_str = hdrs.get("set-cookie", "")
        if cookie_str:
            raw_cookies = [cookie_str]

    has_cookies = bool(raw_cookies)
    cookies_secure = any("secure" in c.lower() for c in raw_cookies)
    cookies_httponly = any("httponly" in c.lower() for c in raw_cookies)

    return {
        "https_enabled": https_enabled,
        "ssl_valid": https_enabled,  # request succeeded with verify=True (default)
        "csp": csp,
        "has_csp": bool(csp),
        "x_frame_options": x_frame,
        "has_x_frame_options": bool(x_frame),
        "x_xss_protection": x_xss,
        "has_x_xss_protection": bool(x_xss),
        "hsts": hsts,
        "has_hsts": bool(hsts),
        "has_cookies": has_cookies,
        "cookies_secure": cookies_secure,
        "cookies_httponly": cookies_httponly,
    }


def _extract_theme(response: HtmlResponse) -> Dict[str, Any]:
    """Extract brand colors, og:image, favicon and CSS palette from the page."""
    theme: Dict[str, Any] = {}

    # Theme color meta tags (most reliable brand color signal)
    tc = (
        response.css('meta[name="theme-color"]::attr(content)').get("") or
        response.css('meta[name="msapplication-TileColor"]::attr(content)').get("")
    )
    if tc and (tc.startswith("#") or tc.startswith("rgb")):
        theme["accent"] = tc

    # OG / Twitter card image
    og_img = (
        response.css('meta[property="og:image"]::attr(content)').get("") or
        response.css('meta[name="og:image"]::attr(content)').get("") or
        response.css('meta[property="twitter:image"]::attr(content)').get("") or
        response.css('meta[name="twitter:image"]::attr(content)').get("")
    )
    if og_img:
        theme["og_image"] = response.urljoin(og_img)

    # Site name
    og_name = response.css('meta[property="og:site_name"]::attr(content)').get("")
    if og_name:
        theme["site_name"] = og_name

    # Favicon (prefer hi-res touch icon)
    favicon = (
        response.css('link[rel="apple-touch-icon"]::attr(href)').get("") or
        response.css('link[rel="icon"][type="image/png"]::attr(href)').get("") or
        response.css('link[rel="icon"]::attr(href)').get("") or
        response.css('link[rel="shortcut icon"]::attr(href)').get("")
    )
    if favicon:
        theme["favicon"] = response.urljoin(favicon)

    # Extract hex palette from inline <style> blocks
    css_texts = " ".join(response.css("style::text").getall())
    hex_raw = re.findall(r"#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b", css_texts)
    normalized = ["#" + (c * 2 if len(c) == 3 else c).upper() for c in hex_raw]
    counter = Counter(normalized)
    palette = [
        c for c, _ in counter.most_common(40)
        if not _is_near_white(c) and not _is_near_black(c)
    ][:8]
    if palette:
        theme["palette"] = palette
        if "accent" not in theme:
            theme["accent"] = palette[0]

    # Meta description
    desc = _clean_text(
        response.css('meta[name="description"]::attr(content)').get("") or
        response.css('meta[property="og:description"]::attr(content)').get("")
    )
    if desc:
        theme["description"] = desc

    return theme


def _extract_images(response: HtmlResponse) -> List[str]:
    """Collect meaningful images from the page: og:image first, then content imgs."""
    seen: set = set()
    images: List[str] = []

    # OG / Twitter hero image takes priority
    og = (
        response.css('meta[property="og:image"]::attr(content)').get("") or
        response.css('meta[property="twitter:image"]::attr(content)').get("")
    )
    if og:
        full = response.urljoin(og)
        seen.add(full)
        images.append(full)

    # Regular img tags — skip tiny icons and tracking pixels
    skip_patterns = ("/icon", "/favicon", "/logo-icon", "sprite", "pixel", "1x1", "blank", "tracking")
    for src in response.css("img::attr(src), img::attr(data-src), img::attr(data-lazy-src)").getall():
        if not src or src.startswith("data:"):
            continue
        full = response.urljoin(src)
        if full in seen:
            continue
        path_lower = urlparse(full).path.lower()
        if any(x in path_lower for x in skip_patterns):
            continue
        ext = Path(urlparse(full).path).suffix.lower()
        if ext in _IMAGE_EXTENSIONS or not ext:
            seen.add(full)
            images.append(full)
        if len(images) >= 25:
            break

    return images


def _extract_hidden_content(response: HtmlResponse) -> List[Section]:
    """Pull content from accordions, data attrs, and expandable ARIA elements."""
    extra: List[Section] = []

    # <details>/<summary> — FAQ, accordions, read-more patterns
    for detail in response.css("details"):
        summary_text = _clean_text(" ".join(detail.css("summary::text").getall()))
        # All content except the summary element itself
        content_text = _clean_text(
            " ".join(detail.css("*:not(summary)::text").getall())
        )
        if content_text and len(content_text) > 30:
            extra.append(Section(
                title=summary_text or "Detail",
                text=content_text,
                anchor="hidden-detail",
            ))

    # data-content / data-text / data-description attributes
    for el in response.css("[data-content],[data-text],[data-description]"):
        text = _clean_text(
            el.attrib.get("data-content", "") or
            el.attrib.get("data-text", "") or
            el.attrib.get("data-description", "")
        )
        if len(text) > 40:
            extra.append(Section(title="Additional Info", text=text, anchor="data-attr"))

    # Labeled sections and articles with substantial inner text
    for el in response.css("section[aria-label],article[aria-label],div[role='region'][aria-label]"):
        inner = _clean_text(" ".join(el.css("::text").getall()))
        label = el.attrib.get("aria-label", "")
        if len(inner) > 100:
            extra.append(Section(title=label or "Section", text=inner[:3000], anchor="aria-region"))

    return extra[:12]


def _extract_sections(response: HtmlResponse, default_title: str) -> List[Section]:
    noise_filter = _no_noise_xpath()
    heading_tags_xpath = " or ".join(f"self::{t}" for t in sorted(_HEADING_TAGS))
    content_tags_xpath = " or ".join(f"self::{t}" for t in sorted(_CONTENT_TAGS))

    def build_sections(node_xpath: str) -> List[Section]:
        sections: List[Section] = []
        current_title = default_title
        current_anchor = ""
        buffer: List[str] = []

        def flush() -> None:
            nonlocal buffer
            text = _clean_text(" ".join(buffer))
            if text:
                sections.append(Section(title=current_title, text=text, anchor=current_anchor))
            buffer = []

        for node in response.xpath(node_xpath):
            tag = node.root.tag
            text = _clean_text(" ".join(node.css("::text").getall()))
            if not text:
                continue
            if tag in _HEADING_TAGS:
                flush()
                current_title = text
                raw_id = (node.root.get("id") or "").strip()
                current_anchor = raw_id or _slugify(text)
                # Capture h1 text as content so page title is searchable
                if tag == "h1":
                    buffer.append(text)
            else:
                buffer.append(text)

        flush()
        return sections

    main_scope_xpath = (
        "ancestor-or-self::main or "
        "ancestor-or-self::article or "
        "ancestor-or-self::*[@role='main'] or "
        "ancestor-or-self::*[@id='main'] or "
        "ancestor-or-self::*[@id='content'] or "
        "ancestor-or-self::*[@id='main-content'] or "
        "ancestor-or-self::*[contains(@class,'main-content')] or "
        "ancestor-or-self::*[contains(@class,'page-content')] or "
        "ancestor-or-self::*[contains(@class,'site-content')] or "
        "ancestor-or-self::*[contains(@class,'entry-content')]"
    )
    main_node_xpath = (
        f"//*[({heading_tags_xpath}) or ({content_tags_xpath})]"
        f"[{noise_filter} and ({main_scope_xpath})]"
    )
    all_node_xpath = (
        f"//*[({heading_tags_xpath}) or ({content_tags_xpath})]"
        f"[{noise_filter}]"
    )

    sections = build_sections(main_node_xpath)
    if sum(len(s.text) for s in sections) < 400:
        sections = build_sections(all_node_xpath)

    total_chars = sum(len(s.text) for s in sections)
    if total_chars < 400:
        body_main_parts = response.xpath(
            "//text()[not(ancestor-or-self::script) and not(ancestor-or-self::style) and "
            "not(ancestor-or-self::noscript) and "
            "(ancestor::main or ancestor::article or ancestor::*[@role='main'] or "
            "ancestor::*[@id='main'] or ancestor::*[@id='content'] or "
            "ancestor::*[@id='main-content'] or ancestor::*[contains(@class,'main-content')])]"
        ).getall()
        body_parts = response.xpath(
            "//text()[not(ancestor-or-self::script) and not(ancestor-or-self::style) and "
            "not(ancestor-or-self::noscript)]"
        ).getall()
        body_main_text = _clean_text(" ".join(body_main_parts))
        body_text = _clean_text(" ".join(body_parts))
        best_body_text = body_main_text if len(body_main_text) >= len(body_text) * 0.25 else body_text

        if len(body_text) > total_chars:
            meta_desc = _clean_text(
                response.css('meta[name="description"]::attr(content)').get("") or
                response.css('meta[property="og:description"]::attr(content)').get("")
            )
            fallback_sections = []
            if meta_desc:
                fallback_sections.append(Section(title="Overview", text=meta_desc, anchor="overview"))
            if best_body_text:
                fallback_sections.append(Section(title=default_title, text=best_body_text, anchor=""))
            return fallback_sections or sections

    merged: List[Section] = []
    for sec in sections:
        if len(sec.text) < 2:
            continue
        if merged and merged[-1].title == sec.title and len(merged[-1].text) < 10_000:
            merged[-1].text += " " + sec.text
        else:
            merged.append(sec)

    meta_desc = _clean_text(
        response.css('meta[name="description"]::attr(content)').get("") or
        response.css('meta[property="og:description"]::attr(content)').get("")
    )
    if meta_desc and (not merged or meta_desc not in merged[0].text[:300]):
        merged.insert(0, Section(title="Overview", text=meta_desc, anchor="overview"))

    # Append content from hidden/expandable elements
    hidden = _extract_hidden_content(response)
    merged.extend(hidden)

    return merged


# ── Low-level fetch / parse helpers ──────────────────────────────────────────

def _fetch_page(url: str, timeout: int = 25) -> Tuple[str, str, HtmlResponse, requests.Response]:
    resp = requests.get(url, headers=HEADERS, timeout=timeout, allow_redirects=True)
    resp.raise_for_status()
    html = resp.text
    html_hash = hashlib.sha256(html.encode("utf-8", errors="ignore")).hexdigest()
    response = HtmlResponse(
        url=str(resp.url),
        body=html.encode("utf-8", errors="ignore"),
        encoding="utf-8",
    )
    return str(resp.url), html_hash, response, resp


def _extract_links(
    response: HtmlResponse,
    seed_netloc: str,
    max_links: int = 30,
) -> List[str]:
    seen: set = set()
    links: List[str] = []
    for href in response.css("a::attr(href)").getall():
        if len(links) >= max_links:
            break
        if not href or href.startswith(("#", "mailto:", "tel:", "javascript:")):
            continue
        full = response.urljoin(href).split("#")[0]
        full = full.rstrip("/") or full
        try:
            parsed = urlparse(full)
        except Exception:
            continue
        if (
            parsed.scheme in {"http", "https"}
            and parsed.netloc == seed_netloc
            and full not in seen
            and _should_crawl(full)
        ):
            seen.add(full)
            links.append(full)
    return links


def _parse_to_content(
    url: str,
    final_url: str,
    html_hash: str,
    response: HtmlResponse,
    http_resp: requests.Response,
) -> PageContent:
    title = _page_title(response)
    sections = _extract_sections(response, title)
    raw_text = _clean_text(" ".join(s.text for s in sections))
    images = _extract_images(response)
    theme = _extract_theme(response)
    security = _check_security(final_url, http_resp)
    return PageContent(
        url=url,
        final_url=final_url,
        title=title,
        sections=sections,
        raw_text=raw_text,
        html_hash=html_hash,
        images=images,
        theme=theme,
        security=security,
    )


def _load_page_from_cache(cache_path: Path) -> Tuple[PageContent, List[str]]:
    payload = json.loads(cache_path.read_text(encoding="utf-8"))
    payload["sections"] = [
        Section(title=s["title"], text=s["text"], anchor=s.get("anchor", ""))
        for s in payload.get("sections", [])
    ]
    payload["cached"] = True
    page = PageContent(**{k: v for k, v in payload.items() if k in _PC_FIELDS})
    links = payload.get("_links", [])
    return page, links


# ── Public scraping API ───────────────────────────────────────────────────────

def scrape_url(url: str, timeout: int = 25, use_cache: bool = True) -> PageContent:
    if not validate_url(url):
        raise ValueError(f"Invalid URL: {url}")

    cache_path = CACHE_DIR / f"{_cache_key(url)}.json"
    if use_cache and cache_path.exists():
        page, _ = _load_page_from_cache(cache_path)
        return page

    final_url, html_hash, response, http_resp = _fetch_page(url, timeout)
    page = _parse_to_content(url, final_url, html_hash, response, http_resp)
    cache_path.write_text(
        json.dumps(page.to_dict(), ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    return page


def crawl_site(
    seed: str,
    max_pages: int = 25,
    max_depth: int = 3,
    max_links_per_page: int = 30,
    timeout: int = 25,
    use_cache: bool = True,
) -> List[PageContent]:
    """BFS-crawl a site from seed URL, following same-domain links."""
    if not validate_url(seed):
        raise ValueError(f"Invalid URL: {seed}")

    seed_netloc = urlparse(seed).netloc
    visited: set = set()
    results: List[PageContent] = []
    queue: List[Tuple[str, int]] = [(seed.rstrip("/") or seed, 0)]

    while queue and len(results) < max_pages:
        url, depth = queue.pop(0)
        norm = url.rstrip("/") or url
        if norm in visited:
            continue
        visited.add(norm)

        cache_path = CACHE_DIR / f"{_cache_key(url)}.json"
        if use_cache and cache_path.exists():
            page, cached_links = _load_page_from_cache(cache_path)
            results.append(page)
            if depth < max_depth:
                for link in cached_links[:max_links_per_page]:
                    link_norm = link.rstrip("/") or link
                    if link_norm not in visited:
                        queue.append((link, depth + 1))
            continue

        try:
            final_url, html_hash, response, http_resp = _fetch_page(url, timeout)
        except Exception:
            continue

        page = _parse_to_content(url, final_url, html_hash, response, http_resp)

        discovered: List[str] = []
        if depth < max_depth:
            discovered = _extract_links(response, seed_netloc, max_links_per_page)

        cache_payload = page.to_dict()
        cache_payload["_links"] = discovered
        cache_path.write_text(
            json.dumps(cache_payload, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        results.append(page)

        for link in discovered:
            link_norm = link.rstrip("/") or link
            if link_norm not in visited:
                queue.append((link, depth + 1))

    return results


def scrape_many(
    urls: List[str],
    use_cache: bool = True,
    max_workers: int = 4,
    max_pages_per_url: int = 25,
) -> List[PageContent]:
    """Crawl each seed URL's domain concurrently, deduplicating by final_url."""
    if not urls:
        return []

    futures: dict = {}
    results: dict = {}

    with ThreadPoolExecutor(max_workers=min(max_workers, len(urls))) as pool:
        for url in urls:
            futures[pool.submit(
                crawl_site, url, max_pages_per_url, 3, 30, 25, use_cache
            )] = url
        for future in as_completed(futures):
            url = futures[future]
            try:
                results[url] = future.result()
            except Exception as exc:
                results[url] = exc

    all_pages: List[PageContent] = []
    seen_finals: set = set()
    for url in urls:
        result = results[url]
        if isinstance(result, Exception):
            raise result
        for page in result:
            norm = page.final_url.rstrip("/") or page.final_url
            if norm not in seen_finals:
                seen_finals.add(norm)
                all_pages.append(page)

    return all_pages
