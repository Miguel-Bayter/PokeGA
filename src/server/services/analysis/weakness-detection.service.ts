import { POKEMON_TYPES, TYPE_CHART, type PokemonType } from '@/lib/type-chart';
import { defensiveCoverageService } from './defensive-coverage.service';
import type {
  TeamPokemonData,
  DefensiveCoverageResult,
  WeaknessReport,
  SharedWeakness,
} from './types';

/**
 * Detects shared weaknesses across a team and provides actionable recommendations.
 *
 * Algorithm:
 * 1. Find types where 3+ Pokemon have effectiveness >= 2
 * 2. Calculate severity based on count and max effectiveness multiplier
 * 3. Suggest Pokemon from the team that can cover each weakness
 */
export class WeaknessDetectionService {
  /**
   * Generate a weakness report from defensive coverage data.
   *
   * @param defensiveCoverage - Pre-computed defensive coverage result
   * @returns Weakness report with severity levels and suggestions
   */
  analyze(defensiveCoverage: DefensiveCoverageResult): WeaknessReport {
    const sharedWeaknesses: SharedWeakness[] = [];

    for (const atkType of POKEMON_TYPES) {
      const entry = defensiveCoverage.coverage[atkType];
      if (!entry) continue;

      const weakCount = entry.weakPokemon.length;
      if (weakCount < 3) continue;

      const maxEffectiveness = this.getMaxEffectiveness(entry.weakPokemon, atkType);
      const severity = this.calculateSeverity(weakCount, maxEffectiveness);

      const suggestedCovers = this.findSuggestedCovers(
        atkType,
        defensiveCoverage,
        entry.weakPokemon
      );

      sharedWeaknesses.push({
        type: atkType,
        weakPokemonCount: weakCount,
        maxEffectiveness,
        severity,
        suggestedCovers,
      });
    }

    sharedWeaknesses.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });

    const criticalCount = sharedWeaknesses.filter((w) => w.severity === 'critical').length;
    const recommendations = this.generateRecommendations(sharedWeaknesses);

    return {
      sharedWeaknesses,
      criticalCount,
      recommendations,
    };
  }

  /**
   * Directly analyze team data without pre-computed defensive coverage.
   *
   * @param team - Array of Pokemon with types
   * @returns Weakness report
   */
  analyzeFromTeam(team: TeamPokemonData[]): WeaknessReport {
    const coverage = defensiveCoverageService.calculate(team);
    return this.analyze(coverage);
  }

  private getMaxEffectiveness(weakPokemon: string[], _atkType: string): number {
    if (weakPokemon.length === 0) return 0;
    return weakPokemon.length >= 5 ? 4 : weakPokemon.length >= 4 ? 2 : 2;
  }

  private calculateSeverity(
    weakCount: number,
    maxEffectiveness: number
  ): SharedWeakness['severity'] {
    if (weakCount >= 5 || maxEffectiveness >= 4) return 'critical';
    if (weakCount >= 4) return 'high';
    if (weakCount >= 3) return 'medium';
    return 'low';
  }

  private findSuggestedCovers(
    weakType: PokemonType,
    defensiveCoverage: DefensiveCoverageResult,
    weakPokemon: string[]
  ): string[] {
    const covers: string[] = [];
    const weakSet = new Set(weakPokemon);

    for (const atkType of POKEMON_TYPES) {
      const entry = defensiveCoverage.coverage[atkType];
      if (!entry) continue;

      for (const pokemonName of entry.resistantPokemon) {
        if (!weakSet.has(pokemonName) && !covers.includes(pokemonName)) {
          const effectiveness = TYPE_CHART[weakType][atkType as PokemonType];
          if (effectiveness !== undefined) {
            covers.push(pokemonName);
          }
        }
      }
    }

    return covers.slice(0, 5);
  }

  private generateRecommendations(weaknesses: SharedWeakness[]): string[] {
    const recommendations: string[] = [];

    for (const weakness of weaknesses) {
      if (weakness.severity === 'critical') {
        recommendations.push(
          `CRITICAL: ${weakness.weakPokemonCount} Pokemon are weak to ${weakness.type}. ` +
            `Consider adding a ${this.getResistType(weakness.type)} type to cover this weakness.`
        );
      } else if (weakness.severity === 'high') {
        recommendations.push(
          `HIGH: ${weakness.weakPokemonCount} Pokemon are weak to ${weakness.type}. ` +
            `A ${this.getResistType(weakness.type)} type partner could help.`
        );
      }
    }

    if (weaknesses.length === 0) {
      recommendations.push('No significant shared weaknesses detected. Good defensive coverage!');
    }

    return recommendations;
  }

  private getResistType(weaknessType: string): string {
    const resistMap: Record<string, string> = {
      fire: 'water',
      water: 'grass',
      electric: 'ground',
      grass: 'fire',
      ice: 'fire',
      fighting: 'fairy',
      poison: 'ground',
      ground: 'water',
      flying: 'electric',
      psychic: 'dark',
      bug: 'fire',
      rock: 'water',
      ghost: 'dark',
      dragon: 'fairy',
      dark: 'fairy',
      steel: 'fire',
      fairy: 'poison',
      normal: 'fighting',
    };
    return resistMap[weaknessType] ?? 'neutral';
  }
}

export const weaknessDetectionService = new WeaknessDetectionService();
