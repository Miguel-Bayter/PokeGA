'use client';

import { getTypeBadgeClasses } from '@/lib/type-colors';
import type { SynergyAnalysis } from '@/server/services/analysis/types';

interface SynergyDisplayProps {
  data: SynergyAnalysis;
}

/**
 * Displays detected type cores with type badges, synergy score, and type coverage.
 */
export function SynergyDisplay({ data }: SynergyDisplayProps) {
  return (
    <div className="card bg-base-100 shadow-md">
      <div className="card-body">
        <h2 className="card-title text-lg">Type Synergy</h2>

        <div className="stats stats-vertical sm:stats-horizontal shadow mb-4">
          <div className="stat">
            <div className="stat-title">Synergy Score</div>
            <div className="stat-value text-primary text-2xl">{data.synergyScore}</div>
          </div>
          <div className="stat">
            <div className="stat-title">Type Coverage</div>
            <div className="stat-value text-secondary text-2xl">{data.typeCoverage}/18</div>
            <div className="stat-desc">Offensive types represented</div>
          </div>
          <div className="stat">
            <div className="stat-title">Cores Detected</div>
            <div className="stat-value text-accent text-2xl">{data.cores.length}</div>
          </div>
        </div>

        <div
          className="radial-progress text-primary"
          style={{ '--value': data.synergyScore, '--size': '8rem' } as React.CSSProperties}
          role="progressbar"
          aria-label="Synergy score"
        >
          {data.synergyScore}%
        </div>

        {data.cores.length > 0 ? (
          <div className="flex flex-col gap-3 mt-4">
            <h3 className="font-semibold">Detected Cores</h3>
            {data.cores.map((core) => (
              <div key={core.name} className="card card-compact bg-base-200">
                <div className="card-body">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{core.name}</span>
                    <div className="flex gap-1">
                      {core.types.map((type) => (
                        <div key={type} className={getTypeBadgeClasses(type)}>
                          <span className="capitalize text-xs">{type}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <p className="text-sm opacity-70">{core.description}</p>

                  {core.pokemon.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {core.pokemon.map((name) => (
                        <div key={name} className="badge badge-outline badge-sm">
                          {name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="alert alert-warning mt-4">
            <span>
              No type cores detected. Consider building around a known core for better synergy.
            </span>
          </div>
        )}

        {data.recommendations.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Recommendations</h3>
            <div className="flex flex-col gap-2">
              {data.recommendations.map((rec, i) => (
                <div key={i} className="alert alert-info">
                  <span className="text-sm">{rec}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
