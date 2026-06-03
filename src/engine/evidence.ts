/**
 * Baseline resume-quality signals.
 * All functions are pure — no React, no side-effects.
 *
 * AI/template likelihood is ALWAYS probabilistic with a confidence value.
 * It contributes to the quality signal but NEVER auto-disqualifies.
 */

// ─── Evidence density ─────────────────────────────────────────────────────────

/**
 * Returns a 0–1 score representing how densely the resume is packed
 * with quantified, verifiable accomplishments.
 */
export function scoreEvidenceDensity(text: string): number {
  const patterns = [
    /\b\d+\s*%/g,                                               // percentages
    /\$[\d,]+(?:\.\d+)?(?:\s*(?:k|m|b|million|billion))?/gi,   // dollar amounts
    /\b\d+x\b/gi,                                               // multipliers (2x, 10x)
    /\b\d+(?:,\d{3})+\b/g,                                     // large numbers with commas
    /\b\d+\s*(?:million|billion|thousand)\b/gi,                 // magnitude words
    /\b(?:increased|decreased|reduced|improved|grew|saved|generated|delivered|cut|drove)\b.{0,60}\b\d+/gi,
  ];

  let totalMatches = 0;
  for (const pattern of patterns) {
    totalMatches += (text.match(pattern) ?? []).length;
  }

  const wordCount = text.split(/\s+/).filter(Boolean).length;
  if (wordCount === 0) return 0;

  // Cap at 8 quantified signals per 100 words = 1.0
  const density = (totalMatches / wordCount) * 100;
  return Math.min(1.0, density / 8);
}

// ─── Internal consistency ──────────────────────────────────────────────────────

interface DateRange {
  start: number;
  end: number;
}

function extractDateRanges(text: string): DateRange[] {
  const currentYear = new Date().getFullYear();
  const ranges: DateRange[] = [];
  const pattern =
    /\b((?:19|20)\d{2})\s*[-–—]\s*((?:19|20)\d{2}|present|current|now)\b/gi;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    const start = parseInt(match[1], 10);
    const endStr = match[2].toLowerCase();
    const end =
      endStr === "present" || endStr === "current" || endStr === "now"
        ? currentYear
        : parseInt(match[2], 10);
    if (start <= end) ranges.push({ start, end });
  }
  return ranges;
}

function countOverlaps(ranges: DateRange[]): number {
  let overlaps = 0;
  for (let i = 0; i < ranges.length; i++) {
    for (let j = i + 1; j < ranges.length; j++) {
      const a = ranges[i];
      const b = ranges[j];
      if (a.start < b.end && b.start < a.end) overlaps++;
    }
  }
  return overlaps;
}

/**
 * Returns a 0–1 score for internal date/tenure consistency.
 * Overlapping date ranges and future start dates are penalized.
 * Returns 0.7 (benefit of the doubt) when no dates are found.
 */
export function scoreConsistency(text: string): number {
  const ranges = extractDateRanges(text);
  if (ranges.length === 0) return 0.7;

  const currentYear = new Date().getFullYear();
  const overlaps = countOverlaps(ranges);
  const futureDates = ranges.filter((r) => r.start > currentYear).length;

  return Math.max(0, Math.min(1, 1.0 - overlaps * 0.2 - futureDates * 0.15));
}

// ─── AI / template likelihood ─────────────────────────────────────────────────

const TEMPLATE_PHRASES: string[] = [
  "results-driven",
  "team player",
  "strong communication skills",
  "proven track record",
  "detail-oriented",
  "detail oriented",
  "passionate about",
  "leverage",
  "synergy",
  "thought leader",
  "innovative solution",
  "dynamic professional",
  "self-starter",
  "go-getter",
  "hard worker",
  "fast learner",
  "excellent communication",
  "strong interpersonal",
  "highly motivated",
  "seeking a challenging",
  "references available upon request",
  "responsible for",
  "duties included",
  "assisted in",
  "helped with",
  "worked on various",
];

/**
 * Returns a probabilistic AI/template likelihood score and confidence.
 *
 * score    0–1: higher = more likely AI-generated or template prose.
 * confidence 0–1: how many independent signals agree.
 *
 * IMPORTANT: this is a signal, not a verdict. It must never trigger
 * auto-disqualification.
 */
export function scoreAILikelihood(text: string): {
  score: number;
  confidence: number;
} {
  const lower = text.toLowerCase();
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  // Signal 1: template phrase density
  let templateHits = 0;
  for (const phrase of TEMPLATE_PHRASES) {
    if (lower.includes(phrase)) templateHits++;
  }
  const templateSignal = templateHits >= 5; // 5+ phrases strongly suggests template

  // Signal 2: low evidence density (AI often generalizes rather than quantifies)
  const evidenceDensity = scoreEvidenceDensity(text);
  const lowEvidenceSignal = evidenceDensity < 0.15;

  // Signal 3: unusually uniform sentence length (AI prose tends to be even)
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 10);
  const avgLen = sentences.length > 0 ? wordCount / sentences.length : 0;
  const uniformLengthSignal = avgLen > 22;

  // Composite score weighted by signal strength
  const templateScore = Math.min(1, templateHits / 5);
  const evidenceScore = lowEvidenceSignal ? 0.4 : 0;
  const structureScore = uniformLengthSignal ? 0.2 : 0;

  const score = Math.min(
    1,
    templateScore * 0.6 + evidenceScore * 0.3 + structureScore * 0.1
  );

  // Confidence: how many independent signals agree
  const agreeing = [templateSignal, lowEvidenceSignal, uniformLengthSignal].filter(Boolean).length;
  const confidence =
    agreeing === 3 ? 0.8 : agreeing === 2 ? 0.6 : agreeing === 1 ? 0.4 : 0.2;

  return { score, confidence };
}
