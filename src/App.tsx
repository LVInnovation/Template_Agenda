import { useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import AppRoutes from './routes/AppRoutes'
import { loadSiteConfigFromDatabase } from './services/siteConfig'
import { TEMPLATE_PREFERENCES_EVENT, loadTemplatePreferences } from './services/templatePreferences'
import { applyThemeColors } from './utils/themeColors'

function App() {
  useEffect(() => {
    const applySavedTheme = () => {
      const preferences = loadTemplatePreferences()
      applyThemeColors(preferences.themeColors, preferences.paletteId)
    }

    const handleThemeChange = () => {
      applySavedTheme()
    }

    applySavedTheme()
    loadSiteConfigFromDatabase().catch(() => applySavedTheme())
    window.addEventListener(TEMPLATE_PREFERENCES_EVENT, handleThemeChange)

    return () => {
      window.removeEventListener(TEMPLATE_PREFERENCES_EVENT, handleThemeChange)
    }
  }, [])

  return (
    <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App
