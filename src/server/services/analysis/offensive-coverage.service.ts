import { POKEMON_TYPES, TYPE_CHART } from '@/lib/type-chart';
import type { TeamPokemonData, OffensiveCoverageResult, CoverageMatrix } from './types';

/**
 * Calculates offensive coverage for a team across all 18 types.
 *
 * Algorithm:
 * 1. Collect all unique move types from each Pokemon
 * 2. For each attacking type, calculate effectiveness against all 18 defending types
 * 3. Aggregate across team (sum effectiveness multipliers)
 * 4. Apply STAB bonus (1.5x) when Pokemon type matches move type
 */
export class OffensiveCoverageService {
  /**
   * Calculate the full offensive coverage matrix for a team.
   *
   * @param team - Array of up to 6 Pokemon with their moves and types
   * @returns Coverage matrix with effectiveness values and summary maps
   */
  calculate(team: TeamPokemonData[]): OffensiveCoverageResult {
    if (team.length === 0) {
      return this.emptyResult();
    }

    const matrix: CoverageMatrix = {};
    const pokemonContributions: Record<string, string[]> = {};

    for (const atkType of POKEMON_TYPES) {
      matrix[atkType] = {};
      for (const defType of POKEMON_TYPES) {
        matrix[atkType][defType] = 0;
      }
    }

    for (const pokemon of team) {
      const moveTypes = new Set<string>();
      for (const move of pokemon.moves) {
        if (move.category !== 'status') {
          moveTypes.add(move.type);
        }
      }

      for (const move of pokemon.moves) {
        if (move.category === 'status') continue;

        const atkType = move.type;
        const isSTAB = pokemon.types.includes(atkType);
        const stabMultiplier = isSTAB ? 1.5 : 1;

        for (const defType of POKEMON_TYPES) {
          const baseEffectiveness = TYPE_CHART[atkType][defType];
          const weightedEffectiveness = baseEffectiveness * stabMultiplier;
          matrix[atkType][defType] += weightedEffectiveness;
        }
      }

      const pokemonMoveTypes = Array.from(moveTypes);
      pokemonContributions[pokemon.name] = pokemonMoveTypes;
    }

    const superEffective: Record<string, string[]> = {};
    const notVeryEffective: Record<string, string[]> = {};
    const immune: Record<string, string[]> = {};

    for (const defType of POKEMON_TYPES) {
      superEffective[defType] = [];
      notVeryEffective[defType] = [];
      immune[defType] = [];

      for (const atkType of POKEMON_TYPES) {
        const value = matrix[atkType][defType];
        if (value >= 2) {
          superEffective[defType].push(atkType);
        } else if (value > 0 && value < 1) {
          notVeryEffective[defType].push(atkType);
        } else if (value === 0) {
          immune[defType].push(atkType);
        }
      }
    }

    const coverageScore = this.calculateCoverageScore(matrix);

    return {
      matrix,
      superEffective,
      notVeryEffective,
      immune,
      coverageScore,
      pokemonContributions,
    };
  }

  private calculateCoverageScore(matrix: CoverageMatrix): number {
    let coveredCount = 0;

    for (const defType of POKEMON_TYPES) {
      let hasSuperEffective = false;
      for (const atkType of POKEMON_TYPES) {
        if (matrix[atkType][defType] >= 2) {
          hasSuperEffective = true;
          break;
        }
      }
      if (hasSuperEffective) coveredCount++;
    }

    return Math.round((coveredCount / POKEMON_TYPES.length) * 100);
  }

  private emptyResult(): OffensiveCoverageResult {
    const matrix: CoverageMatrix = {};
    for (const atkType of POKEMON_TYPES) {
      matrix[atkType] = {};
      for (const defType of POKEMON_TYPES) {
        matrix[atkType][defType] = 0;
      }
    }

    return {
      matrix,
      superEffective: {},
      notVeryEffective: {},
      immune: {},
      coverageScore: 0,
      pokemonContributions: {},
    };
  }
}

export const offensiveCoverageService = new OffensiveCoverageService();
