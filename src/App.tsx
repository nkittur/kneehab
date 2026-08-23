import { useEffect } from 'react'
import { HashRouter, Route, Routes, useLocation } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Toaster } from '@/components/ui/sonner'
import { BottomNav } from '@/components/BottomNav'
import { getSettings } from '@/lib/db'
import { Today } from '@/pages/Today'
import { ExerciseDetail } from '@/pages/ExerciseDetail'
import { ProgramsPage } from '@/pages/Programs'
import { TrendsPage } from '@/pages/Trends'
import { SettingsPage } from '@/pages/Settings'

/** Jump to the top whenever the route changes — a tapped card opens at the top. */
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  const darkMode = useLiveQuery(async () => (await getSettings())?.darkMode ?? false, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode === true)
  }, [darkMode])

  return (
    <HashRouter>
      <ScrollToTop />
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
