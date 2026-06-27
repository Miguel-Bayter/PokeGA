'use client';

import { useTeamBuilderStore } from '@/stores/team-builder.store';
import { getTypeBadgeClasses } from '@/lib/type-colors';

interface TeamSlotProps {
  index: number;
}

export function TeamSlot({ index }: TeamSlotProps) {
  const { members, activeSlotIndex, setActiveSlot, removeMember } = useTeamBuilderStore();
  const member = members[index];
  const isActive = activeSlotIndex === index;

  const handleSelect = () => {
    setActiveSlot(index);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeMember(index);
  };

  if (!member) {
    return (
      <button
        className={`card bg-base-200 border-2 border-dashed border-base-300 hover:border-primary transition-colors ${
          isActive ? 'ring-2 ring-primary' : ''
        }`}
        onClick={handleSelect}
        aria-label={`Add Pokemon to slot ${index + 1}`}
      >
        <div className="card-body items-center justify-center py-6">
          <div className="text-4xl text-base-content/30" aria-hidden="true">
            +
          </div>
          <span className="text-sm text-base-content/50">Add Pokemon</span>
        </div>
      </button>
    );
  }

  const totalSP =
    member.statPoints.hp +
    member.statPoints.atk +
    member.statPoints.def +
    member.statPoints.spAtk +
    member.statPoints.spDef +
    member.statPoints.spd;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setActiveSlot(index);
    }
  };

  const isSPValid = totalSP === 66;

  return (
    <div
      role="button"
      tabIndex={0}
      className={`card bg-base-100 shadow-md hover:shadow-lg transition-shadow text-left cursor-pointer ${
        isActive ? 'ring-2 ring-primary' : ''
      }`}
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
      aria-label={`Edit ${member.pokemonName} in slot ${index + 1}`}
    >
      <div className="card-body p-3">
        <div className="flex items-center gap-2">
          <div className="avatar placeholder">
            <div className="bg-base-200 text-base-content rounded-full w-10 h-10">
              <span className="text-xs font-bold">#{member.pokemonId}</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm capitalize truncate">{member.pokemonName}</h3>
            <div className="flex gap-0.5 flex-wrap">
              {member.pokemonTypes.map((type) => (
                <span key={type} className={getTypeBadgeClasses(type)}>
                  {type}
                </span>
              ))}
            </div>
          </div>
          <button
            className="btn btn-ghost btn-xs text-error"
            onClick={handleRemove}
            aria-label={`Remove ${member.pokemonName}`}
          >
            Remove
          </button>
        </div>

        <div className="divider my-1" />

        <div className="grid grid-cols-2 gap-1 text-xs">
          {member.itemId && (
            <div className="truncate" title="Item">
              <span className="font-medium">Item:</span> #{member.itemId}
            </div>
          )}
          {member.abilityName && (
            <div className="truncate" title="Ability">
              <span className="font-medium">Ability:</span> {member.abilityName}
            </div>
          )}
          {member.nature && (
            <div className="truncate capitalize" title="Nature">
              <span className="font-medium">Nature:</span> {member.nature}
            </div>
          )}
          <div className="truncate">
            <span className="font-medium">SP:</span>{' '}
            <span className={isSPValid ? 'text-success' : 'text-warning'}>{totalSP}/66</span>
          </div>
        </div>

        {member.moves.length > 0 && (
          <div className="mt-1">
            <span className="text-xs font-medium">Moves:</span>
            <div className="flex flex-wrap gap-0.5 mt-0.5">
              {member.moves.map((move, i) => (
                <span key={i} className="badge badge-outline badge-xs capitalize">
                  {move}
                </span>
              ))}
            </div>
          </div>
        )}

        {member.isMega && <div className="badge badge-primary badge-sm mt-1">Mega</div>}
      </div>
    </div>
  );
}
