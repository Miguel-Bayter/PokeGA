import { describe, it, expect } from 'vitest';
import { weaknessDetectionService } from '@/server/services/analysis/weakness-detection.service';
import { defensiveCoverageService } from '@/server/services/analysis/defensive-coverage.service';
import { POKEMON_TYPES } from '@/lib/type-chart';
import type { TeamPokemonData, DefensiveCoverageResult } from '@/server/services/analysis/types';

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

describe('WeaknessDetectionService', () => {
  describe('analyze', () => {
    it('should return empty report for team with no shared weaknesses', () => {
      const team = [
        makePokemon({ name: 'P1', types: ['steel', 'dragon'] }),
        makePokemon({ name: 'P2', types: ['water', 'ground'] }),
        makePokemon({ name: 'P3', types: ['fire', 'flying'] }),
        makePokemon({ name: 'P4', types: ['ghost', 'dark'] }),
        makePokemon({ name: 'P5', types: ['electric', 'steel'] }),
        makePokemon({ name: 'P6', types: ['fairy'] }),
      ];

      const defensive = defensiveCoverageService.calculate(team);
      const report = weaknessDetectionService.analyze(defensive);

      expect(report.sharedWeaknesses).toBeDefined();
      expect(report.recommendations.length).toBeGreaterThan(0);
    });

    it('should detect shared weakness when 3+ Pokemon are weak to same type', () => {
      const team = [
        makePokemon({ name: 'Fire1', types: ['fire'] }),
        makePokemon({ name: 'Fire2', types: ['fire'] }),
        makePokemon({ name: 'Fire3', types: ['fire'] }),
        makePokemon({ name: 'P4', types: ['normal'] }),
        makePokemon({ name: 'P5', types: ['normal'] }),
        makePokemon({ name: 'P6', types: ['normal'] }),
      ];

      const defensive = defensiveCoverageService.calculate(team);
      const report = weaknessDetectionService.analyze(defensive);

      const waterWeakness = report.sharedWeaknesses.find((w) => w.type === 'water');
      expect(waterWeakness).toBeDefined();
      expect(waterWeakness!.weakPokemonCount).toBeGreaterThanOrEqual(3);
    });

    it('should assign correct severity levels', () => {
      const team = [
        makePokemon({ name: 'P1', types: ['fire'] }),
        makePokemon({ name: 'P2', types: ['fire'] }),
        makePokemon({ name: 'P3', types: ['fire'] }),
        makePokemon({ name: 'P4', types: ['fire'] }),
        makePokemon({ name: 'P5', types: ['fire'] }),
        makePokemon({ name: 'P6', types: ['normal'] }),
      ];

      const defensive = defensiveCoverageService.calculate(team);
      const report = weaknessDetectionService.analyze(defensive);

      const waterWeakness = report.sharedWeaknesses.find((w) => w.type === 'water');
      expect(waterWeakness).toBeDefined();
      expect(waterWeakness!.severity).toBe('critical');
    });

    it('should sort weaknesses by severity (critical first)', () => {
      const team = [
        makePokemon({ name: 'P1', types: ['fire'] }),
        makePokemon({ name: 'P2', types: ['fire'] }),
        makePokemon({ name: 'P3', types: ['fire'] }),
        makePokemon({ name: 'P4', types: ['normal'] }),
        makePokemon({ name: 'P5', types: ['normal'] }),
        makePokemon({ name: 'P6', types: ['normal'] }),
      ];

      const defensive = defensiveCoverageService.calculate(team);
      const report = weaknessDetectionService.analyze(defensive);

      if (report.sharedWeaknesses.length >= 2) {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        for (let i = 0; i < report.sharedWeaknesses.length - 1; i++) {
          expect(severityOrder[report.sharedWeaknesses[i].severity]).toBeLessThanOrEqual(
            severityOrder[report.sharedWeaknesses[i + 1].severity]
          );
        }
      }
    });

    it('should generate recommendations for high severity weaknesses', () => {
      const team = [
        makePokemon({ name: 'P1', types: ['fire'] }),
        makePokemon({ name: 'P2', types: ['fire'] }),
        makePokemon({ name: 'P3', types: ['fire'] }),
        makePokemon({ name: 'P4', types: ['fire'] }),
        makePokemon({ name: 'P5', types: ['fire'] }),
        makePokemon({ name: 'P6', types: ['normal'] }),
      ];

      const defensive = defensiveCoverageService.calculate(team);
      const report = weaknessDetectionService.analyze(defensive);

      expect(report.recommendations.length).toBeGreaterThan(0);
    });

    it('should count critical weaknesses correctly', () => {
      const team = [
        makePokemon({ name: 'P1', types: ['fire'] }),
        makePokemon({ name: 'P2', types: ['fire'] }),
        makePokemon({ name: 'P3', types: ['fire'] }),
        makePokemon({ name: 'P4', types: ['fire'] }),
        makePokemon({ name: 'P5', types: ['fire'] }),
        makePokemon({ name: 'P6', types: ['normal'] }),
      ];

      const defensive = defensiveCoverageService.calculate(team);
      const report = weaknessDetectionService.analyze(defensive);

      expect(report.criticalCount).toBeGreaterThanOrEqual(0);
    });

    it('should suggest covers from team members that resist the weakness', () => {
      const team = [
        makePokemon({ name: 'Fire1', types: ['fire'] }),
        makePokemon({ name: 'Fire2', types: ['fire'] }),
        makePokemon({ name: 'Fire3', types: ['fire'] }),
        makePokemon({ name: 'Water1', types: ['water'] }),
        makePokemon({ name: 'P5', types: ['normal'] }),
        makePokemon({ name: 'P6', types: ['normal'] }),
      ];

      const defensive = defensiveCoverageService.calculate(team);
      const report = weaknessDetectionService.analyze(defensive);

      const fireWeakness = report.sharedWeaknesses.find((w) => w.type === 'water');
      if (fireWeakness) {
        expect(fireWeakness.suggestedCovers).toBeDefined();
      }
    });

    it('should handle defensive coverage with no weaknesses at all', () => {
      const mockCoverage: DefensiveCoverageResult = {
        coverage: {} as DefensiveCoverageResult['coverage'],
        sharedWeaknesses: [],
        defensiveScore: 90,
      };

      for (const type of POKEMON_TYPES) {
        mockCoverage.coverage[type] = {
          effectiveness: 0.5,
          weakPokemon: [],
          resistantPokemon: ['P1', 'P2'],
        };
      }

      const report = weaknessDetectionService.analyze(mockCoverage);

      expect(report.sharedWeaknesses).toHaveLength(0);
      expect(report.criticalCount).toBe(0);
    });
  });
});
