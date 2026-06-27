'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useTeamBuilderStore } from '@/stores/team-builder.store';
import { PokemonPicker } from '@/components/features/builder/pokemon-picker';
import { SetEditor } from '@/components/features/builder/set-editor';
import { SPAllocator } from '@/components/features/builder/sp-allocator';
import { TeamSlot } from '@/components/features/builder/team-slot';
import { createTeamAction } from '@/server/actions/team.actions';

const AUTO_SAVE_INTERVAL = 30000;

export default function TeamBuilderPage() {
  const {
    teamName,
    teamDescription,
    members,
    isDirty,
    setTeamName,
    setTeamDescription,
    resetTeam,
    markClean,
    isValidTeam,
  } = useTeamBuilderStore();

  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleSave = useCallback(async () => {
    if (!isValidTeam()) {
      setSaveMessage({
        type: 'error',
        text: 'Team is not valid. Fill all 6 slots with 66 SP each.',
      });
      return;
    }

    setSaving(true);
    setSaveMessage(null);

    const teamData = {
      name: teamName,
      description: teamDescription,
      format: 'champions-doubles',
      isPublic: false,
      members: members.map((m, i) => ({
        pokemonId: m!.pokemonId,
        itemId: m!.itemId ?? undefined,
        abilityName: m!.abilityName,
        nature: m!.nature,
        statPoints: m!.statPoints,
        moves: m!.moves,
        isMega: m!.isMega,
        teraType: m!.teraType ?? undefined,
        position: i,
      })),
    };

    try {
      const result = await createTeamAction(teamData);
      if (result.success) {
        setSaveMessage({ type: 'success', text: 'Team saved successfully!' });
        markClean();
      } else {
        setSaveMessage({ type: 'error', text: result.error ?? 'Failed to save team' });
      }
    } catch {
      setSaveMessage({ type: 'error', text: 'An unexpected error occurred' });
    } finally {
      setSaving(false);
    }
  }, [teamName, teamDescription, members, isValidTeam, markClean]);

  useEffect(() => {
    if (isDirty) {
      autoSaveTimer.current = setInterval(() => {
        if (useTeamBuilderStore.getState().isDirty) {
          handleSave();
        }
      }, AUTO_SAVE_INTERVAL);
    }

    return () => {
      if (autoSaveTimer.current) {
        clearInterval(autoSaveTimer.current);
        autoSaveTimer.current = null;
      }
    };
  }, [isDirty, handleSave]);

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset the team? All changes will be lost.')) {
      resetTeam();
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">Team Builder</h1>
          <div className="flex gap-2">
            <button className="btn btn-ghost btn-sm" onClick={handleReset} aria-label="Reset team">
              Reset
            </button>
            <button
              className={`btn btn-primary btn-sm ${saving ? 'loading' : ''}`}
              onClick={handleSave}
              disabled={saving}
              aria-label="Save team"
            >
              {saving ? 'Saving...' : 'Save Team'}
            </button>
          </div>
        </div>

        {saveMessage && (
          <div
            className={`alert ${saveMessage.type === 'success' ? 'alert-success' : 'alert-error'}`}
            role="alert"
          >
            <span className="text-sm">{saveMessage.text}</span>
          </div>
        )}

        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label" htmlFor="team-name">
                  <span className="label-text">Team Name</span>
                </label>
                <input
                  id="team-name"
                  type="text"
                  className="input input-bordered w-full"
                  placeholder="Enter team name..."
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  maxLength={100}
                  required
                  aria-required="true"
                />
              </div>
              <div className="form-control">
                <label className="label" htmlFor="team-description">
                  <span className="label-text">Description (optional)</span>
                </label>
                <textarea
                  id="team-description"
                  className="textarea textarea-bordered w-full"
                  placeholder="Describe your team strategy..."
                  value={teamDescription}
                  onChange={(e) => setTeamDescription(e.target.value)}
                  maxLength={500}
                  rows={2}
                />
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-3">Team Slots</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <TeamSlot key={i} index={i} />
            ))}
          </div>
        </div>

        <PokemonPicker />
        <SetEditor />
        <SPAllocator />
      </div>
    </div>
  );
}
