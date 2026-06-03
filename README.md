# SignalSift — Claude Code starter package

This folder is a ready-to-use starter for building **SignalSift** with Claude Code
on your desktop. It contains the spec and the context Claude Code needs — you bring
the repo and let Claude Code write the app.

## What's in here

| File | Purpose |
|---|---|
| `PRD.md` | The full product requirements (problem, criteria tiers, recruiter layer, candidate-blind calibration, roadmap, metrics). The source of truth. |
| `CLAUDE.md` | Persistent project context Claude Code reads automatically. Defines Phase 0 scope, hard rules, tech choices, and definition of done. |
| `claude-code-prompt.md` | The exact kickoff prompt to paste into Claude Code, plus follow-up prompts. |

## How to use it (≈5 minutes)

1. **Install Claude Code** if you haven't. From a terminal:
   - Check the current install steps and Node version requirements at the official
     docs (Claude Code requires Node.js). I can pull the exact current instructions
     for your OS if you want.

2. **Make a project folder and drop these files in it:**
   ```bash
   mkdir signalsift && cd signalsift
   # copy PRD.md, CLAUDE.md, and claude-code-prompt.md into this folder
   ```

3. **Start Claude Code in that folder:**
   ```bash
   claude
   ```
   It will pick up `CLAUDE.md` automatically as project context.

4. **Paste the kickoff prompt** from `claude-code-prompt.md`. It tells Claude Code to
   plan the types first, build and unit-test the scoring engine, then build the UI,
   and seed 5 sample candidates.

5. **Approve the plan, then let it build.** Approve the data-model/types step before it
   scaffolds — that's the cheapest place to steer. After the engine + tests pass, have
   it show you the ranked sample output before it builds the full UI.

## Phase 0 = the MVP (what gets built first)

A local React + Vite + TypeScript app, no backend, that:
- takes pasted / `.txt` resumes,
- scores them on hiring-manager tiered criteria (deal-breaker / medium / bonus),
  a recruiter layer (work-eligibility, location, custom), and baseline quality
  signals (evidence, consistency, AI-likelihood),
- ranks candidates with a fully explainable, override-able breakdown,
- ships with 5 sample candidates so it works on first run.

Parsing real PDFs/DOCX, the MCP verification connectors, and the candidate-blind
**calibration advisor** are later phases — already specced in `PRD.md`, deliberately
out of the first build so you get something working fast.

## A couple of reminders baked into the spec

- The **work-authorization** criterion is framed as "eligible to work in [location]
  without sponsorship," not "immigration status" — safer and still captures the
  business need. Run the final criteria set past employment counsel.
- The **calibration advisor** (Phase 2) is candidate-blind by design: it audits whether
  your *criteria* predict success, it does not profile applicants against past hires.
  That's the deliberate fix for the bias risk in the original idea.

## Want me to go further?

I can also generate, on request:
- a starter `package.json` + Vite/TS/Tailwind config so Claude Code skips setup,
- the `src/engine/types.ts` data model pre-written so it starts from your shapes,
- a one-page pitch deck framing this for a recruiter or vendor audience.
