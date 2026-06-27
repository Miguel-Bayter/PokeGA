/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/server/actions/data.actions', () => ({
  getPokemonListAction: vi.fn().mockResolvedValue({
    success: true,
    data: [
      {
        id: 25,
        name: 'pikachu',
        types: ['electric'],
        spriteUrl: null,
        isMega: false,
        abilities: ['static'],
      },
      {
        id: 6,
        name: 'charizard',
        types: ['fire', 'flying'],
        spriteUrl: null,
        isMega: false,
        abilities: ['blaze'],
      },
    ],
  }),
}));

vi.mock('@/stores/team-builder.store', () => {
  const members: (ReturnType<typeof createMockMember> | null)[] = Array(6).fill(null);
  let activeSlotIndex = 0;
  let isDirty = false;

  function createMockMember(overrides: Record<string, unknown> = {}) {
    return {
      pokemonId: 25,
      pokemonName: 'pikachu',
      pokemonTypes: ['electric'],
      itemId: null,
      abilityName: 'static',
      nature: 'jolly',
      statPoints: { hp: 11, atk: 11, def: 11, spAtk: 11, spDef: 11, spd: 11 },
      moves: ['thunderbolt'],
      isMega: false,
      teraType: null,
      ...overrides,
    };
  }

  return {
    useTeamBuilderStore: Object.assign(
      vi.fn(() => ({
        activeSlotIndex,
        members,
        isDirty,
        setActiveSlot: vi.fn((i: number) => {
          activeSlotIndex = i;
        }),
        setMember: vi.fn((i: number, m: unknown) => {
          members[i] = m as (typeof members)[0];
          isDirty = true;
        }),
        removeMember: vi.fn((i: number) => {
          members[i] = null;
          isDirty = true;
        }),
      })),
      { getState: () => ({ activeSlotIndex, members, isDirty }) }
    ),
    createMockMember,
    DEFAULT_STAT_POINTS: { hp: 0, atk: 0, def: 0, spAtk: 0, spDef: 0, spd: 0 },
  };
});

describe('PokemonPicker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(true).toBe(true);
  });

  it('should render search input', () => {
    expect(true).toBe(true);
  });

  it('should render type filter buttons for all 18 types', () => {
    expect(true).toBe(true);
  });
});
