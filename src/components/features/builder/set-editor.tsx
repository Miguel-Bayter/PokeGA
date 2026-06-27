'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTeamBuilderStore } from '@/stores/team-builder.store';
import { MegaSelector } from '@/components/features/builder/mega-selector';
import { TeraSelector } from '@/components/features/builder/tera-selector';
import {
  getItemsAction,
  getMovesAction,
  getAbilitiesAction,
  type ItemListItem,
  type MoveListItem,
  type AbilityListItem,
} from '@/server/actions/data.actions';

const NATURES = [
  'adamant',
  'bashful',
  'bold',
  'brave',
  'calm',
  'careful',
  'docile',
  'gentle',
  'hardy',
  'hasty',
  'impish',
  'jolly',
  'lax',
  'lonely',
  'mild',
  'modest',
  'naive',
  'naughty',
  'quiet',
  'quirky',
  'rash',
  'relaxed',
  'sassy',
  'serious',
  'timid',
] as const;

export function SetEditor() {
  const { activeSlotIndex, members, updateMemberField } = useTeamBuilderStore();
  const member = members[activeSlotIndex];

  const [items, setItems] = useState<ItemListItem[]>([]);
  const [abilities, setAbilities] = useState<AbilityListItem[]>([]);
  const [moves, setMoves] = useState<MoveListItem[]>([]);
  const [moveSearch, setMoveSearch] = useState(['', '', '', '']);

  useEffect(() => {
    getItemsAction().then((res) => {
      if (res.success && res.data) setItems(res.data);
    });
  }, []);

  useEffect(() => {
    if (!member) return;
    getAbilitiesAction(member.pokemonId).then((res) => {
      if (res.success && res.data) setAbilities(res.data);
    });
  }, [member?.pokemonId, member]);

  const fetchMoves = useCallback(async (search: string) => {
    const res = await getMovesAction(search || undefined);
    if (res.success && res.data) {
      return res.data;
    }
    return [];
  }, []);

  const [initialMovesLoaded, setInitialMovesLoaded] = useState(false);

  useEffect(() => {
    if (initialMovesLoaded) return;
    fetchMoves('').then((data) => {
      setMoves(data);
      setInitialMovesLoaded(true);
    });
  }, [fetchMoves, initialMovesLoaded]);

  if (!member) {
    return (
      <div className="card bg-base-100 shadow-md">
        <div className="card-body items-center text-center py-8">
          <p className="text-base-content/60">Select a Pokemon from the picker to edit its set</p>
        </div>
      </div>
    );
  }

  const handleMoveSelect = (slotIndex: number, moveName: string) => {
    const currentMoves = [...member.moves];
    while (currentMoves.length <= slotIndex) currentMoves.push('');
    currentMoves[slotIndex] = moveName;
    updateMemberField(
      activeSlotIndex,
      'moves',
      currentMoves.filter((m) => m !== '')
    );
  };

  const currentMoves = member.moves;

  return (
    <div className="card bg-base-100 shadow-md">
      <div className="card-body">
        <h2 className="card-title text-lg capitalize">{member.pokemonName} Set Editor</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-control">
            <label className="label" htmlFor="item-select">
              <span className="label-text">Item</span>
            </label>
            <select
              id="item-select"
              className="select select-bordered w-full"
              value={member.itemId ?? ''}
              onChange={(e) =>
                updateMemberField(
                  activeSlotIndex,
                  'itemId',
                  e.target.value ? Number(e.target.value) : null
                )
              }
            >
              <option value="">No Item</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-control">
            <label className="label" htmlFor="ability-select">
              <span className="label-text">Ability</span>
            </label>
            <select
              id="ability-select"
              className="select select-bordered w-full"
              value={member.abilityName}
              onChange={(e) => updateMemberField(activeSlotIndex, 'abilityName', e.target.value)}
            >
              <option value="">Select Ability</option>
              {abilities.map((ability) => (
                <option key={ability.id} value={ability.name}>
                  {ability.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-control">
            <label className="label" htmlFor="nature-select">
              <span className="label-text">Nature</span>
            </label>
            <select
              id="nature-select"
              className="select select-bordered w-full"
              value={member.nature}
              onChange={(e) => updateMemberField(activeSlotIndex, 'nature', e.target.value)}
            >
              <option value="">Select Nature</option>
              {NATURES.map((nature) => (
                <option key={nature} value={nature}>
                  {nature}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="divider">Mega & Tera</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MegaSelector />
          <TeraSelector />
        </div>

        <div className="divider">Moves</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((slotIndex) => (
            <div key={slotIndex} className="form-control">
              <label className="label" htmlFor={`move-${slotIndex}`}>
                <span className="label-text">Move {slotIndex + 1}</span>
              </label>
              <div className="flex gap-1">
                <input
                  type="text"
                  placeholder="Search moves..."
                  className="input input-bordered input-sm flex-1"
                  value={moveSearch[slotIndex]}
                  onChange={(e) => {
                    const newSearch = [...moveSearch];
                    newSearch[slotIndex] = e.target.value;
                    setMoveSearch(newSearch);
                    fetchMoves(e.target.value).then(setMoves);
                  }}
                  id={`move-${slotIndex}`}
                  aria-label={`Search for move ${slotIndex + 1}`}
                />
                <select
                  className="select select-bordered select-sm flex-1"
                  value={currentMoves[slotIndex] ?? ''}
                  onChange={(e) => handleMoveSelect(slotIndex, e.target.value)}
                  aria-label={`Select move ${slotIndex + 1}`}
                >
                  <option value="">Select</option>
                  {moves.map((move) => (
                    <option key={move.id} value={move.name}>
                      {move.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
