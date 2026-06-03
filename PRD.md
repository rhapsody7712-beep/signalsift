# SignalSift — Product Requirements Document

**Status:** Draft v1.0 · **Owner:** [you] · **Date:** June 2026
**Audience:** Engineering (incl. Claude Code build), product, recruiting stakeholders

---

## 1. Summary

SignalSift is an AI-resilient candidate screening platform. It ingests a batch of
resumes for a role and produces a **ranked, explainable Signal Score** for each
candidate, driven by criteria the hiring manager and recruiter define — not a
generic rubric. Its differentiator is twofold: (1) it rewards verifiable evidence
over fluent, AI-generated prose, and (2) it uses historical hiring outcomes to
**calibrate the criteria themselves**, not to profile candidates.

---

## 2. Problem

A single open role attracts thousands of applications. Generative AI has collapsed
the cost of producing a polished, keyword-optimized resume to near zero, while the
cost of reviewing one has not. The traditional screening signals — fluent writing,
the right buzzwords, clean formatting — are now noise that anyone can manufacture.
Candidates with real, verifiable accomplishments are buried under well-written
template text.

**Core tension:** cost to generate an application → ~0; cost to review one →
unchanged. Recruiters drown; signal loses to eloquence.

---

## 3. Goals & non-goals

### Goals
- Rank candidates by an explainable composite score that leads with the hiring
  manager's stated priorities.
- Reward quantified, consistent, verifiable evidence; penalize template/AI fluff
  as one probabilistic input (never an auto-reject).
- Let hiring managers define tiered criteria and recruiters add an operational layer.
- Use historical outcomes to improve the **rubric**, candidate-blind.
- Keep a human in the loop with one-click override on everything.

### Non-goals (for v1)
- External verification connectors (LinkedIn/Indeed/GitHub) — architected for, not built.
- Automated rejection or any decision without human review.
- Reliable "is this AI-written" detection as a verdict (treated as a confidence signal only).

---

## 4. Users

- **Hiring manager** — owns role-fit criteria and their weighting tiers.
- **Recruiter** — owns operational/eligibility criteria; runs batches; reviews ranking.
- (Future) **Recruiting ops / compliance** — reviews audit and adverse-impact reports.

---

## 5. Functional requirements

### 5.1 Resume ingestion
- Batch upload of PDF, DOCX, and plain text.
- Reliable text extraction across varied ATS formats.
- v0/demo: accept pasted text and `.txt` upload (parsing in a later phase).

### 5.2 Hiring-manager criteria & tiered weighting (core)
- Manager defines **5–7 criteria** per role.
- Criteria are assigned to tiers:
  - **Deal-breakers (3–4):** highest weight. Per criterion, the manager chooses
    **hard gate** (auto-disqualify on a true miss) or **strong penalty** (heavy
    negative, still rankable).
  - **Medium (~2):** meaningful weight, not disqualifying.
  - **Preferred / bonus (1–2):** low weight; breaks ties, elevates equal candidates.
- The product **leads with these signals**: deal-breakers carry the dominant share.
- Ranked output shows, per candidate, the result against each named criterion at
  its tier.
- Criteria, tiers, and weights are editable; ranking re-scores in real time.

### 5.3 Recruiter criteria (separate, labeled layer)
- Recruiters add their own criteria, clearly distinguished from the manager's.
- Must support at least:
  - **Work authorization** — framed as "eligible to work in [location] without
    sponsorship," not "immigration status" (see Compliance).
  - **Location / work-eligible geography or onsite radius.**
  - **≥1 fully custom criterion** (free-form, with weight + tier), extensible.
- Legally sensitive factors governed per Compliance section and flagged in the UI.

### 5.4 Baseline resume-quality signals
- **Evidence density** — quantified, concrete, verifiable accomplishments.
- **Internal consistency** — dates, tenures, contradictory claims.
- **AI/template likelihood** — probabilistic, with stated confidence; one input only.

### 5.5 Composite scoring & ranking
- Combine: manager tiered criteria + recruiter criteria + baseline quality signals.
- Produce a 0–100 Signal Score and a ranked list.
- Per-candidate breakdown: each criterion at its tier with its result, evidence
  detected, human-readable flags with reasons.
