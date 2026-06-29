import { describe, it, expect } from 'vitest';
import { offensiveCoverageService } from '@/server/services/analysis/offensive-coverage.service';
import type { TeamPokemonData } from '@/server/services/analysis/types';
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
  category: 'physical' | 'special' | 'status' = 'physical',
  power: number | null = 80
) {
  return { name, type, category, power };
}

describe('OffensiveCoverageService', () => {
  describe('calculate', () => {
    it('should return empty result for empty team', () => {
      const result = offensiveCoverageService.calculate([]);
      expect(result.coverageScore).toBe(0);
      expect(Object.keys(result.matrix)).toHaveLength(18);
      expect(result.pokemonContributions).toEqual({});
    });

    it('should calculate coverage for a single Pokemon with one move type', () => {
      const team = [
        makePokemon({
          name: 'Charizard',
          types: ['fire', 'flying'],
          moves: [makeMove('flamethrower', 'fire', 'special')],
        }),
      ];

      const result = offensiveCoverageService.calculate(team);

      expect(result.matrix.fire.grass).toBeGreaterThan(0);
      expect(result.matrix.fire.ice).toBeGreaterThan(0);
      expect(result.matrix.fire.water).toBe(0.75);
    });

    it('should apply STAB bonus when Pokemon type matches move type', () => {
      const stabTeam = [
        makePokemon({
          name: 'Charizard',
          types: ['fire', 'flying'],
          moves: [makeMove('flamethrower', 'fire', 'special')],
        }),
      ];

      const noStabTeam = [
        makePokemon({
          name: 'Snorlax',
          types: ['normal'],
          moves: [makeMove('flamethrower', 'fire', 'special')],
        }),
      ];

      const stabResult = offensiveCoverageService.calculate(stabTeam);
      const noStabResult = offensiveCoverageService.calculate(noStabTeam);

      expect(stabResult.matrix.fire.grass).toBe(3);
      expect(noStabResult.matrix.fire.grass).toBe(2);
    });

    it('should aggregate coverage across multiple Pokemon', () => {
      const team = [
        makePokemon({
          name: 'Charizard',
          types: ['fire', 'flying'],
          moves: [makeMove('flamethrower', 'fire', 'special')],
        }),
        makePokemon({
          name: 'Blastoise',
          types: ['water'],
          moves: [makeMove('surf', 'water', 'special')],
        }),
        makePokemon({
          name: 'Venusaur',
          types: ['grass', 'poison'],
          moves: [makeMove('solar-beam', 'grass', 'special')],
        }),
      ];

      const result = offensiveCoverageService.calculate(team);

      expect(result.matrix.fire.grass).toBeGreaterThan(0);
      expect(result.matrix.water.fire).toBeGreaterThan(0);
      expect(result.matrix.grass.water).toBeGreaterThan(0);
    });

    it('should ignore status moves for coverage', () => {
      const team = [
        makePokemon({
          name: 'Clefable',
          types: ['fairy'],
          moves: [
            makeMove('thunder-wave', 'electric', 'status', null),
            makeMove('moonblast', 'fairy', 'special'),
          ],
        }),
      ];

      const result = offensiveCoverageService.calculate(team);

      const contributions = result.pokemonContributions['Clefable'] ?? [];
      expect(contributions).not.toContain('electric');
      expect(contributions).toContain('fairy');
    });

    it('should track Pokemon contributions per move type', () => {
      const team = [
        makePokemon({
          name: 'Gengar',
          types: ['ghost', 'poison'],
          moves: [
            makeMove('shadow-ball', 'ghost', 'special'),
            makeMove('sludge-bomb', 'poison', 'special'),
          ],
        }),
      ];

      const result = offensiveCoverageService.calculate(team);

      const contributions = result.pokemonContributions['Gengar'] ?? [];
      expect(contributions).toContain('ghost');
      expect(contributions).toContain('poison');
    });

    it('should calculate coverage score correctly', () => {
      const team = [
        makePokemon({
          name: 'Charizard',
          types: ['fire'],
          moves: [makeMove('flamethrower', 'fire', 'special')],
        }),
      ];

      const result = offensiveCoverageService.calculate(team);

      expect(result.coverageScore).toBeGreaterThan(0);
      expect(result.coverageScore).toBeLessThanOrEqual(100);
    });

    it('should handle Pokemon with multiple move types', () => {
      const team = [
        makePokemon({
          name: 'Lucario',
          types: ['fighting', 'steel'],
          moves: [
            makeMove('close-combat', 'fighting', 'physical'),
            makeMove('flash-cannon', 'steel', 'special'),
            makeMove('earthquake', 'ground', 'physical'),
            makeMove('extreme-speed', 'normal', 'physical'),
          ],
        }),
      ];

      const result = offensiveCoverageService.calculate(team);

      const contributions = result.pokemonContributions['Lucario'] ?? [];
      expect(contributions).toHaveLength(4);
      expect(result.matrix.fighting).toBeDefined();
      expect(result.matrix.steel).toBeDefined();
      expect(result.matrix.ground).toBeDefined();
      expect(result.matrix.normal).toBeDefined();
    });

    it('should handle team with all 18 types covered', () => {
      const team = [
        makePokemon({ name: 'P1', types: ['fire'], moves: [makeMove('m1', 'fire')] }),
        makePokemon({ name: 'P2', types: ['water'], moves: [makeMove('m2', 'water')] }),
        makePokemon({ name: 'P3', types: ['grass'], moves: [makeMove('m3', 'grass')] }),
        makePokemon({ name: 'P4', types: ['electric'], moves: [makeMove('m4', 'electric')] }),
        makePokemon({ name: 'P5', types: ['ice'], moves: [makeMove('m5', 'ice')] }),
        makePokemon({ name: 'P6', types: ['ground'], moves: [makeMove('m6', 'ground')] }),
      ];

      const result = offensiveCoverageService.calculate(team);
      expect(result.coverageScore).toBeGreaterThan(50);
    });

    it('should correctly identify super effective matchups in summary', () => {
      const team = [
        makePokemon({
          name: 'Charizard',
          types: ['fire'],
          moves: [makeMove('flamethrower', 'fire', 'special')],
        }),
      ];

      const result = offensiveCoverageService.calculate(team);

      expect(result.superEffective['grass']).toContain('fire');
      expect(result.superEffective['ice']).toContain('fire');
      expect(result.superEffective['steel']).toContain('fire');
    });

    it('should correctly identify immune matchups in summary', () => {
      const team = [
        makePokemon({
          name: 'Gengar',
          types: ['ghost'],
          moves: [makeMove('shadow-ball', 'ghost', 'special')],
        }),
      ];

      const result = offensiveCoverageService.calculate(team);

      expect(result.immune['normal']).toContain('ghost');
    });
  });
});
