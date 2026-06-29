import { describe, it, expect } from 'vitest';
import { synergyDetectorService } from '@/server/services/analysis/synergy-detector.service';
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

describe('SynergyDetectorService', () => {
  describe('analyze', () => {
    it('should return empty result for empty team', () => {
      const result = synergyDetectorService.analyze([]);
      expect(result.cores).toHaveLength(0);
      expect(result.synergyScore).toBe(0);
      expect(result.typeCoverage).toBe(0);
    });

    it('should detect Fire-Water-Grass core', () => {
      const team = [
        makePokemon({ name: 'Charizard', types: ['fire', 'flying'] }),
        makePokemon({ name: 'Blastoise', types: ['water'] }),
        makePokemon({ name: 'Venusaur', types: ['grass', 'poison'] }),
        makePokemon({ name: 'P4', types: ['normal'] }),
        makePokemon({ name: 'P5', types: ['normal'] }),
        makePokemon({ name: 'P6', types: ['normal'] }),
      ];

      const result = synergyDetectorService.analyze(team);

      const fwgCore = result.cores.find((c) => c.name === 'Fire-Water-Grass');
      expect(fwgCore).toBeDefined();
      expect(fwgCore!.pokemon).toContain('Charizard');
      expect(fwgCore!.pokemon).toContain('Blastoise');
      expect(fwgCore!.pokemon).toContain('Venusaur');
    });

    it('should detect Steel-Dragon-Fairy core', () => {
      const team = [
        makePokemon({ name: 'Metagross', types: ['steel', 'psychic'] }),
        makePokemon({ name: 'Dragonite', types: ['dragon', 'flying'] }),
        makePokemon({ name: 'Clefable', types: ['fairy'] }),
        makePokemon({ name: 'P4', types: ['normal'] }),
        makePokemon({ name: 'P5', types: ['normal'] }),
        makePokemon({ name: 'P6', types: ['normal'] }),
      ];

      const result = synergyDetectorService.analyze(team);

      const sdfCore = result.cores.find((c) => c.name === 'Steel-Dragon-Fairy');
      expect(sdfCore).toBeDefined();
    });

    it('should detect partial cores (2 out of 3 types)', () => {
      const team = [
        makePokemon({ name: 'Charizard', types: ['fire', 'flying'] }),
        makePokemon({ name: 'Blastoise', types: ['water'] }),
        makePokemon({ name: 'P3', types: ['normal'] }),
        makePokemon({ name: 'P4', types: ['normal'] }),
        makePokemon({ name: 'P5', types: ['normal'] }),
        makePokemon({ name: 'P6', types: ['normal'] }),
      ];

      const result = synergyDetectorService.analyze(team);

      const fwgCore = result.cores.find((c) => c.name === 'Fire-Water-Grass');
      expect(fwgCore).toBeDefined();
    });

    it('should calculate type coverage correctly', () => {
      const team = [
        makePokemon({ name: 'P1', types: ['fire', 'water'] }),
        makePokemon({ name: 'P2', types: ['grass', 'electric'] }),
        makePokemon({ name: 'P3', types: ['ice', 'ground'] }),
        makePokemon({ name: 'P4', types: ['normal'] }),
        makePokemon({ name: 'P5', types: ['normal'] }),
        makePokemon({ name: 'P6', types: ['normal'] }),
      ];

      const result = synergyDetectorService.analyze(team);

      expect(result.typeCoverage).toBe(7);
    });

    it('should calculate synergy score based on cores and coverage', () => {
      const team = [
        makePokemon({ name: 'Charizard', types: ['fire', 'flying'] }),
        makePokemon({ name: 'Blastoise', types: ['water'] }),
        makePokemon({ name: 'Venusaur', types: ['grass', 'poison'] }),
        makePokemon({ name: 'Metagross', types: ['steel', 'psychic'] }),
        makePokemon({ name: 'Dragonite', types: ['dragon', 'flying'] }),
        makePokemon({ name: 'Clefable', types: ['fairy'] }),
      ];

      const result = synergyDetectorService.analyze(team);

      expect(result.synergyScore).toBeGreaterThan(0);
      expect(result.synergyScore).toBeLessThanOrEqual(100);
    });

    it('should generate recommendations', () => {
      const team = [
        makePokemon({ name: 'P1', types: ['normal'] }),
        makePokemon({ name: 'P2', types: ['normal'] }),
        makePokemon({ name: 'P3', types: ['normal'] }),
        makePokemon({ name: 'P4', types: ['normal'] }),
        makePokemon({ name: 'P5', types: ['normal'] }),
        makePokemon({ name: 'P6', types: ['normal'] }),
      ];

      const result = synergyDetectorService.analyze(team);

      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should detect Water-Ground-Electric core', () => {
      const team = [
        makePokemon({ name: 'Gyarados', types: ['water', 'flying'] }),
        makePokemon({ name: 'Garchomp', types: ['dragon', 'ground'] }),
        makePokemon({ name: 'Zapdos', types: ['electric', 'flying'] }),
        makePokemon({ name: 'P4', types: ['normal'] }),
        makePokemon({ name: 'P5', types: ['normal'] }),
        makePokemon({ name: 'P6', types: ['normal'] }),
      ];

      const result = synergyDetectorService.analyze(team);

      const wgeCore = result.cores.find((c) => c.name === 'Water-Ground-Electric');
      expect(wgeCore).toBeDefined();
    });

    it('should detect Dark-Ghost-Fighting core', () => {
      const team = [
        makePokemon({ name: 'Tyranitar', types: ['rock', 'dark'] }),
        makePokemon({ name: 'Gengar', types: ['ghost', 'poison'] }),
        makePokemon({ name: 'Lucario', types: ['fighting', 'steel'] }),
        makePokemon({ name: 'P4', types: ['normal'] }),
        makePokemon({ name: 'P5', types: ['normal'] }),
        makePokemon({ name: 'P6', types: ['normal'] }),
      ];

      const result = synergyDetectorService.analyze(team);

      const dgfCore = result.cores.find((c) => c.name === 'Dark-Ghost-Fighting');
      expect(dgfCore).toBeDefined();
    });

    it('should handle team with all 18 types', () => {
      const team = [
        makePokemon({ name: 'P1', types: ['normal', 'fire'] }),
        makePokemon({ name: 'P2', types: ['water', 'grass'] }),
        makePokemon({ name: 'P3', types: ['electric', 'ice'] }),
        makePokemon({ name: 'P4', types: ['fighting', 'poison'] }),
        makePokemon({ name: 'P5', types: ['ground', 'flying'] }),
        makePokemon({ name: 'P6', types: ['psychic', 'bug'] }),
      ];

      const result = synergyDetectorService.analyze(team);

      expect(result.typeCoverage).toBe(12);
    });

    it('should identify missing core types in recommendations', () => {
      const team = [
        makePokemon({ name: 'Charizard', types: ['fire', 'flying'] }),
        makePokemon({ name: 'Blastoise', types: ['water'] }),
        makePokemon({ name: 'P3', types: ['normal'] }),
        makePokemon({ name: 'P4', types: ['normal'] }),
        makePokemon({ name: 'P5', types: ['normal'] }),
        makePokemon({ name: 'P6', types: ['normal'] }),
      ];

      const result = synergyDetectorService.analyze(team);

      const hasGrassRecommendation = result.recommendations.some((r) =>
        r.toLowerCase().includes('grass')
      );
      expect(hasGrassRecommendation).toBe(true);
    });
  });
});
