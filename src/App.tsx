import { useEffect } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Toaster } from '@/components/ui/sonner'
import { BottomNav } from '@/components/BottomNav'
import { getSettings } from '@/lib/db'
import { Today } from '@/pages/Today'
import { ExerciseDetail } from '@/pages/ExerciseDetail'
import { ProgramsPage } from '@/pages/Programs'
import { TrendsPage } from '@/pages/Trends'
import { SettingsPage } from '@/pages/Settings'

export default function App() {
  const darkMode = useLiveQuery(async () => (await getSettings())?.darkMode ?? false, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode === true)
  }, [darkMode])

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Today />} />
        <Route path="/exercise/:programId/:itemId" element={<ExerciseDetail />} />
        <Route path="/programs" element={<ProgramsPage />} />
        <Route path="/progress" element={<TrendsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
      <BottomNav />
      <Toaster />
    </HashRouter>
  )
}
