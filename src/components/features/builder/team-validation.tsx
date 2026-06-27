'use client';

import { useMemo } from 'react';
import { useTeamBuilderStore } from '@/stores/team-builder.store';

interface ValidationMessage {
  message: string;
  severity: 'error' | 'warning' | 'success';
}

export function TeamValidation() {
  const { members, teamName } = useTeamBuilderStore();

  const messages = useMemo(() => {
    const result: ValidationMessage[] = [];
    const filledMembers = members.filter((m) => m !== null);

    if (!teamName.trim()) {
      result.push({ message: 'Team name is required.', severity: 'warning' });
    }

    if (filledMembers.length < 6) {
      result.push({
        message: `Team has ${filledMembers.length}/6 Pokemon. Fill all slots for a valid team.`,
        severity: 'warning',
      });
    }

    const megaCount = members.filter((m) => m?.isMega).length;
    if (megaCount > 1) {
      result.push({
        message: `Multiple Mega Evolutions detected (${megaCount}). Only 1 is allowed per team.`,
        severity: 'error',
      });
    }

    const speciesSeen = new Map<string, number>();
    for (let i = 0; i < members.length; i++) {
      const member = members[i];
      if (!member) continue;
      const baseSpecies = member.pokemonName
        .toLowerCase()
        .replace(/-mega-[xy]?$/, '')
        .replace(/-mega$/, '');
      if (speciesSeen.has(baseSpecies)) {
        result.push({
          message: `Duplicate species: ${member.pokemonName} (slot ${i + 1}) shares base species with slot ${speciesSeen.get(baseSpecies)! + 1}.`,
          severity: 'error',
        });
      } else {
        speciesSeen.set(baseSpecies, i);
      }
    }

    const itemsSeen = new Map<number, number>();
    for (let i = 0; i < members.length; i++) {
      const member = members[i];
      if (!member || member.itemId === null) continue;
      if (itemsSeen.has(member.itemId)) {
        result.push({
          message: `Duplicate item (slot ${i + 1} and slot ${itemsSeen.get(member.itemId)! + 1}).`,
          severity: 'error',
        });
      } else {
        itemsSeen.set(member.itemId, i);
      }
    }

    for (let i = 0; i < members.length; i++) {
      const member = members[i];
      if (!member) continue;
      const total =
        member.statPoints.hp +
        member.statPoints.atk +
        member.statPoints.def +
        member.statPoints.spAtk +
        member.statPoints.spDef +
        member.statPoints.spd;
      if (total !== 66) {
        result.push({
          message: `${member.pokemonName} (slot ${i + 1}): SP total is ${total}/66.`,
          severity: 'warning',
        });
      }
      if (member.moves.length === 0) {
        result.push({
          message: `${member.pokemonName} (slot ${i + 1}): No moves assigned.`,
          severity: 'warning',
        });
      }
    }

    if (result.length === 0 && filledMembers.length === 6) {
      result.push({ message: 'Team is valid! Ready to save.', severity: 'success' });
    }

    return result;
  }, [members, teamName]);

  if (messages.length === 0) return null;

  const errors = messages.filter((m) => m.severity === 'error');
  const warnings = messages.filter((m) => m.severity === 'warning');
  const success = messages.filter((m) => m.severity === 'success');

  return (
    <div className="flex flex-col gap-2" role="region" aria-label="Team validation status">
      {errors.length > 0 && (
        <div className="alert alert-error" role="alert">
          <div className="flex flex-col gap-1">
            {errors.map((e, i) => (
              <span key={i} className="text-sm">
                {e.message}
              </span>
            ))}
          </div>
        </div>
      )}
      {warnings.length > 0 && (
        <div className="alert alert-warning" role="status">
          <div className="flex flex-col gap-1">
            {warnings.map((w, i) => (
              <span key={i} className="text-sm">
                {w.message}
              </span>
            ))}
          </div>
        </div>
      )}
      {success.length > 0 && errors.length === 0 && (
        <div className="alert alert-success" role="status">
          <span className="text-sm">{success[0].message}</span>
        </div>
      )}
    </div>
  );
}
