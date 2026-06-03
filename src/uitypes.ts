import type { CriterionResult } from "./engine/types";

export interface CriterionOverride {
  result: CriterionResult;
  note: string;
}

export interface CandidateOverrides {
  criteria: Record<string, CriterionOverride>;
  dismissedFlags: string[]; // flagCodes that have been dismissed
  manualScore?: number;
}

export type OverridesMap = Record<string, CandidateOverrides>;
