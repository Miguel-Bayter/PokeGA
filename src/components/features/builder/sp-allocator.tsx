'use client';

import { useTeamBuilderStore, DEFAULT_STAT_POINTS } from '@/stores/team-builder.store';

const STAT_LABELS: { key: keyof typeof DEFAULT_STAT_POINTS; label: string }[] = [
  { key: 'hp', label: 'HP' },
  { key: 'atk', label: 'Attack' },
  { key: 'def', label: 'Defense' },
  { key: 'spAtk', label: 'Sp. Atk' },
  { key: 'spDef', label: 'Sp. Def' },
  { key: 'spd', label: 'Speed' },
];

const MAX_SP_PER_STAT = 32;
const TOTAL_SP = 66;

export function SPAllocator() {
  const { activeSlotIndex, members, updateMemberField } = useTeamBuilderStore();
  const member = members[activeSlotIndex];

  if (!member) {
    return (
      <div className="card bg-base-100 shadow-md">
        <div className="card-body items-center text-center py-8">
          <p className="text-base-content/60">Select a Pokemon to allocate Stat Points</p>
        </div>
      </div>
    );
  }

  const { statPoints } = member;
  const totalUsed =
    statPoints.hp +
    statPoints.atk +
    statPoints.def +
    statPoints.spAtk +
    statPoints.spDef +
    statPoints.spd;
  const remaining = TOTAL_SP - totalUsed;
  const isOverLimit = totalUsed > TOTAL_SP;

  const handleStatChange = (stat: keyof typeof DEFAULT_STAT_POINTS, value: number) => {
    const newStatPoints = { ...statPoints, [stat]: value };
    updateMemberField(activeSlotIndex, 'statPoints', newStatPoints);
  };

  return (
    <div className="card bg-base-100 shadow-md">
      <div className="card-body">
        <div className="flex items-center justify-between">
          <h2 className="card-title text-lg">Stat Points</h2>
          <div
            className={`stat-value text-2xl ${isOverLimit ? 'text-error' : remaining === 0 ? 'text-success' : 'text-base-content'}`}
            aria-live="polite"
            aria-label={`SP remaining: ${remaining}`}
          >
            {remaining} SP left
          </div>
        </div>

        <div className="flex flex-col gap-3 mt-2">
          {STAT_LABELS.map(({ key, label }) => {
            const value = statPoints[key];
            const percentage = (value / MAX_SP_PER_STAT) * 100;
            const isMaxed = value >= MAX_SP_PER_STAT;

            return (
              <div key={key} className="form-control">
                <div className="flex items-center justify-between mb-1">
                  <label className="label-text font-medium" htmlFor={`sp-${key}`}>
                    {label}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      id={`sp-${key}`}
                      className="input input-bordered input-xs w-16 text-center"
                      min={0}
                      max={MAX_SP_PER_STAT}
                      value={value}
                      onChange={(e) => {
                        const val = Math.min(MAX_SP_PER_STAT, Math.max(0, Number(e.target.value)));
                        handleStatChange(key, val);
                      }}
                      aria-label={`${label} stat points`}
                    />
                  </div>
                </div>
                <progress
                  className={`progress w-full ${isOverLimit ? 'progress-error' : isMaxed ? 'progress-success' : 'progress-primary'}`}
                  value={percentage}
                  max={100}
                  aria-label={`${label}: ${value} out of ${MAX_SP_PER_STAT}`}
                />
                <input
                  type="range"
                  className="range range-primary range-xs mt-1"
                  min={0}
                  max={MAX_SP_PER_STAT}
                  value={value}
                  onChange={(e) => handleStatChange(key, Number(e.target.value))}
                  aria-label={`${label} slider`}
                />
              </div>
            );
          })}
        </div>

        {isOverLimit && (
          <div className="alert alert-error mt-3" role="alert">
            <span className="text-sm">
              Total SP ({totalUsed}) exceeds the limit of {TOTAL_SP}. Reduce stats to continue.
            </span>
          </div>
        )}

        {remaining === 0 && !isOverLimit && (
          <div className="alert alert-success mt-3" role="status">
            <span className="text-sm">All {TOTAL_SP} SP allocated perfectly!</span>
          </div>
        )}
      </div>
    </div>
  );
}
