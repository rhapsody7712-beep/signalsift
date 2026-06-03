import { useState, useMemo } from "react";
import { rankCandidates } from "./engine/score";
import {
  SAMPLE_CANDIDATES,
  SAMPLE_MANAGER_CRITERIA,
  SAMPLE_ORG_CRITERIA,
  SAMPLE_RECRUITER_CRITERIA,
} from "./data/samples";
import type { Candidate, ManagerCriteria, RecruiterCriteria } from "./engine/types";
import type { OverridesMap } from "./uitypes";
import CriteriaPanel from "./components/CriteriaPanel";
import CandidateList from "./components/CandidateList";
import ResumeIngestionModal from "./components/ResumeIngestionModal";

export default function App() {
  const [managerCriteria, setManagerCriteria] = useState<ManagerCriteria>(SAMPLE_MANAGER_CRITERIA);
  const [recruiterCriteria, setRecruiterCriteria] = useState<RecruiterCriteria>(SAMPLE_RECRUITER_CRITERIA);
  const [candidates, setCandidates] = useState<Candidate[]>(SAMPLE_CANDIDATES);
  const [expandedId, setExpandedId] = useState<string | null>("alice-chen");
  const [overrides, setOverrides] = useState<OverridesMap>({});
  const [showIngestion, setShowIngestion] = useState(false);

  const ranked = useMemo(
    () => rankCandidates(candidates, managerCriteria, recruiterCriteria, SAMPLE_ORG_CRITERIA),
    [candidates, managerCriteria, recruiterCriteria]
  );

  function handleAddCandidate(candidate: Candidate) {
    setCandidates(prev => [...prev, candidate]);
    setExpandedId(candidate.id);
  }

  function handleRemoveCandidate(candidateId: string) {
    setCandidates(prev => prev.filter(c => c.id !== candidateId));
    setExpandedId(prev => (prev === candidateId ? null : prev));
    setOverrides(prev => {
      const next = { ...prev };
      delete next[candidateId];
      return next;
    });
  }

  function handleOverride(candidateId: string, criterionId: string, result: import("./engine/types").CriterionResult, note: string) {
    setOverrides(prev => ({
      ...prev,
      [candidateId]: {
        criteria: { ...(prev[candidateId]?.criteria ?? {}), [criterionId]: { result, note } },
        dismissedFlags: prev[candidateId]?.dismissedFlags ?? [],
        manualScore: prev[candidateId]?.manualScore,
      },
    }));
  }

  function handleResetOverride(candidateId: string, criterionId: string) {
    setOverrides(prev => {
      const next = { ...(prev[candidateId]?.criteria ?? {}) };
      delete next[criterionId];
      return { ...prev, [candidateId]: { ...prev[candidateId], criteria: next, dismissedFlags: prev[candidateId]?.dismissedFlags ?? [] } };
    });
  }

  function handleDismissFlag(candidateId: string, flagCode: string) {
    setOverrides(prev => ({
      ...prev,
      [candidateId]: {
        criteria: prev[candidateId]?.criteria ?? {},
        dismissedFlags: [...(prev[candidateId]?.dismissedFlags ?? []), flagCode],
        manualScore: prev[candidateId]?.manualScore,
      },
    }));
  }

  function handleRestoreFlag(candidateId: string, flagCode: string) {
    setOverrides(prev => ({
      ...prev,
      [candidateId]: {
        ...prev[candidateId],
        criteria: prev[candidateId]?.criteria ?? {},
        dismissedFlags: (prev[candidateId]?.dismissedFlags ?? []).filter(f => f !== flagCode),
      },
    }));
  }

  function handleManualScore(candidateId: string, score: number | undefined) {
    setOverrides(prev => ({
      ...prev,
      [candidateId]: { ...prev[candidateId], criteria: prev[candidateId]?.criteria ?? {}, dismissedFlags: prev[candidateId]?.dismissedFlags ?? [], manualScore: score },
    }));
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {showIngestion && (
        <ResumeIngestionModal
          onAdd={handleAddCandidate}
          onClose={() => setShowIngestion(false)}
        />
      )}
      {/* Header */}
      <header className="shrink-0 bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold tracking-tight text-gray-900">SignalSift</span>
          <span className="text-gray-300">|</span>
          <span className="text-sm font-medium text-gray-600">Senior Platform / SRE Engineer</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span>{candidates.length} candidates</span>
          <span>{managerCriteria.criteria.length + recruiterCriteria.criteria.filter(c => c.enabled).length} active criteria</span>
          <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded border border-amber-200">
            Phase 0 · Local demo · No backend
          </span>
          <button
            onClick={() => setShowIngestion(true)}
            className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition-colors"
          >
            + Add Candidate
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Criteria panel */}
        <aside className="w-72 shrink-0 bg-white border-r border-gray-200 overflow-y-auto">
          <CriteriaPanel
            managerCriteria={managerCriteria}
            recruiterCriteria={recruiterCriteria}
            onManagerChange={setManagerCriteria}
            onRecruiterChange={setRecruiterCriteria}
          />
        </aside>

        {/* Right: Candidate list */}
        <main className="flex-1 overflow-y-auto">
          <CandidateList
            ranked={ranked}
            managerCriteria={managerCriteria}
            recruiterCriteria={recruiterCriteria}
            expandedId={expandedId}
            onToggleExpand={id => setExpandedId(prev => (prev === id ? null : id))}
            overrides={overrides}
            onOverride={handleOverride}
            onResetOverride={handleResetOverride}
            onDismissFlag={handleDismissFlag}
            onRestoreFlag={handleRestoreFlag}
            onManualScore={handleManualScore}
            onRemove={handleRemoveCandidate}
          />
        </main>
      </div>
    </div>
  );
}
