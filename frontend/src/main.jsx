import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App'
import InsightsPage from './pages/InsightsPage'
import SourcesPage from './pages/SourcesPage'
import MediaPage from './pages/MediaPage'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/insights/:sessionId" element={<InsightsPage />} />
        <Route path="/sources/:sessionId" element={<SourcesPage />} />
        <Route path="/media/:sessionId" element={<MediaPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
