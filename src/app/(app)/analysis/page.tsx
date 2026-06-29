'use client';

import { useState, useEffect, useCallback } from 'react';
import { analyzeTeamAction } from '@/server/actions/analysis.actions';
import { getUserTeamsAction } from '@/server/actions/team.actions';
import { CoverageMatrix } from '@/components/features/analysis/coverage-matrix';
import { WeaknessReportView } from '@/components/features/analysis/weakness-report';
import { SpeedTiers } from '@/components/features/analysis/speed-tiers';
import { SynergyDisplay } from '@/components/features/analysis/synergy-display';
import type { AnalysisReport } from '@/server/services/analysis/types';

interface TeamSummary {
  id: string;
  name: string;
}

type TabId = 'overview' | 'offensive' | 'defensive' | 'speed' | 'synergy';

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'offensive', label: 'Offensive' },
  { id: 'defensive', label: 'Defensive' },
  { id: 'speed', label: 'Speed' },
  { id: 'synergy', label: 'Synergy' },
];

export default function AnalysisPage() {
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  useEffect(() => {
    async function loadTeams() {
      const result = await getUserTeamsAction();
      if (result.success && Array.isArray(result.data)) {
        setTeams(
          (result.data as Array<{ id: string; name: string }>).map((t) => ({
            id: t.id,
            name: t.name,
          }))
        );
      }
    }
    loadTeams();
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!selectedTeamId) return;

    setLoading(true);
    setError(null);
    setReport(null);

    const result = await analyzeTeamAction(selectedTeamId);
    if (result.success && result.data) {
      setReport(result.data);
    } else {
      setError(result.error ?? 'Failed to analyze team');
    }

    setLoading(false);
  }, [selectedTeamId]);

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold">Team Analysis</h1>

        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="form-control flex-1">
                <label className="label" htmlFor="team-select">
                  <span className="label-text">Select Team</span>
                </label>
                <select
                  id="team-select"
                  className="select select-bordered w-full"
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                >
                  <option value="">Choose a team...</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                className="btn btn-primary"
                onClick={handleAnalyze}
                disabled={!selectedTeamId || loading}
              >
                {loading ? <span className="loading loading-spinner loading-sm" /> : null}
                Analyze
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert-error" role="alert">
            <span>{error}</span>
          </div>
        )}

        {report && (
          <>
            <div className="stats stats-vertical lg:stats-horizontal shadow w-full">
              <div className="stat">
                <div className="stat-title">Overall Score</div>
                <div className="stat-value text-primary">{report.overallScore}</div>
                <div className="stat-desc">out of 100</div>
              </div>
              <div className="stat">
                <div className="stat-title">Offensive</div>
                <div className="stat-value text-success text-2xl">
                  {report.offensiveCoverage.coverageScore}%
                </div>
              </div>
              <div className="stat">
                <div className="stat-title">Defensive</div>
                <div className="stat-value text-info text-2xl">
                  {report.defensiveCoverage.defensiveScore}
                </div>
              </div>
              <div className="stat">
                <div className="stat-title">Synergy</div>
                <div className="stat-value text-accent text-2xl">
                  {report.synergyAnalysis.synergyScore}
                </div>
              </div>
            </div>

            {report.strengths.length > 0 && (
              <div className="alert alert-success">
                <div>
                  <h3 className="font-bold">Strengths</h3>
                  <ul className="list-disc list-inside text-sm">
                    {report.strengths.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {report.weaknesses.length > 0 && (
              <div className="alert alert-warning">
                <div>
                  <h3 className="font-bold">Weaknesses</h3>
                  <ul className="list-disc list-inside text-sm">
                    {report.weaknesses.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="tabs tabs-boxed" role="tablist">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  className={`tab ${activeTab === tab.id ? 'tab-active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'overview' && (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="card bg-base-100 shadow-md">
                    <div className="card-body">
                      <h2 className="card-title text-lg">Balance</h2>
                      <div className="stats stats-vertical">
                        <div className="stat">
                          <div className="stat-title">Physical</div>
                          <div className="stat-value text-error text-2xl">
                            {report.balanceAnalysis.physicalPercentage}%
                          </div>
                          <div className="stat-desc">
                            {report.balanceAnalysis.physicalMoves} moves
                          </div>
                        </div>
                        <div className="stat">
                          <div className="stat-title">Special</div>
                          <div className="stat-value text-info text-2xl">
                            {report.balanceAnalysis.specialPercentage}%
                          </div>
                          <div className="stat-desc">
                            {report.balanceAnalysis.specialMoves} moves
                          </div>
                        </div>
                        <div className="stat">
                          <div className="stat-title">Status</div>
                          <div className="stat-value text-base-content text-2xl">
                            {report.balanceAnalysis.statusMoves}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm mt-2">{report.balanceAnalysis.recommendation}</p>
                    </div>
                  </div>

                  <div className="card bg-base-100 shadow-md">
                    <div className="card-body">
                      <h2 className="card-title text-lg">Recommendations</h2>
                      <div className="flex flex-col gap-2">
                        {report.recommendations.map((rec, i) => (
                          <div key={i} className="alert alert-info">
                            <span className="text-sm">{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'offensive' && <CoverageMatrix data={report.offensiveCoverage} />}

            {activeTab === 'defensive' && (
              <div className="flex flex-col gap-4">
                <WeaknessReportView data={report.weaknessReport} />
              </div>
            )}

            {activeTab === 'speed' && <SpeedTiers data={report.speedAnalysis} />}

            {activeTab === 'synergy' && <SynergyDisplay data={report.synergyAnalysis} />}
          </>
        )}
      </div>
    </div>
  );
}
