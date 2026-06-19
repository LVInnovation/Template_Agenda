import { Routes, Route, Navigate } from 'react-router-dom'
import Home from '../pages/Home'
import Admin from '../pages/Admin'
import Agenda from '../pages/Agenda.tsx'
import MeusAgendamentos from '../pages/MeusAgendamentos'
import Notificacoes from '../pages/Notificacoes'
import PacotesAtivos from '../pages/PacotesAtivos'
import { SETTINGS_ROUTE } from '../config/appConfig'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/meus-agendamentos" element={<MeusAgendamentos />} />
      <Route path={SETTINGS_ROUTE} element={<Navigate to="/admin?tab=template" replace />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/agenda" element={<Agenda />} />
      <Route path="/pacotes-ativos" element={<PacotesAtivos />} />
      <Route path="/notificacoes" element={<Notificacoes />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default AppRoutes
