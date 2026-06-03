import { effectiveWeight, TIER_DEFAULT_WEIGHTS } from "../engine/criteria";
import type {
  Criterion,
  DealBreakerBehavior,
  ManagerCriteria,
  RecruiterCriteria,
  RecruiterCriterionType,
  Tier,
} from "../engine/types";

interface Props {
  managerCriteria: ManagerCriteria;
  recruiterCriteria: RecruiterCriteria;
  onManagerChange: (c: ManagerCriteria) => void;
  onRecruiterChange: (c: RecruiterCriteria) => void;
}

const TIER_LABELS: Record<Tier, string> = {
  deal_breaker: "Deal-breakers",
  medium: "Medium",
  preferred: "Preferred",
};

const TIER_HEADER: Record<Tier, string> = {
  deal_breaker: "text-red-700",
  medium: "text-blue-700",
  preferred: "text-gray-500",
};

const TIER_CHIP: Record<Tier, string> = {
  deal_breaker: "bg-red-50 text-red-700 border-red-200",
  medium: "bg-blue-50 text-blue-700 border-blue-200",
  preferred: "bg-gray-50 text-gray-500 border-gray-200",
};

function totalWeight(criteria: Criterion[], recruiter: RecruiterCriterionType[]): number {
  return (
    criteria.reduce((s, c) => s + effectiveWeight(c), 0) +
    recruiter.filter(c => c.enabled).reduce((s, c) => s + effectiveWeight(c), 0)
  );
}

function pct(criterion: Criterion, allCriteria: Criterion[], allRecruiter: RecruiterCriterionType[]): number {
  const total = totalWeight(allCriteria, allRecruiter);
  return total > 0 ? Math.round((effectiveWeight(criterion) / total) * 100) : 0;
}

// ─── Manager criterion row ────────────────────────────────────────────────────

