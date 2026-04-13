import { HashRouter, Route, Routes } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { BottomNav } from '@/components/BottomNav'
import { Dashboard } from '@/pages/Dashboard'
import { ExerciseDetail } from '@/pages/ExerciseDetail'
import { ProgressPage } from '@/pages/Progress'
import { SettingsPage } from '@/pages/Settings'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/exercise/:protocolId" element={<ExerciseDetail />} />
        <Route path="/progress" element={<ProgressPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
      <BottomNav />
      <Toaster />
    </HashRouter>
  )
}
