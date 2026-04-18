import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Login from './pages/Login'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Characters from './pages/Characters'
import Teams from './pages/Teams'
import Supports from './pages/Supports'
import Quetes from './pages/Quetes'
import PuzzleGauntlet from './pages/PuzzleGauntlet'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-marvel-red border-t-transparent rounded-full" />
    </div>
  )
  return session ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="characters" element={<Characters />} />
        <Route path="teams" element={<Teams />} />
        <Route path="supports" element={<Supports />} />
        <Route path="quetes" element={<Quetes />} />
        <Route path="gauntlet" element={<PuzzleGauntlet />} />
      </Route>
    </Routes>
  )
}
