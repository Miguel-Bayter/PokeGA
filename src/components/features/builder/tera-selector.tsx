'use client';

import { POKEMON_TYPES, type PokemonType } from '@/lib/type-chart';
import { getTypeBadgeClasses, getTypeColor } from '@/lib/type-colors';
import { useTeamBuilderStore } from '@/stores/team-builder.store';

export function TeraSelector() {
  const { activeSlotIndex, members, updateMemberField } = useTeamBuilderStore();
  const member = members[activeSlotIndex];

  if (!member) {
    return null;
  }

  const selectedTeraType = member.teraType;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    updateMemberField(activeSlotIndex, 'teraType', value ? (value as PokemonType) : null);
  };

  const teraColor = selectedTeraType ? getTypeColor(selectedTeraType) : null;

  return (
    <div className="flex flex-col gap-2">
      <label className="label" htmlFor="tera-type-select">
        <span className="label-text font-semibold">Terastallization Type</span>
      </label>
      <div className="flex items-center gap-2">
        <select
          id="tera-type-select"
          className="select select-bordered w-full"
          value={selectedTeraType ?? ''}
          onChange={handleChange}
          aria-label="Select Terastallization type"
        >
          <option value="">No Tera Type</option>
          {POKEMON_TYPES.map((type) => (
            <option key={type} value={type}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </option>
          ))}
        </select>
        {selectedTeraType && (
          <span
            className={`badge ${getTypeBadgeClasses(selectedTeraType)} badge-md`}
            aria-label={`Tera type: ${selectedTeraType}`}
          >
            {selectedTeraType.charAt(0).toUpperCase() + selectedTeraType.slice(1)}
          </span>
        )}
      </div>
      {selectedTeraType && teraColor && (
        <div
          className={`rounded-lg p-2 text-center text-sm font-semibold ${teraColor.bg} ${teraColor.text}`}
          aria-label={`Tera type preview: ${selectedTeraType}`}
        >
          Tera Type: {selectedTeraType.charAt(0).toUpperCase() + selectedTeraType.slice(1)}
        </div>
      )}
    </div>
  );
}
