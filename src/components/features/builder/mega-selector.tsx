'use client';

import { useTeamBuilderStore } from '@/stores/team-builder.store';

export function MegaSelector() {
  const { activeSlotIndex, members, setMegaForSlot, getMegaSlotIndex } = useTeamBuilderStore();
  const member = members[activeSlotIndex];
  const megaSlotIndex = getMegaSlotIndex();
  const anotherMegaExists = megaSlotIndex !== -1 && megaSlotIndex !== activeSlotIndex;
  const currentMegaName =
    anotherMegaExists && members[megaSlotIndex] ? members[megaSlotIndex]!.pokemonName : null;

  if (!member) {
    return null;
  }

  const handleToggle = (checked: boolean) => {
    setMegaForSlot(activeSlotIndex, checked);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <label className="label cursor-pointer gap-2" htmlFor="mega-toggle">
          <input
            id="mega-toggle"
            type="checkbox"
            className="toggle toggle-primary"
            checked={member.isMega}
            onChange={(e) => handleToggle(e.target.checked)}
            aria-label={`Mega Evolution for ${member.pokemonName}`}
          />
          <span className="label-text font-semibold">Mega Evolution</span>
        </label>
        {member.isMega && (
          <span className="badge badge-primary badge-sm" aria-label="Mega Evolution active">
            Mega
          </span>
        )}
      </div>

      {anotherMegaExists && !member.isMega && (
        <div className="alert alert-warning text-sm" role="alert">
          <span>
            {currentMegaName} already has Mega Evolution enabled. Enabling it here will disable it
            for {currentMegaName}.
          </span>
        </div>
      )}

      {anotherMegaExists && member.isMega && (
        <div className="alert alert-info text-sm" role="status">
          <span>
            Mega Evolution transferred from {currentMegaName} to {member.pokemonName}.
          </span>
        </div>
      )}
    </div>
  );
}
