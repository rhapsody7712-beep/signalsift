# CLAUDE.md — SignalSift

This file gives Claude Code persistent context for this project. Read it before
making changes. The full spec is in `PRD.md`.

## What we're building

SignalSift: an AI-resilient candidate screening tool. It ranks resumes for a role
by an **explainable** composite Signal Score driven by criteria the hiring manager
and recruiter define. It rewards verifiable evidence over fluent AI-generated prose.

## Scope for THIS build (Phase 0 — MVP)

Build a local, single-user web app. **In scope:**
- Paste or upload `.txt` resumes (PDF/DOCX parsing is a LATER phase — do not build it now).
- Hiring-manager criteria: 5–7 criteria across three tiers
  - Deal-breakers (3–4): highest weight; each is either a **hard gate** (auto-disqualify
    on a true miss) or a **strong penalty** (heavy negative, still ranked) — configurable.
  - Medium (~2): meaningful weight, not disqualifying.
  - Preferred/bonus (1–2): low weight; tie-breakers.
- Recruiter criteria layer (clearly labeled, separate from manager criteria):
  - Work authorization — labeled "eligible to work in [location] without sponsorship"
    (NOT "immigration status").
  - Location / work-eligible geography.
  - At least one user-defined custom criterion (free-form, with weight + tier).
- Baseline resume-quality signals: evidence density, internal consistency,
  AI/template likelihood (probabilistic, shown with confidence — NEVER auto-reject).
- Composite 0–100 Signal Score + ranked list.
- Per-candidate breakdown: every criterion at its tier with its result, detected
  evidence, and human-readable flags WITH reasons.
- One-click human override on any flag / criterion result / score.
- Editable criteria/tiers/weights that re-score in real time.

**Out of scope for Phase 0 (do NOT build, but don't architect against):**
- PDF/DOCX parsing, external MCP connectors (LinkedIn/Indeed/GitHub),
  the calibration advisor, multi-user/auth, persistence/DB.

## Hard rules (non-negotiable)

1. **Explainability first.** Every number the UI shows must be traceable to a reason
   and to source text. No opaque scores.
2. **Human-in-the-loop.** The tool assists; it never decides. Overrides must be everywhere.
3. **AI-detection is a signal, not a verdict.** Show it with a confidence level; it
   contributes weight but never auto-disqualifies.
4. **No protected-attribute logic.** Do not score on, infer, or proxy for race, gender,
   age, national origin, etc. Work-authorization is framed as employability without
   sponsorship only.
5. **Keep scoring logic transparent and testable** — pure functions, unit-tested,
   separated from UI.

## Tech preferences

- React + Vite + TypeScript, single-page app, runs locally with `npm run dev`.
- No backend, no database, no browser localStorage for Phase 0 — state in memory.
- Scoring engine lives in `src/engine/` as pure, unit-tested TS functions, fully
  decoupled from React.
- Tailwind for styling is fine. Keep the UI clean and information-dense.
- Ship with 5 sample candidates for one sample role so the demo works on first run.

## Suggested structure

```
src/
  engine/            # pure scoring logic (no React)
    types.ts         # Criterion, Tier, Candidate, ScoreBreakdown, etc.
    evidence.ts      # evidence-density + consistency + AI-likelihood signals
    criteria.ts      # apply manager + recruiter criteria, tiers, gates
    score.ts         # composite score + ranking
    engine.test.ts   # unit tests for the above
  data/
    samples.ts       # 5 sample resumes + a sample role's criteria
  components/        # React UI
  App.tsx
```

## Definition of done for Phase 0

- `npm install && npm run dev` runs the app; 5 samples rank immediately.
- All scoring is unit-tested (`npm test` passes).
- A deal-breaker set to "hard gate" demonstrably disqualifies a missing candidate.
- Changing a weight/tier re-ranks live.
- Every candidate row expands to a full, reasoned breakdown.
- Any score/flag can be overridden by the user.
