import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ensureProgramStates, ensureSettings } from '@/lib/db'
import { initialPhaseOf, programList } from '@/programs'

ensureSettings()
  .then(() =>
    ensureProgramStates(programList().map(p => ({ programId: p.id, phase: initialPhaseOf(p) }))),
  )
  .finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
