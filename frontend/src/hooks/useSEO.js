import { useEffect } from 'react'

const BASE_TITLE = 'Web Intelligence'
const BASE_DESCRIPTION = 'Transform any website into a queryable knowledge base. AI-powered insights, Q&A, media extraction, and competitive analysis.'
const BASE_URL = 'https://webintelligence.app'
const BASE_IMAGE = `${BASE_URL}/og-image.png`

function setMeta(name, content, attr = 'name') {
  if (!content) return
  let el = document.querySelector(`meta[${attr}="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setLink(rel, href) {
  let el = document.querySelector(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

/**
 * @param {{ title?: string, description?: string, image?: string, url?: string, type?: string }} opts
 */
export function useSEO({ title, description, image, url, type = 'website' } = {}) {
  useEffect(() => {
    const fullTitle = title ? `${title} - ${BASE_TITLE}` : `${BASE_TITLE} -  AI Website Analyst & Q&A Tool`
    const desc = description || BASE_DESCRIPTION
    const img = image || BASE_IMAGE
    const canonical = url ? `${BASE_URL}${url}` : BASE_URL

    document.title = fullTitle

    setMeta('description', desc)
    setLink('canonical', canonical)

    // Open Graph
    setMeta('og:title', fullTitle, 'property')
    setMeta('og:description', desc, 'property')
    setMeta('og:image', img, 'property')
    setMeta('og:url', canonical, 'property')
    setMeta('og:type', type, 'property')

    // Twitter
    setMeta('twitter:title', fullTitle)
    setMeta('twitter:description', desc)
    setMeta('twitter:image', img)
  }, [title, description, image, url, type])
}
