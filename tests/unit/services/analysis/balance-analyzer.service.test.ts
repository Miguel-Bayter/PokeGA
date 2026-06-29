import { describe, it, expect } from 'vitest';
import { balanceAnalyzerService } from '@/server/services/analysis/balance-analyzer.service';
import type { TeamPokemonData, MoveData } from '@/server/services/analysis/types';
import type { PokemonType } from '@/lib/type-chart';

function makePokemon(overrides: Partial<TeamPokemonData> & { name: string }): TeamPokemonData {
  return {
    name: overrides.name,
    types: overrides.types ?? ['normal'],
    baseStats: overrides.baseStats ?? {
      hp: 100,
      atk: 100,
      def: 100,
      spAtk: 100,
      spDef: 100,
      spd: 100,
    },
    abilityName: overrides.abilityName ?? 'pressure',
    nature: overrides.nature ?? 'hardy',
    statPoints: overrides.statPoints ?? { hp: 11, atk: 11, def: 11, spAtk: 11, spDef: 11, spd: 11 },
    moves: overrides.moves ?? [],
    isMega: overrides.isMega ?? false,
    teraType: overrides.teraType ?? null,
  };
}

function makeMove(
  name: string,
  type: PokemonType,
  category: 'physical' | 'special' | 'status',
  power: number | null = 80
): MoveData {
  return { name, type, category, power };
}

describe('BalanceAnalyzerService', () => {
  describe('analyze', () => {
    it('should return empty result for empty team', () => {
      const result = balanceAnalyzerService.analyze([]);
      expect(result.physicalMoves).toBe(0);
      expect(result.specialMoves).toBe(0);
      expect(result.statusMoves).toBe(0);
      expect(result.balanceScore).toBe(0);
    });

    it('should count physical, special, and status moves correctly', () => {
      const team = [
        makePokemon({
          name: 'P1',
          moves: [
            makeMove('earthquake', 'ground', 'physical'),
            makeMove('flamethrower', 'fire', 'special'),
            makeMove('thunder-wave', 'electric', 'status'),
          ],
        }),
        makePokemon({
          name: 'P2',
          moves: [
            makeMove('close-combat', 'fighting', 'physical'),
            makeMove('ice-beam', 'ice', 'special'),
          ],
        }),
      ];

      const result = balanceAnalyzerService.analyze(team);

      expect(result.physicalMoves).toBe(2);
      expect(result.specialMoves).toBe(2);
      expect(result.statusMoves).toBe(1);
    });

    it('should calculate correct percentages', () => {
      const team = [
        makePokemon({
          name: 'P1',
          moves: [
            makeMove('m1', 'normal', 'physical'),
            makeMove('m2', 'normal', 'physical'),
            makeMove('m3', 'normal', 'special'),
          ],
        }),
      ];

      const result = balanceAnalyzerService.analyze(team);

      expect(result.physicalPercentage).toBe(67);
      expect(result.specialPercentage).toBe(33);
    });

    it('should give high score for balanced team', () => {
      const team = [
        makePokemon({
          name: 'P1',
          moves: [makeMove('m1', 'normal', 'physical'), makeMove('m2', 'normal', 'special')],
        }),
        makePokemon({
          name: 'P2',
          moves: [makeMove('m3', 'normal', 'physical'), makeMove('m4', 'normal', 'special')],
        }),
      ];

      const result = balanceAnalyzerService.analyze(team);

      expect(result.balanceScore).toBe(100);
    });

    it('should give lower score for heavily unbalanced team', () => {
      const team = [
        makePokemon({
          name: 'P1',
          moves: [
            makeMove('m1', 'normal', 'physical'),
            makeMove('m2', 'normal', 'physical'),
            makeMove('m3', 'normal', 'physical'),
            makeMove('m4', 'normal', 'physical'),
          ],
        }),
        makePokemon({
          name: 'P2',
          moves: [
            makeMove('m5', 'normal', 'physical'),
            makeMove('m6', 'normal', 'physical'),
            makeMove('m7', 'normal', 'physical'),
            makeMove('m8', 'normal', 'physical'),
          ],
        }),
      ];

      const result = balanceAnalyzerService.analyze(team);

      expect(result.physicalPercentage).toBe(100);
      expect(result.specialPercentage).toBe(0);
      expect(result.balanceScore).toBeLessThan(50);
    });

    it('should handle team with only status moves', () => {
      const team = [
        makePokemon({
          name: 'P1',
          moves: [makeMove('m1', 'electric', 'status'), makeMove('m2', 'poison', 'status')],
        }),
      ];

      const result = balanceAnalyzerService.analyze(team);

      expect(result.physicalMoves).toBe(0);
      expect(result.specialMoves).toBe(0);
      expect(result.statusMoves).toBe(2);
      expect(result.physicalPercentage).toBe(0);
      expect(result.specialPercentage).toBe(0);
    });

    it('should provide recommendation based on balance', () => {
      const balancedTeam = [
        makePokemon({
          name: 'P1',
          moves: [makeMove('m1', 'normal', 'physical'), makeMove('m2', 'normal', 'special')],
        }),
      ];

      const result = balanceAnalyzerService.analyze(balancedTeam);
      expect(result.recommendation).toContain('Excellent');
    });

    it('should recommend special attackers for physically oriented team', () => {
      const team = [
        makePokemon({
          name: 'P1',
          moves: [
            makeMove('m1', 'normal', 'physical'),
            makeMove('m2', 'normal', 'physical'),
            makeMove('m3', 'normal', 'physical'),
          ],
        }),
        makePokemon({
          name: 'P2',
          moves: [makeMove('m4', 'normal', 'physical'), makeMove('m5', 'normal', 'physical')],
        }),
      ];

      const result = balanceAnalyzerService.analyze(team);
      expect(result.recommendation).toContain('special');
    });

    it('should consider stat alignment when scoring', () => {
      const team = [
        makePokemon({
          name: 'P1',
          baseStats: { hp: 100, atk: 150, def: 100, spAtk: 50, spDef: 100, spd: 100 },
          moves: [makeMove('m1', 'normal', 'physical')],
        }),
        makePokemon({
          name: 'P2',
          baseStats: { hp: 100, atk: 50, def: 100, spAtk: 150, spDef: 100, spd: 100 },
          moves: [makeMove('m2', 'normal', 'special')],
        }),
      ];

      const result = balanceAnalyzerService.analyze(team);
      expect(result.balanceScore).toBeGreaterThanOrEqual(80);
    });

    it('should handle 60/40 split as good balance', () => {
      const team = [
        makePokemon({
          name: 'P1',
          moves: [
            makeMove('m1', 'normal', 'physical'),
            makeMove('m2', 'normal', 'physical'),
            makeMove('m3', 'normal', 'physical'),
          ],
        }),
        makePokemon({
          name: 'P2',
          moves: [makeMove('m4', 'normal', 'special'), makeMove('m5', 'normal', 'special')],
        }),
      ];

      const result = balanceAnalyzerService.analyze(team);

      expect(result.physicalPercentage).toBe(60);
      expect(result.specialPercentage).toBe(40);
      expect(result.balanceScore).toBeGreaterThanOrEqual(60);
    });
  });
});