function ManagerCriterionRow({
  criterion,
  allCriteria,
  allRecruiter,
  onChange,
}: {
  criterion: Criterion;
  allCriteria: Criterion[];
  allRecruiter: RecruiterCriterionType[];
  onChange: (c: Criterion) => void;
}) {
  const influence = pct(criterion, allCriteria, allRecruiter);
  const w = criterion.weight ?? TIER_DEFAULT_WEIGHTS[criterion.tier];

  return (
    <div className="py-2.5 border-b border-gray-100 last:border-0">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 leading-snug">{criterion.label}</p>
          {criterion.tier === "deal_breaker" && (
            <select
              value={criterion.dealBreakerBehavior ?? "strong_penalty"}
              onChange={e =>
                onChange({ ...criterion, dealBreakerBehavior: e.target.value as DealBreakerBehavior })
              }
              className="mt-0.5 text-xs text-gray-500 bg-transparent border-0 p-0 cursor-pointer focus:ring-0"
            >
              <option value="hard_gate">hard gate — auto-disqualify on miss</option>
              <option value="strong_penalty">strong penalty — heavy negative, still ranked</option>
            </select>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0 mt-0.5">
          <span className="text-xs text-gray-400">{influence}%</span>
          <input
            type="number"
            min="0.1"
            max="10"
            step="0.1"
            value={w}
            onChange={e => {
              const v = parseFloat(e.target.value);
              if (!isNaN(v) && v > 0) onChange({ ...criterion, weight: v });
            }}
            className="w-14 text-xs text-right border border-gray-200 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
            title="Raw weight (engine normalizes to percentages)"
          />
        </div>
      </div>
      <div className="mt-1.5 flex items-center gap-1.5">
        <span className={`text-xs px-1.5 py-0.5 rounded border ${TIER_CHIP[criterion.tier]}`}>
          {TIER_LABELS[criterion.tier]}
        </span>
        <select
          value={criterion.tier}
          onChange={e => {
            const tier = e.target.value as Tier;
            onChange({
              ...criterion,
              tier,
              dealBreakerBehavior:
                tier === "deal_breaker"
                  ? (criterion.dealBreakerBehavior ?? "strong_penalty")
                  : undefined,
            });
          }}
          className="text-xs text-gray-500 bg-transparent border-0 p-0 cursor-pointer focus:ring-0"
        >
          <option value="deal_breaker">→ deal-breaker</option>
          <option value="medium">→ medium</option>
          <option value="preferred">→ preferred</option>
        </select>
      </div>
    </div>
  );
}

// ─── Recruiter criterion row ──────────────────────────────────────────────────

function RecruiterCriterionRow({
  criterion,
  allCriteria,
  allRecruiter,
  onChange,
}: {
  criterion: RecruiterCriterionType;
  allCriteria: Criterion[];
  allRecruiter: RecruiterCriterionType[];
  onChange: (c: RecruiterCriterionType) => void;
}) {
  const influence = criterion.enabled ? pct(criterion, allCriteria, allRecruiter) : 0;
  const w = criterion.weight ?? TIER_DEFAULT_WEIGHTS[criterion.tier];
  const kindLabel: Record<string, string> = { work_auth: "work-auth", location: "location", custom: "custom" };

  return (
    <div className={`py-2.5 border-b border-gray-100 last:border-0 ${!criterion.enabled ? "opacity-40" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          {/* Toggle */}
          <button
            onClick={() => onChange({ ...criterion, enabled: !criterion.enabled })}
            className={`mt-0.5 w-8 h-4 rounded-full transition-colors shrink-0 ${
              criterion.enabled ? "bg-blue-500" : "bg-gray-200"
            }`}
            title={criterion.enabled ? "Disable this criterion" : "Enable this criterion"}
          >
            <span
              className={`block w-3 h-3 bg-white rounded-full shadow transition-transform ${
                criterion.enabled ? "translate-x-4" : "translate-x-0.5"
              }`}
            />
          </button>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 leading-snug">{criterion.label}</p>
            <span className="text-xs text-gray-400">{kindLabel[criterion.kind]}</span>
          </div>
        </div>
        {criterion.enabled && (
          <div className="flex items-center gap-1 shrink-0 mt-0.5">
            <span className="text-xs text-gray-400">{influence}%</span>
            <input
              type="number"
              min="0.1"
              max="10"
              step="0.1"
              value={w}
              onChange={e => {
                const v = parseFloat(e.target.value);
                if (!isNaN(v) && v > 0) onChange({ ...criterion, weight: v });
              }}
              className="w-14 text-xs text-right border border-gray-200 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>
        )}
      </div>
      {criterion.enabled && (
        <div className="mt-1.5">
          <span className={`text-xs px-1.5 py-0.5 rounded border ${TIER_CHIP[criterion.tier]}`}>
            {TIER_LABELS[criterion.tier]}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Main panel ──────────────────────────────────────────────────────────────

export default function CriteriaPanel({
  managerCriteria,
  recruiterCriteria,
  onManagerChange,
  onRecruiterChange,
}: Props) {
  const tiers: Tier[] = ["deal_breaker", "medium", "preferred"];

  function updateManagerCriterion(updated: Criterion) {
    onManagerChange({
      ...managerCriteria,
      criteria: managerCriteria.criteria.map(c => (c.id === updated.id ? updated : c)),
    });
  }

  function updateRecruiterCriterion(updated: RecruiterCriterionType) {
    onRecruiterChange({
      ...recruiterCriteria,
      criteria: recruiterCriteria.criteria.map(c =>
        c.id === updated.id ? updated : c
      ) as RecruiterCriterionType[],
    });
  }

  return (
    <div className="p-4 space-y-6">
      {/* Manager criteria */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">
            Manager Criteria
          </h2>
          <span className="text-xs text-gray-400 italic">hiring manager's layer</span>
        </div>

        <p className="text-xs text-gray-400 mb-3 leading-relaxed">
          Edit weights (raw — engine normalizes). Change tier or deal-breaker
          behavior. Re-ranking is instant.
        </p>

        {tiers.map(tier => {
          const criteria = managerCriteria.criteria.filter(c => c.tier === tier);
          if (criteria.length === 0) return null;
          return (
            <div key={tier} className="mb-4">
              <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${TIER_HEADER[tier]}`}>
                {TIER_LABELS[tier]}
              </p>
              {criteria.map(c => (
                <ManagerCriterionRow
                  key={c.id}
                  criterion={c}
                  allCriteria={managerCriteria.criteria}
                  allRecruiter={recruiterCriteria.criteria}
                  onChange={updateManagerCriterion}
                />
              ))}
            </div>
          );
        })}
      </section>

      <div className="border-t border-dashed border-gray-200" />

      {/* Recruiter criteria */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">
            Recruiter Criteria
          </h2>
          <span className="text-xs text-gray-400 italic">separate layer</span>
        </div>

        <p className="text-xs text-gray-400 mb-3 leading-relaxed">
          Toggle on/off per role. Work authorization is framed as eligibility
          without sponsorship — not immigration status.
        </p>

        {recruiterCriteria.criteria.map(c => (
          <RecruiterCriterionRow
            key={c.id}
            criterion={c}
            allCriteria={managerCriteria.criteria}
            allRecruiter={recruiterCriteria.criteria}
            onChange={updateRecruiterCriterion}
          />
        ))}
      </section>

      {/* Hard rules reminder */}
      <div className="bg-amber-50 border border-amber-200 rounded p-3 text-xs text-amber-700 space-y-1">
        <p className="font-semibold">Hard rules enforced</p>
        <p>· Every score is traceable to a criterion and evidence.</p>
        <p>· AI likelihood is a signal — it never auto-rejects.</p>
        <p>· Override is available on every result, flag, and score.</p>
        <p>· No protected-attribute logic anywhere in the engine.</p>
      </div>
    </div>
  );
}
