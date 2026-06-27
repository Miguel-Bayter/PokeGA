'use client';

import { useState, useCallback, useEffect } from 'react';
import { POKEMON_TYPES, type PokemonType } from '@/lib/type-chart';
import { getTypeBadgeClasses } from '@/lib/type-colors';
import { getPokemonListAction, type PokemonListItem } from '@/server/actions/data.actions';
import { useTeamBuilderStore } from '@/stores/team-builder.store';

export function PokemonPicker() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<PokemonType | null>(null);
  const [pokemon, setPokemon] = useState<PokemonListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { activeSlotIndex, members, setMember } = useTeamBuilderStore();

  const fetchPokemon = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getPokemonListAction(search || undefined, typeFilter || undefined);
      if (result.success && result.data) {
        setPokemon(result.data);
      }
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter]);

  useEffect(() => {
    const timeout = setTimeout(fetchPokemon, 300);
    return () => clearTimeout(timeout);
  }, [fetchPokemon]);

  const handleSelect = (p: PokemonListItem) => {
    const existing = members[activeSlotIndex];
    setMember(activeSlotIndex, {
      pokemonId: p.id,
      pokemonName: p.name,
      pokemonTypes: p.types,
      itemId: existing?.itemId ?? null,
      abilityName: existing?.abilityName ?? '',
      nature: existing?.nature ?? '',
      statPoints: existing?.statPoints ?? { hp: 0, atk: 0, def: 0, spAtk: 0, spDef: 0, spd: 0 },
      moves: existing?.moves ?? [],
      isMega: p.isMega,
      teraType: existing?.teraType ?? null,
    });
  };

  const isPokemonSelected = (id: number) => members.some((m) => m?.pokemonId === id);

  return (
    <div className="card bg-base-100 shadow-md">
      <div className="card-body">
        <h2 className="card-title text-lg">Pokemon Picker</h2>

        <div className="form-control">
          <input
            type="text"
            placeholder="Search Pokemon..."
            className="input input-bordered w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search Pokemon by name"
          />
        </div>

        <div className="flex flex-wrap gap-1" role="group" aria-label="Type filters">
          <button
            className={`btn btn-xs ${typeFilter === null ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setTypeFilter(null)}
            aria-pressed={typeFilter === null}
          >
            All
          </button>
          {POKEMON_TYPES.map((type) => (
            <button
              key={type}
              className={`btn btn-xs capitalize ${typeFilter === type ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setTypeFilter(typeFilter === type ? null : type)}
              aria-pressed={typeFilter === type}
            >
              {type}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <span className="loading loading-spinner loading-lg" aria-label="Loading Pokemon" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-96 overflow-y-auto">
            {pokemon.map((p) => {
              const selected = isPokemonSelected(p.id);
              const isActive = members[activeSlotIndex]?.pokemonId === p.id;
              return (
                <button
                  key={p.id}
                  className={`card compact bg-base-200 hover:bg-base-300 transition-colors ${
                    isActive ? 'ring-2 ring-primary' : ''
                  } ${selected ? 'opacity-50' : ''}`}
                  onClick={() => handleSelect(p)}
                  disabled={selected && !isActive}
                  aria-label={`Select ${p.name}`}
                >
                  <div className="card-body p-2 items-center">
                    {p.spriteUrl ? (
                      <img
                        src={p.spriteUrl}
                        alt={p.name}
                        className="w-12 h-12 object-contain"
                        width={48}
                        height={48}
                      />
                    ) : (
                      <div className="w-12 h-12 bg-base-300 rounded-full flex items-center justify-center text-xs">
                        #{p.id}
                      </div>
                    )}
                    <span className="text-xs font-medium capitalize truncate w-full text-center">
                      {p.name}
                    </span>
                    <div className="flex gap-0.5">
                      {p.types.map((type) => (
                        <span key={type} className={getTypeBadgeClasses(type)}>
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              );
            })}
            {pokemon.length === 0 && !loading && (
              <p className="col-span-full text-center text-base-content/60 py-4">
                No Pokemon found
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
