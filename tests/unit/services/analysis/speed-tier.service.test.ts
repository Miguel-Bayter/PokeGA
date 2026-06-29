import { describe, it, expect } from 'vitest';
import { speedTierService } from '@/server/services/analysis/speed-tier.service';
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

describe('SpeedTierService', () => {
  describe('calculateSpeed', () => {
    it('should calculate speed with neutral nature and 0 SP', () => {
      const speed = speedTierService.calculateSpeed(100, 0, 'hardy');
      // floor((floor((2*100 + 31 + 0) * 50 / 100) + 5) * 1.0)
      // = floor((floor(231 * 0.5) + 5) * 1.0)
      // = floor((115 + 5) * 1.0)
      // = 120
      expect(speed).toBe(120);
    });

    it('should calculate speed with neutral nature and max SP (32)', () => {
      const speed = speedTierService.calculateSpeed(100, 32, 'hardy');
      // floor((floor((2*100 + 31 + floor(32/4)) * 50 / 100) + 5) * 1.0)
      // = floor((floor((200 + 31 + 8) * 0.5) + 5) * 1.0)
      // = floor((floor(239 * 0.5) + 5) * 1.0)
      // = floor((119 + 5) * 1.0)
      // = 124
      expect(speed).toBe(124);
    });

    it('should apply 1.1x multiplier for Jolly nature', () => {
      const neutralSpeed = speedTierService.calculateSpeed(100, 0, 'hardy');
      const jollySpeed = speedTierService.calculateSpeed(100, 0, 'jolly');

      expect(jollySpeed).toBe(Math.floor(neutralSpeed * 1.1));
    });

    it('should apply 1.1x multiplier for Timid nature', () => {
      const neutralSpeed = speedTierService.calculateSpeed(100, 0, 'hardy');
      const timidSpeed = speedTierService.calculateSpeed(100, 0, 'timid');

      expect(timidSpeed).toBe(Math.floor(neutralSpeed * 1.1));
    });

    it('should apply 0.9x multiplier for Brave nature', () => {
      const neutralSpeed = speedTierService.calculateSpeed(100, 0, 'hardy');
      const braveSpeed = speedTierService.calculateSpeed(100, 0, 'brave');

      expect(braveSpeed).toBe(Math.floor(neutralSpeed * 0.9));
    });

    it('should apply 0.9x multiplier for Relaxed nature', () => {
      const neutralSpeed = speedTierService.calculateSpeed(100, 0, 'hardy');
      const relaxedSpeed = speedTierService.calculateSpeed(100, 0, 'relaxed');

      expect(relaxedSpeed).toBe(Math.floor(neutralSpeed * 0.9));
    });

    it('should handle low base speed correctly', () => {
      const speed = speedTierService.calculateSpeed(30, 0, 'hardy');
      // floor((floor((60 + 31 + 0) * 0.5) + 5) * 1.0)
      // = floor((floor(45.5) + 5) * 1.0)
      // = floor((45 + 5) * 1.0)
      // = 50
      expect(speed).toBe(50);
    });

    it('should handle high base speed correctly', () => {
      const speed = speedTierService.calculateSpeed(180, 32, 'jolly');
      // floor((floor((360 + 31 + 8) * 0.5) + 5) * 1.1)
      // = floor((floor(399 * 0.5) + 5) * 1.1)
      // = floor((199 + 5) * 1.1)
      // = floor(204 * 1.1)
      // = floor(224.4)
      // = 224
      expect(speed).toBe(224);
    });

    it('should handle SP values that are not multiples of 4', () => {
      const speed1 = speedTierService.calculateSpeed(100, 1, 'hardy');
      const speed2 = speedTierService.calculateSpeed(100, 3, 'hardy');
      // floor(1/4) = 0, floor(3/4) = 0
      expect(speed1).toBe(speed2);

      const speed3 = speedTierService.calculateSpeed(100, 4, 'hardy');
      // floor(4/4) = 1
      expect(speed3).toBeGreaterThan(speed1);
    });
  });

  describe('getNatureMultiplier', () => {
    it('should return 1.1 for speed-boosting natures', () => {
      expect(speedTierService.getNatureMultiplier('jolly')).toBe(1.1);
      expect(speedTierService.getNatureMultiplier('timid')).toBe(1.1);
      expect(speedTierService.getNatureMultiplier('hasty')).toBe(1.1);
      expect(speedTierService.getNatureMultiplier('naive')).toBe(1.1);
    });

    it('should return 0.9 for speed-reducing natures', () => {
      expect(speedTierService.getNatureMultiplier('brave')).toBe(0.9);
      expect(speedTierService.getNatureMultiplier('relaxed')).toBe(0.9);
      expect(speedTierService.getNatureMultiplier('bold')).toBe(0.9);
      expect(speedTierService.getNatureMultiplier('calm')).toBe(0.9);
    });

    it('should return 1.0 for neutral natures', () => {
      expect(speedTierService.getNatureMultiplier('hardy')).toBe(1.0);
      expect(speedTierService.getNatureMultiplier('docile')).toBe(1.0);
      expect(speedTierService.getNatureMultiplier('serious')).toBe(1.0);
      expect(speedTierService.getNatureMultiplier('quirky')).toBe(1.0);
    });

    it('should be case-insensitive', () => {
      expect(speedTierService.getNatureMultiplier('JOLLY')).toBe(1.1);
      expect(speedTierService.getNatureMultiplier('Timid')).toBe(1.1);
      expect(speedTierService.getNatureMultiplier('BRAVE')).toBe(0.9);
    });
  });

  describe('analyze', () => {
    it('should return empty result for empty team', () => {
      const result = speedTierService.analyze([]);
      expect(result.tiers).toHaveLength(0);
      expect(result.averageSpeed).toBe(0);
      expect(result.speedScore).toBe(0);
    });

    it('should rank Pokemon by speed (fastest first)', () => {
      const team = [
        makePokemon({
          name: 'Slow',
          baseStats: { hp: 100, atk: 100, def: 100, spAtk: 100, spDef: 100, spd: 50 },
        }),
        makePokemon({
          name: 'Fast',
          baseStats: { hp: 100, atk: 100, def: 100, spAtk: 100, spDef: 100, spd: 150 },
        }),
        makePokemon({
          name: 'Medium',
          baseStats: { hp: 100, atk: 100, def: 100, spAtk: 100, spDef: 100, spd: 100 },
        }),
      ];

      const result = speedTierService.analyze(team);

      expect(result.tiers[0].pokemonName).toBe('Fast');
      expect(result.tiers[0].rank).toBe(1);
      expect(result.tiers[2].pokemonName).toBe('Slow');
      expect(result.tiers[2].rank).toBe(3);
    });

    it('should identify fastest and slowest correctly', () => {
      const team = [
        makePokemon({
          name: 'P1',
          baseStats: { hp: 100, atk: 100, def: 100, spAtk: 100, spDef: 100, spd: 80 },
        }),
        makePokemon({
          name: 'P2',
          baseStats: { hp: 100, atk: 100, def: 100, spAtk: 100, spDef: 100, spd: 120 },
        }),
      ];

      const result = speedTierService.analyze(team);

      expect(result.fastest.pokemonName).toBe('P2');
      expect(result.slowest.pokemonName).toBe('P1');
    });

    it('should calculate average speed correctly', () => {
      const team = [
        makePokemon({
          name: 'P1',
          baseStats: { hp: 100, atk: 100, def: 100, spAtk: 100, spDef: 100, spd: 100 },
        }),
        makePokemon({
          name: 'P2',
          baseStats: { hp: 100, atk: 100, def: 100, spAtk: 100, spDef: 100, spd: 100 },
        }),
      ];

      const result = speedTierService.analyze(team);

      expect(result.averageSpeed).toBe(121);
    });

    it('should calculate speed gaps between consecutive tiers', () => {
      const team = [
        makePokemon({
          name: 'P1',
          baseStats: { hp: 100, atk: 100, def: 100, spAtk: 100, spDef: 100, spd: 100 },
        }),
        makePokemon({
          name: 'P2',
          baseStats: { hp: 100, atk: 100, def: 100, spAtk: 100, spDef: 100, spd: 100 },
        }),
        makePokemon({
          name: 'P3',
          baseStats: { hp: 100, atk: 100, def: 100, spAtk: 100, spDef: 100, spd: 100 },
        }),
      ];

      const result = speedTierService.analyze(team);

      expect(result.speedGaps).toHaveLength(2);
      expect(result.speedGaps[0]).toBe(0);
      expect(result.speedGaps[1]).toBe(0);
    });

    it('should account for SP allocation in speed analysis', () => {
      const team = [
        makePokemon({
          name: 'NoSP',
          baseStats: { hp: 100, atk: 100, def: 100, spAtk: 100, spDef: 100, spd: 100 },
          statPoints: { hp: 32, atk: 32, def: 2, spAtk: 0, spDef: 0, spd: 0 },
        }),
        makePokemon({
          name: 'MaxSP',
          baseStats: { hp: 100, atk: 100, def: 100, spAtk: 100, spDef: 100, spd: 100 },
          statPoints: { hp: 0, atk: 0, def: 0, spAtk: 0, spDef: 2, spd: 32 },
        }),
      ];

      const result = speedTierService.analyze(team);

      expect(result.tiers[0].pokemonName).toBe('MaxSP');
      expect(result.tiers[0].allocatedSP).toBe(32);
    });

    it('should calculate speed score between 0 and 100', () => {
      const team = [
        makePokemon({
          name: 'P1',
          baseStats: { hp: 100, atk: 100, def: 100, spAtk: 100, spDef: 100, spd: 100 },
        }),
        makePokemon({
          name: 'P2',
          baseStats: { hp: 100, atk: 100, def: 100, spAtk: 100, spDef: 100, spd: 100 },
        }),
      ];

      const result = speedTierService.analyze(team);

      expect(result.speedScore).toBeGreaterThanOrEqual(0);
      expect(result.speedScore).toBeLessThanOrEqual(100);
    });
  });
});
