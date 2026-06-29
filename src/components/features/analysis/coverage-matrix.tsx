'use client';

import { POKEMON_TYPES } from '@/lib/type-chart';
import { getTypeBadgeClasses } from '@/lib/type-colors';
import type { OffensiveCoverageResult } from '@/server/services/analysis/types';

interface CoverageMatrixProps {
  data: OffensiveCoverageResult;
}

function getCellColor(value: number): string {
  if (value >= 3) return 'bg-success text-success-content';
  if (value >= 2) return 'bg-success/60 text-success-content';
  if (value >= 1.5) return 'bg-warning/60 text-warning-content';
  if (value >= 1) return 'bg-base-200 text-base-content';
  if (value > 0) return 'bg-error/40 text-error-content';
  return 'bg-base-300 text-base-content';
}

function getCellLabel(value: number): string {
  if (value === 0) return '0';
  if (value < 1) return '½';
  if (value === 1) return '1';
  if (value < 2) return `${value.toFixed(1)}`;
  return `${Math.round(value)}`;
}

/**
 * 18x18 grid showing attacking vs defending type effectiveness.
 * Color-coded: green = super effective, red = not effective, gray = neutral.
 */
export function CoverageMatrix({ data }: CoverageMatrixProps) {
  return (
    <div className="card bg-base-100 shadow-md">
      <div className="card-body">
        <h2 className="card-title text-lg">Offensive Coverage Matrix</h2>
        <p className="text-sm opacity-70">
          Rows = attacking types, Columns = defending types. Higher values = better coverage.
        </p>

        <div className="overflow-x-auto">
          <table className="table table-xs table-compact">
            <thead>
              <tr>
                <th className="min-w-[80px]">ATK ↓ / DEF →</th>
                {POKEMON_TYPES.map((type) => {
                  return (
                    <th key={type} className="text-center min-w-[36px]">
                      <div className={`badge badge-xs ${getTypeBadgeClasses(type)}`} title={type}>
                        <span className="text-[9px] capitalize">{type.slice(0, 3)}</span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {POKEMON_TYPES.map((atkType) => {
                return (
                  <tr key={atkType}>
                    <td className="font-medium">
                      <div className={`badge badge-xs ${getTypeBadgeClasses(atkType)}`}>
                        <span className="text-[9px] capitalize">{atkType.slice(0, 3)}</span>
                      </div>
                    </td>
                    {POKEMON_TYPES.map((defType) => {
                      const value = data.matrix[atkType]?.[defType] ?? 0;
                      const cellClass = getCellColor(value);
                      const label = getCellLabel(value);

                      return (
                        <td key={defType} className={`text-center ${cellClass}`}>
                          <div
                            className="tooltip tooltip-top"
                            data-tip={`${atkType} → ${defType}: ${value.toFixed(1)}x`}
                          >
                            <span className="text-[10px] font-mono">{label}</span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex gap-4 mt-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-success" />
            <span>Super Effective (2x+)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-base-200" />
            <span>Neutral (1x)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-error/40" />
            <span>Not Very Effective (&lt;1x)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-base-300" />
            <span>Immune (0x)</span>
          </div>
        </div>

        <div className="stats stats-vertical sm:stats-horizontal shadow mt-4">
          <div className="stat">
            <div className="stat-title">Coverage Score</div>
            <div className="stat-value text-primary">{data.coverageScore}%</div>
            <div className="stat-desc">Types that can be hit super effectively</div>
          </div>
        </div>
      </div>
    </div>
  );
}
