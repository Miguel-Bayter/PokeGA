import { describe, it, expect } from 'vitest';
import { defensiveCoverageService } from '@/server/services/analysis/defensive-coverage.service';
import type { TeamPokemonData } from '@/server/services/analysis/types';

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

describe('DefensiveCoverageService', () => {
  describe('calculate', () => {
    it('should return empty result for empty team', () => {
      const result = defensiveCoverageService.calculate([]);
      expect(result.defensiveScore).toBe(0);
      expect(result.sharedWeaknesses).toHaveLength(0);
    });

    it('should calculate defensive coverage for a single-type Pokemon', () => {
      const team = [makePokemon({ name: 'Charizard', types: ['fire'] })];

      const result = defensiveCoverageService.calculate(team);

      expect(result.coverage.water.effectiveness).toBe(2);
      expect(result.coverage.ground.effectiveness).toBe(2);
      expect(result.coverage.rock.effectiveness).toBe(2);
      expect(result.coverage.fire.effectiveness).toBe(0.5);
      expect(result.coverage.ice.effectiveness).toBe(0.5);
      expect(result.coverage.steel.effectiveness).toBe(0.5);
      expect(result.coverage.fairy.effectiveness).toBe(0.5);
    });

    it('should handle dual-type Pokemon with multiplicative model', () => {
      const team = [makePokemon({ name: 'Charizard', types: ['fire', 'flying'] })];

      const result = defensiveCoverageService.calculate(team);

      expect(result.coverage.water.effectiveness).toBe(2);
      expect(result.coverage.electric.effectiveness).toBe(2);
      expect(result.coverage.rock.effectiveness).toBe(4);
      expect(result.coverage.ground.effectiveness).toBe(0);
      expect(result.coverage.grass.effectiveness).toBe(0.25);
    });

    it('should track which Pokemon are weak to each type', () => {
      const team = [
        makePokemon({ name: 'Charizard', types: ['fire', 'flying'] }),
        makePokemon({ name: 'Venusaur', types: ['grass', 'poison'] }),
        makePokemon({ name: 'Blastoise', types: ['water'] }),
      ];

      const result = defensiveCoverageService.calculate(team);

      expect(result.coverage.fire.weakPokemon).toContain('Venusaur');
      expect(result.coverage.water.weakPokemon).toContain('Charizard');
      expect(result.coverage.ice.weakPokemon).toContain('Venusaur');
    });

    it('should track which Pokemon resist each type', () => {
      const team = [
        makePokemon({ name: 'Charizard', types: ['fire', 'flying'] }),
        makePokemon({ name: 'Venusaur', types: ['grass', 'poison'] }),
      ];

      const result = defensiveCoverageService.calculate(team);

      expect(result.coverage.grass.resistantPokemon).toContain('Charizard');
      expect(result.coverage.fighting.resistantPokemon).toContain('Venusaur');
    });

    it('should apply Levitate ability modifier', () => {
      const team = [
        makePokemon({ name: 'Gengar', types: ['ghost', 'poison'], abilityName: 'levitate' }),
      ];

      const result = defensiveCoverageService.calculate(team);

      expect(result.coverage.ground.effectiveness).toBe(0);
    });

    it('should apply Thick Fat ability modifier', () => {
      const team = [makePokemon({ name: 'Snorlax', types: ['normal'], abilityName: 'thick-fat' })];

      const result = defensiveCoverageService.calculate(team);

      expect(result.coverage.fire.effectiveness).toBe(0.5);
      expect(result.coverage.ice.effectiveness).toBe(0.5);
    });

    it('should apply Flash Fire ability modifier', () => {
      const team = [makePokemon({ name: 'Flareon', types: ['fire'], abilityName: 'flash-fire' })];

      const result = defensiveCoverageService.calculate(team);

      expect(result.coverage.fire.effectiveness).toBe(0);
    });

    it('should identify shared weaknesses (3+ Pokemon weak)', () => {
      const team = [
        makePokemon({ name: 'P1', types: ['fire'] }),
        makePokemon({ name: 'P2', types: ['fire'] }),
        makePokemon({ name: 'P3', types: ['fire'] }),
        makePokemon({ name: 'P4', types: ['grass'] }),
        makePokemon({ name: 'P5', types: ['ice'] }),
        makePokemon({ name: 'P6', types: ['normal'] }),
      ];

      const result = defensiveCoverageService.calculate(team);

      expect(result.sharedWeaknesses).toContain('water');
    });

    it('should average effectiveness across team size', () => {
      const team = [
        makePokemon({ name: 'P1', types: ['fire'] }),
        makePokemon({ name: 'P2', types: ['water'] }),
      ];

      const result = defensiveCoverageService.calculate(team);

      // Fire vs fire (0.5) + fire vs water (0.5) → avg 0.5
      expect(result.coverage.fire.effectiveness).toBe(0.5);
      // Water vs fire (2) + water vs water (0.5) → avg 1.25
      expect(result.coverage.water.effectiveness).toBe(1.25);
    });

    it('should calculate defensive score', () => {
      const team = [
        makePokemon({ name: 'P1', types: ['steel', 'dragon'] }),
        makePokemon({ name: 'P2', types: ['water', 'ground'] }),
        makePokemon({ name: 'P3', types: ['fire', 'flying'] }),
      ];

      const result = defensiveCoverageService.calculate(team);

      expect(result.defensiveScore).toBeGreaterThanOrEqual(0);
      expect(result.defensiveScore).toBeLessThanOrEqual(100);
    });

    it('should handle team with many resistances scoring higher', () => {
      const resistTeam = [
        makePokemon({ name: 'P1', types: ['steel', 'dragon'] }),
        makePokemon({ name: 'P2', types: ['steel', 'fairy'] }),
        makePokemon({ name: 'P3', types: ['water', 'ground'] }),
        makePokemon({ name: 'P4', types: ['fire', 'flying'] }),
        makePokemon({ name: 'P5', types: ['ghost', 'dark'] }),
        makePokemon({ name: 'P6', types: ['electric', 'steel'] }),
      ];

      const weakTeam = [
        makePokemon({ name: 'P1', types: ['normal'] }),
        makePokemon({ name: 'P2', types: ['normal'] }),
        makePokemon({ name: 'P3', types: ['normal'] }),
        makePokemon({ name: 'P4', types: ['normal'] }),
        makePokemon({ name: 'P5', types: ['normal'] }),
        makePokemon({ name: 'P6', types: ['normal'] }),
      ];

      const resistResult = defensiveCoverageService.calculate(resistTeam);
      const weakResult = defensiveCoverageService.calculate(weakTeam);

      expect(resistResult.defensiveScore).toBeGreaterThanOrEqual(weakResult.defensiveScore);
    });
  });
});
