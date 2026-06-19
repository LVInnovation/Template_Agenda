import { useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import AppRoutes from './routes/AppRoutes'
import { applyThemePreset } from './config/appConfig'
import { loadSiteConfigFromDatabase } from './services/siteConfig'
import { loadTemplatePreferences } from './services/templatePreferences'

function App() {
  useEffect(() => {
    applyThemePreset(loadTemplatePreferences().paletteId)
    loadSiteConfigFromDatabase().catch(() => applyThemePreset(loadTemplatePreferences().paletteId))
  }, [])

  return (
    <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App
