'use client';

import type { SpeedAnalysisResult } from '@/server/services/analysis/types';

interface SpeedTiersProps {
  data: SpeedAnalysisResult;
}

/**
 * Displays speed tiers with bar visualization, fastest/slowest highlights, and speed gaps.
 */
export function SpeedTiers({ data }: SpeedTiersProps) {
  if (data.tiers.length === 0) {
    return (
      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <h2 className="card-title text-lg">Speed Tiers</h2>
          <p className="text-sm opacity-70">No speed data available.</p>
        </div>
      </div>
    );
  }

  const maxSpeed = data.fastest.finalSpeed;

  return (
    <div className="card bg-base-100 shadow-md">
      <div className="card-body">
        <h2 className="card-title text-lg">Speed Tiers</h2>

        <div className="stats stats-vertical sm:stats-horizontal shadow mb-4">
          <div className="stat">
            <div className="stat-title">Fastest</div>
            <div className="stat-value text-success text-2xl">{data.fastest.finalSpeed}</div>
            <div className="stat-desc">{data.fastest.pokemonName}</div>
          </div>
          <div className="stat">
            <div className="stat-title">Slowest</div>
            <div className="stat-value text-error text-2xl">{data.slowest.finalSpeed}</div>
            <div className="stat-desc">{data.slowest.pokemonName}</div>
          </div>
          <div className="stat">
            <div className="stat-title">Average</div>
            <div className="stat-value text-primary text-2xl">{data.averageSpeed}</div>
          </div>
          <div className="stat">
            <div className="stat-title">Speed Score</div>
            <div className="stat-value text-secondary text-2xl">{data.speedScore}</div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {data.tiers.map((tier) => {
            const barWidth = maxSpeed > 0 ? (tier.finalSpeed / maxSpeed) * 100 : 0;
            const isFastest = tier.rank === 1;
            const isSlowest = tier.rank === data.tiers.length;

            return (
              <div key={tier.pokemonName} className="flex items-center gap-3">
                <div className="badge badge-sm badge-outline min-w-[24px] justify-center">
                  #{tier.rank}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">
                      {tier.pokemonName}
                      {isFastest && (
                        <span className="badge badge-success badge-xs ml-2">Fastest</span>
                      )}
                      {isSlowest && data.tiers.length > 1 && (
                        <span className="badge badge-error badge-xs ml-2">Slowest</span>
                      )}
                    </span>
                    <span className="text-sm font-mono">{tier.finalSpeed} Spe</span>
                  </div>

                  <progress
                    className={`progress w-full ${
                      isFastest
                        ? 'progress-success'
                        : isSlowest
                          ? 'progress-error'
                          : 'progress-primary'
                    }`}
                    value={barWidth}
                    max={100}
                    aria-label={`${tier.pokemonName} speed: ${tier.finalSpeed}`}
                  />

                  <div className="flex gap-2 text-xs opacity-60 mt-1">
                    <span>Base: {tier.baseSpeed}</span>
                    <span>SP: {tier.allocatedSP}</span>
                    <span className="capitalize">{tier.nature}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {data.speedGaps.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold text-sm mb-2">Speed Gaps</h3>
            <div className="flex flex-wrap gap-2">
              {data.speedGaps.map((gap, i) => (
                <div key={i} className="badge badge-ghost badge-sm">
                  {data.tiers[i].pokemonName} → {data.tiers[i + 1].pokemonName}: {gap}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