- One-click human override on any flag, criterion result, or score.

### 5.6 Criteria calibration from outcome data (adaptive, candidate-blind)
This replaces "score candidates against past hires." The system learns from
historical outcomes (hired + succeeded, or advanced past key stages) and applies
that learning to **criteria, not candidates**:
- Recommends to the manager: deal-breakers rarely present in strong hires (→ downgrade),
  medium/bonus criteria that were highly predictive (→ promote tier), and recurring
  **accomplishment patterns** in successful hires missing from the criteria (→ add).
- **Recommendation to a human only** — never auto-adjusts weights or scores a candidate.
- **Candidate-blind** — evaluates the predictive value of criteria against outcomes;
  must never learn from or recommend criteria based on protected attributes or proxies.
- Shows its evidence/support for each recommendation; manager accepts, edits, or rejects.
- Requires documented adverse-impact testing before any recommendation surfaces.

---

## 6. Non-functional requirements

- **Explainability:** every score, criterion result, and flag shows reasoning and
  underlying source text. No black box.
- **Bias & compliance:** anchor on verifiable evidence, not writing style, names, or
  pedigree. Support audit reporting and adverse-impact analysis.
- **Compliance on sensitive criteria:** work-authorization and location are legally
  sensitive (e.g., EEOC, INA citizenship/national-origin protections, GDPR-type data
  rules). Handle in line with applicable fair-hiring law, keep auditable, never use as
  proxies for protected characteristics. **Recommend legal review of the final
  criteria set.**
- **Human-in-the-loop:** the tool assists judgment; it never decides.
- **Privacy:** candidate data minimized, access-controlled, retention-bounded.

---

## 7. Architecture (concept; v1 scope marked)

```
                 ┌─────────────────────────────────────────────┐
                 │              SignalSift Core                 │
  Resumes ──▶    │  Ingest → Extract → Feature extraction       │   [v1]
                 │                      │                       │
  Manager     ─▶ │  Criteria engine (tiers, weights, gates)     │   [v1]
  Recruiter   ─▶ │  Criteria engine (operational layer)         │   [v1]
                 │                      │                       │
                 │  Scoring & ranking (composite, explainable)  │   [v1]
                 │                      │                       │
  Outcomes    ─▶ │  Calibration advisor (candidate-blind)       │   [v2]
                 │                      │                       │
                 │  MCP controller ──▶ external connectors      │   [v3+]
                 └─────────────────────────────────────────────┘
                                        │
                                  Recruiter UI: ranked list,
                                  breakdowns, overrides, audit
```

- Source integrations (future) are **swappable MCP connector modules** so adding
  LinkedIn/Indeed/GitHub later doesn't re-engineer the core.

---

## 8. Roadmap

| Phase | Scope | Outcome |
|---|---|---|
| **0 — Demo/MVP** | Local text scoring; manager tiered criteria + recruiter layer; explainable ranking; overrides | Prove ranking + explainability UX |
| **1 — Parsing** | PDF/DOCX ingestion, ATS-format handling, batch upload | Handle real recruiter inboxes |
| **2 — Calibration** | Candidate-blind criteria calibration advisor + adverse-impact testing | Rubric improves from outcomes, safely |
| **3 — Verification** | MCP controller + first connector (consented, candidate-initiated) | Move from scoring claims to verifying them |
| **4 — Integration** | ATS plugins, dashboard, audit + bias reporting | Production deployment |

---

## 9. Success metrics

- **Time-to-shortlist** per role (down).
- **Top-set precision** — share of top-ranked candidates advancing past first interview.
- **Recovery rate** — strong candidates rescued from noise that keyword filters drop.
- **Explainability coverage** — share of scores fully explainable with source attribution.
- **Calibration impact** — improvement in criteria predictiveness after advisor adoption.
- **Fairness** — measured adverse impact across candidate groups (must stay within thresholds).

---

## 10. Open questions

- Minimum volume/quality of historical outcome data before calibration is trustworthy?
- How is "successful hire" defined and labeled (offer? ramp? performance review?)?
- Which protected-attribute proxies must be explicitly excluded for this org/jurisdiction?
- Build vs. buy for resume parsing (Phase 1)?
