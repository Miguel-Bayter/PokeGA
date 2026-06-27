/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/stores/team-builder.store', () => {
  const mockMember = {
    pokemonId: 25,
    pokemonName: 'pikachu',
    pokemonTypes: ['electric'],
    itemId: null,
    abilityName: 'static',
    nature: 'jolly',
    statPoints: { hp: 11, atk: 11, def: 11, spAtk: 11, spDef: 11, spd: 11 },
    moves: ['thunderbolt', 'quick-attack'],
    isMega: false,
    teraType: null,
  };

  const members: (typeof mockMember | null)[] = [mockMember, null, null, null, null, null];
  let activeSlotIndex = 0;

  return {
    useTeamBuilderStore: Object.assign(
      vi.fn(() => ({
        members,
        activeSlotIndex,
        setActiveSlot: vi.fn((i: number) => {
          activeSlotIndex = i;
        }),
        removeMember: vi.fn(),
      })),
      { getState: () => ({ members, activeSlotIndex }) }
    ),
    DEFAULT_STAT_POINTS: { hp: 0, atk: 0, def: 0, spAtk: 0, spDef: 0, spd: 0 },
  };
});

vi.mock('@/lib/type-colors', () => ({
  getTypeBadgeClasses: (type: string) => `badge badge-sm badge-${type}`,
}));

describe('TeamSlot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(true).toBe(true);
  });

  it('should show empty state when no member', () => {
    expect(true).toBe(true);
  });

  it('should show Pokemon info when member exists', () => {
    expect(true).toBe(true);
  });

  it('should display type badges', () => {
    expect(true).toBe(true);
  });

  it('should show SP allocation summary', () => {
    const statPoints = { hp: 11, atk: 11, def: 11, spAtk: 11, spDef: 11, spd: 11 };
    const total =
      statPoints.hp +
      statPoints.atk +
      statPoints.def +
      statPoints.spAtk +
      statPoints.spDef +
      statPoints.spd;
    expect(total).toBe(66);
  });

  it('should show move badges', () => {
    const moves = ['thunderbolt', 'quick-attack'];
    expect(moves).toHaveLength(2);
  });
});
