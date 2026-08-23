import { useState } from 'react'
import { toast } from 'sonner'
import { addCheckIn, setProgramPhase, todayISO } from '@/lib/db'
import { gatesMet } from '@/lib/checkIn'
import type { PhaseDef, ProgramDef } from '@/programs/types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'

type Answers = Record<string, number | boolean>

export function CheckInDialog({
  program,
  phase,
  open,
  onOpenChange,
}: {
  program: ProgramDef
  phase: PhaseDef
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [answers, setAnswers] = useState<Answers>({})
  const [step, setStep] = useState<'questions' | 'result'>('questions')
  const [met, setMet] = useState(false)

  const questions = phase.checkInQuestions ?? []
  const index = program.phases.findIndex(p => p.id === phase.id)
  const next = index >= 0 ? program.phases[index + 1] : undefined

  function reset(nextOpen: boolean) {
    if (!nextOpen) {
      setAnswers({})
      setStep('questions')
    }
    onOpenChange(nextOpen)
  }

  async function submit() {
    // An untouched pain slider reads 0 on screen — record that, rather than
    // letting a missing answer silently fail the gates. Yes/No must be answered.
    const filled: Answers = { ...answers }
    for (const q of questions) {
      if (q.type === 'pain0to10' && typeof filled[q.id] !== 'number') filled[q.id] = 0
    }
    const passed = gatesMet(phase, filled) && (phase.advanceProposals ?? true)
    setMet(passed)
    await addCheckIn({
      date: todayISO(),
      programId: program.id,
      answers: filled,
      proposedAction: passed && next ? 'advance' : 'hold',
    })
    setStep('result')
  }

  async function advance() {
    if (!next) return
    await setProgramPhase(program.id, next.id)
    toast.success(`${program.name} → ${next.name}`)
    reset(false)
  }

  return (
    <Dialog open={open} onOpenChange={reset}>
      <DialogContent className="max-h-[85vh] max-w-sm overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{step === 'questions' ? 'Weekly check-in' : 'Check-in logged'}</DialogTitle>
          <DialogDescription>
            {step === 'questions' ? `${program.name} · ${phase.name}` : phase.exitCriteria}
          </DialogDescription>
        </DialogHeader>

        {step === 'questions' ? (
          <div className="space-y-5">
            {questions.length === 0 && (
              <div className="text-sm text-muted-foreground">
                This phase has no check-in questions authored yet.
              </div>
            )}
            {questions.map(q =>
              q.type === 'pain0to10' ? (
                <div key={q.id} className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-sm leading-snug">{q.label}</Label>
                    <span className="text-lg font-semibold tabular-nums">
                      {(answers[q.id] as number) ?? 0}
                    </span>
                  </div>
                  <Slider
                    min={0}
                    max={10}
                    step={1}
                    value={[(answers[q.id] as number) ?? 0]}
                    onValueChange={([v]) => setAnswers(a => ({ ...a, [q.id]: v }))}
                  />
                </div>
              ) : (
                <div key={q.id} className="flex items-center justify-between gap-3">
                  <Label className="text-sm leading-snug">{q.label}</Label>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      size="sm"
                      variant={answers[q.id] === true ? 'default' : 'outline'}
                      onClick={() => setAnswers(a => ({ ...a, [q.id]: true }))}
                    >
                      Yes
                    </Button>
                    <Button
                      size="sm"
                      variant={answers[q.id] === false ? 'default' : 'outline'}
                      onClick={() => setAnswers(a => ({ ...a, [q.id]: false }))}
                    >
                      No
                    </Button>
                  </div>
                </div>
              ),
            )}
            <DialogFooter>
              <Button onClick={submit} disabled={questions.length === 0}>
                Submit check-in
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            {met && next ? (
              <>
                <div className="text-sm">
                  Gates look met — advance to <span className="font-medium">{next.name}</span>?
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => reset(false)}>
                    Not yet
                  </Button>
                  <Button onClick={advance}>Advance</Button>
                </DialogFooter>
              </>
            ) : (
              <>
                <div className="text-sm">
                  {met && !next
                    ? 'Gates met, and this is the final phase — keep it as maintenance.'
                    : 'Keep working this phase. Nothing changes today; the answers are logged.'}
                </div>
                <DialogFooter>
                  <Button onClick={() => reset(false)}>Close</Button>
                </DialogFooter>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
