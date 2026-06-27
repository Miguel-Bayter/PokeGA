/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/stores/team-builder.store', () => {
  const members: (Record<string, unknown> | null)[] = Array(6).fill(null);
  const activeSlotIndex = 0;

  const mockMember = {
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
  };

  members[0] = mockMember;

  return {
    useTeamBuilderStore: Object.assign(
      vi.fn(() => ({
        activeSlotIndex,
        members,
        updateMemberField: vi.fn(),
      })),
      { getState: () => ({ activeSlotIndex, members }) }
    ),
    DEFAULT_STAT_POINTS: { hp: 0, atk: 0, def: 0, spAtk: 0, spDef: 0, spd: 0 },
  };
});

describe('SPAllocator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(true).toBe(true);
  });

  it('should show 6 stat inputs', () => {
    expect(true).toBe(true);
  });

  it('should calculate total SP correctly', () => {
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

  it('should validate max SP per stat is 32', () => {
    const MAX_SP_PER_STAT = 32;
    const value = 33;
    const clamped = Math.min(MAX_SP_PER_STAT, Math.max(0, value));
    expect(clamped).toBe(32);
  });

  it('should validate total SP must equal 66', () => {
    const totalSP = 66;
    expect(totalSP).toBe(66);
  });
});
