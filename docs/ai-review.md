# The AI review ritual

Durable's rules run entirely on-device: the planner is a pure function over static protocol
content, and nothing in the app calls a model. Adaptation happens deliberately, when you ask for
it — roughly every 2–4 weeks, or whenever something is clearly not working.

## The loop

1. **Export.** Settings → **Copy AI-review export** (or **Download JSON** if you want a file). The
   export is every local table: `dailyLogs`, `setCompletions`, `settings`, `programState`,
   `planItems`, `checkIns`, `bodyMetrics`, `gateTests`, stamped `version: "durable-v3"`.
2. **Open a Claude session in this repo** — the review needs the code and the research docs, not
   just the numbers.
3. **Ask for the review.** Something like:

   > Here's my Durable export. Review it against `docs/research/*` and the current programs in
   > `src/programs/*.ts`. Where is adherence falling off, where is pain not trending down, and
   > which phase gates am I sitting on? Propose concrete edits to the protocol content.

4. **Let it edit `src/programs/*.ts`** — phases, doses, frequencies, `alternates`, `workoutSizes`,
   exit criteria, check-in questions. That is the tuning surface.
5. **Run `npm test` and commit.** The planner tests guard the scheduling rules; the registry test
   guards the content shape.

## What to look at

- **Adherence by bucket.** Sets logged per week (Trends) split by program. A bucket that is never
  ticked is usually mis-sized or mis-placed, not a discipline problem — shrink the dose or move it
  to `couch`.
- **Pain trends per area.** `dailyLogs.painScores` over weeks. Rising pain on a tissue that has a
  hard item in the current phase is the signal to regress that item, not to push.
- **Stuck phases.** `programState.startedPhaseAt` plus `checkIns` — a program sitting in one phase
  for many weeks with check-ins that keep missing the gates means the gates or the phase content
  need rewriting.
- **Skips and swaps.** `planItems` rows are the honest record of what you actually refuse to do. A
  repeatedly skipped item wants replacing; a repeatedly chosen alternate should become the default.

## Rules of the ritual

- **Content, not code.** The review edits protocol content. Changes to `src/lib/planner.ts` are a
  separate, deliberate decision — the scheduling rules come from the research docs' sequencing
  sections and are unit-tested.
- **Cite the research.** Any protocol change should point at a section of `docs/research/*`. If the
  research does not support it, say so in the commit message.
- **Never auto-advance a phase.** Phase changes happen through a check-in in the app, with your
  confirmation. A review can say "your gates look met" — it should not rewrite `programState`.
- **No API key ships in the app.** The export is a file you carry to a session. That is the whole
  integration.
