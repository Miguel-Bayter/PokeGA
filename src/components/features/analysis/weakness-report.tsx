'use client';

import { getTypeBadgeClasses } from '@/lib/type-colors';
import type { WeaknessReport } from '@/server/services/analysis/types';

interface WeaknessReportProps {
  data: WeaknessReport;
}

function getSeverityBadge(severity: string): string {
  switch (severity) {
    case 'critical':
      return 'badge-error';
    case 'high':
      return 'badge-warning';
    case 'medium':
      return 'badge-info';
    default:
      return 'badge-ghost';
  }
}

/**
 * Displays shared team weaknesses with severity badges, affected Pokemon, and cover suggestions.
 */
export function WeaknessReportView({ data }: WeaknessReportProps) {
  if (data.sharedWeaknesses.length === 0) {
    return (
      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <h2 className="card-title text-lg">Weakness Report</h2>
          <div className="alert alert-success">
            <span>No significant shared weaknesses detected. Good defensive coverage!</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-100 shadow-md">
      <div className="card-body">
        <div className="flex items-center justify-between">
          <h2 className="card-title text-lg">Weakness Report</h2>
          {data.criticalCount > 0 && (
            <div className="badge badge-error badge-lg">{data.criticalCount} Critical</div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {data.sharedWeaknesses.map((weakness) => (
            <div key={weakness.type} className="card card-compact bg-base-200">
              <div className="card-body flex-row items-center gap-4">
                <div className={getTypeBadgeClasses(weakness.type)}>
                  <span className="capitalize">{weakness.type}</span>
                </div>

                <div className={`badge ${getSeverityBadge(weakness.severity)}`}>
                  {weakness.severity}
                </div>

                <div className="flex-1">
                  <span className="text-sm font-medium">
                    {weakness.weakPokemonCount} Pokemon weak
                  </span>
                </div>

                {weakness.suggestedCovers.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {weakness.suggestedCovers.slice(0, 3).map((cover) => (
                      <div key={cover} className="badge badge-outline badge-sm">
                        {cover}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

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
