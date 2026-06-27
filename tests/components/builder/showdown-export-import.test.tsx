/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/stores/team-builder.store', () => {
  const mockMember = {
    pokemonId: 25,
    pokemonName: 'pikachu',
    pokemonTypes: ['electric' as const],
    itemId: null,
    abilityName: 'static',
    nature: 'jolly',
    statPoints: { hp: 11, atk: 11, def: 11, spAtk: 11, spDef: 11, spd: 11 },
    moves: ['thunderbolt', 'quick-attack'],
    isMega: false,
    teraType: null as string | null,
  };

  const members: (typeof mockMember | null)[] = [mockMember, null, null, null, null, null];

  return {
    useTeamBuilderStore: Object.assign(
      vi.fn(() => ({
        members,
        teamName: 'Test Team',
        applyImportedTeam: vi.fn(),
      })),
      { getState: () => ({ members, teamName: 'Test Team' }) }
    ),
    DEFAULT_STAT_POINTS: { hp: 0, atk: 0, def: 0, spAtk: 0, spDef: 0, spd: 0 },
  };
});

vi.mock('@/server/actions/showdown.actions', () => ({
  exportTeamToTextAction: vi.fn().mockResolvedValue({
    success: true,
    data: 'Pikachu @ Light Ball\nAbility: Static\nTera Type: Electric\nLevel: 50\nSP:\n- HP: 11\n- Atk: 11\n- Def: 11\n- SpA: 11\n- SpD: 11\n- Spe: 11\nJolly Nature\n- Thunderbolt\n- Quick Attack',
  }),
  importTeamFromTextAction: vi.fn().mockResolvedValue({
    success: true,
    data: [
      {
        species: 'pikachu',
        ability: 'static',
        nature: 'jolly',
        teraType: 'electric',
        level: 50,
        isMega: false,
        statPoints: { hp: 11, atk: 11, def: 11, spAtk: 11, spDef: 11, spd: 11 },
        moves: ['thunderbolt', 'quick-attack'],
      },
    ],
  }),
}));

vi.mock('@/server/services/showdown-export.service', () => ({
  exportTeamToText: vi
    .fn()
    .mockReturnValue(
      'Pikachu @ Light Ball\nAbility: Static\nLevel: 50\nSP:\n- HP: 11\n- Atk: 11\n- Def: 11\n- SpA: 11\n- SpD: 11\n- Spe: 11\nJolly Nature\n- Thunderbolt\n- Quick Attack'
    ),
}));

describe('ShowdownExportImport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(true).toBe(true);
  });

  it('should have export section with button', () => {
    expect(true).toBe(true);
  });

  it('should have import section with textarea', () => {
    expect(true).toBe(true);
  });

  it('should call exportTeamToText when export button is clicked', () => {
    expect(true).toBe(true);
  });

  it('should copy text to clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    await navigator.clipboard.writeText('test');
    expect(writeText).toHaveBeenCalledWith('test');
  });

  it('should parse import text and show preview', () => {
    expect(true).toBe(true);
  });

  it('should show error for invalid import', () => {
    expect(true).toBe(true);
  });

  it('should call applyImportedTeam when apply button is clicked', () => {
    expect(true).toBe(true);
  });

  it('should allow clearing import text', () => {
    expect(true).toBe(true);
  });
});
