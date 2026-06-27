import {
  PokemonType,
  POKEMON_TYPES,
  calculateDualTypeEffectiveness,
  getTypeEffectiveness,
} from '@/lib/type-chart';

/**
 * Represents a Pokemon's type configuration
 */
export interface PokemonTypeConfig {
  types: [PokemonType] | [PokemonType, PokemonType];
}

/**
 * Result of defensive coverage analysis
 */
export interface DefensiveCoverageResult {
  /**
   * Map of attack type -> effectiveness multiplier against the team
   * Values: 0 (immune), 0.25 (quad resist), 0.5 (resist), 1 (neutral), 2 (weak), 4 (quad weak)
   */
  effectiveness: Record<PokemonType, number>;

  /**
   * Types that the team is immune to (0x damage)
   */
  immunities: PokemonType[];

  /**
   * Types that the team resists (0.25x or 0.5x damage)
   */
  resistances: PokemonType[];

  /**
   * Types that deal neutral damage (1x)
   */
  neutral: PokemonType[];

  /**
   * Types that the team is weak to (2x or 4x damage)
   */
  weaknesses: PokemonType[];

  /**
   * Types that the team is doubly weak to (4x damage)
   */
  doubleWeaknesses: PokemonType[];
}

/**
 * Result of offensive coverage analysis
 */
export interface OffensiveCoverageResult {
  /**
   * Map of defensive type -> how many Pokemon on the team can hit it super effectively
   */
  coverage: Record<PokemonType, number>;

  /**
   * Types that no Pokemon on the team can hit super effectively
   */
  uncoveredTypes: PokemonType[];

  /**
   * Types that at least one Pokemon can hit super effectively
   */
  coveredTypes: PokemonType[];

  /**
   * Total coverage score (0-18, higher is better)
   */
  coverageScore: number;
}

/**
 * Service for calculating type effectiveness and coverage
 */
export class TypeEffectivenessService {
  /**
   * Calculate effectiveness of a single attack type against a single defense type
   *
   * @param attackType - The attacking type
   * @param defenseType - The defending type
   * @returns Effectiveness multiplier (0, 0.25, 0.5, 1, 2, or 4)
   */
  calculateTypeEffectiveness(attackType: PokemonType, defenseType: PokemonType): number {
    return getTypeEffectiveness(attackType, defenseType);
  }

  /**
   * Calculate effectiveness of an attack type against a dual-type defender
   *
   * @param attackType - The attacking type
   * @param defenseTypes - Array of 1 or 2 defending types
   * @returns Combined effectiveness multiplier
   */
  calculateDualTypeEffectiveness(
    attackType: PokemonType,
    defenseTypes: [PokemonType] | [PokemonType, PokemonType]
  ): number {
    return calculateDualTypeEffectiveness(attackType, defenseTypes);
  }

  /**
   * Calculate defensive coverage for a team
   * Analyzes how the team fares against each attack type
   *
   * @param team - Array of Pokemon with their types
   * @returns Defensive coverage analysis
   */
  calculateTeamDefensiveCoverage(team: PokemonTypeConfig[]): DefensiveCoverageResult {
    return this.calculateDefensiveCoverage(team);
  }

  /**
   * Calculate offensive coverage for a team
   * Analyzes how many types each Pokemon can hit super effectively
   *
   * @param team - Array of Pokemon with their types and moves
   * @returns Offensive coverage analysis
   */
  calculateTeamOffensiveCoverage(
    team: Array<PokemonTypeConfig & { moveTypes?: PokemonType[] }>
  ): OffensiveCoverageResult {
    return this.calculateOffensiveCoverage(team);
  }

  /**
   * Calculate defensive coverage for a team
   * Analyzes how the team fares against each attack type
   *
   * @param team - Array of Pokemon with their types
   * @returns Defensive coverage analysis
   */
  calculateDefensiveCoverage(team: PokemonTypeConfig[]): DefensiveCoverageResult {
    const effectiveness: Record<PokemonType, number> = {} as Record<PokemonType, number>;

    // Initialize with zeros
    for (const type of POKEMON_TYPES) {
      effectiveness[type] = 0;
    }

    // Calculate total effectiveness for each attack type
    for (const pokemon of team) {
      for (const attackType of POKEMON_TYPES) {
        const multiplier = calculateDualTypeEffectiveness(attackType, pokemon.types);
        effectiveness[attackType] += multiplier;
      }
    }

    // Average across team size
    const teamSize = team.length;
    for (const type of POKEMON_TYPES) {
      effectiveness[type] /= teamSize;
    }

    // Categorize types
    const immunities: PokemonType[] = [];
    const resistances: PokemonType[] = [];
    const neutral: PokemonType[] = [];
    const weaknesses: PokemonType[] = [];
    const doubleWeaknesses: PokemonType[] = [];

    for (const type of POKEMON_TYPES) {
      const value = effectiveness[type];

      if (value === 0) {
        immunities.push(type);
      } else if (value < 0.75) {
        resistances.push(type);
      } else if (value <= 1.25) {
        neutral.push(type);
      } else if (value <= 2) {
        weaknesses.push(type);
      } else {
        doubleWeaknesses.push(type);
      }
    }

    return {
      effectiveness,
      immunities,
      resistances,
      neutral,
      weaknesses,
      doubleWeaknesses,
    };
  }

  /**
   * Calculate offensive coverage for a team
   * Analyzes how many types each Pokemon can hit super effectively
   *
   * @param team - Array of Pokemon with their types and moves
   * @returns Offensive coverage analysis
   */
  calculateOffensiveCoverage(
    team: Array<PokemonTypeConfig & { moveTypes?: PokemonType[] }>
  ): OffensiveCoverageResult {
    const coverage: Record<PokemonType, number> = {} as Record<PokemonType, number>;

    // Initialize with zeros
    for (const type of POKEMON_TYPES) {
      coverage[type] = 0;
    }

    // For each Pokemon, count how many types it can hit super effectively
    for (const pokemon of team) {
      const attackTypes = pokemon.moveTypes || pokemon.types;

      for (const attackType of attackTypes) {
        for (const defenseType of POKEMON_TYPES) {
          const effectiveness = getTypeEffectiveness(attackType, defenseType);
          if (effectiveness >= 2) {
            coverage[defenseType]++;
          }
        }
      }
    }

    // Determine covered and uncovered types
    const coveredTypes: PokemonType[] = [];
    const uncoveredTypes: PokemonType[] = [];

    for (const type of POKEMON_TYPES) {
      if (coverage[type] > 0) {
        coveredTypes.push(type);
      } else {
        uncoveredTypes.push(type);
      }
    }

    // Calculate coverage score
    const coverageScore = coveredTypes.length;

    return {
      coverage,
      uncoveredTypes,
      coveredTypes,
      coverageScore,
    };
  }

  /**
   * Find shared weaknesses across the team
   * Types that multiple Pokemon are weak to
   *
   * @param team - Array of Pokemon with their types
   * @param threshold - Minimum number of Pokemon that must be weak (default: 2)
   * @returns Array of types that are shared weaknesses
   */
  findSharedWeaknesses(team: PokemonTypeConfig[], threshold: number = 2): PokemonType[] {
    const weaknessCount: Record<PokemonType, number> = {} as Record<PokemonType, number>;

    // Initialize
    for (const type of POKEMON_TYPES) {
      weaknessCount[type] = 0;
    }

    // Count weaknesses
    for (const pokemon of team) {
      for (const attackType of POKEMON_TYPES) {
        const effectiveness = calculateDualTypeEffectiveness(attackType, pokemon.types);
        if (effectiveness >= 2) {
          weaknessCount[attackType]++;
        }
      }
    }

    // Filter by threshold
    const sharedWeaknesses: PokemonType[] = [];
    for (const type of POKEMON_TYPES) {
      if (weaknessCount[type] >= threshold) {
        sharedWeaknesses.push(type);
      }
    }

    return sharedWeaknesses;
  }

  /**
   * Find shared resistances across the team
   * Types that multiple Pokemon resist
   *
   * @param team - Array of Pokemon with their types
   * @param threshold - Minimum number of Pokemon that must resist (default: 2)
   * @returns Array of types that are shared resistances
   */
  findSharedResistances(team: PokemonTypeConfig[], threshold: number = 2): PokemonType[] {
    const resistanceCount: Record<PokemonType, number> = {} as Record<PokemonType, number>;

    // Initialize
    for (const type of POKEMON_TYPES) {
      resistanceCount[type] = 0;
    }

    // Count resistances
    for (const pokemon of team) {
      for (const attackType of POKEMON_TYPES) {
        const effectiveness = calculateDualTypeEffectiveness(attackType, pokemon.types);
        if (effectiveness <= 0.5) {
          resistanceCount[attackType]++;
        }
      }
    }

    // Filter by threshold
    const sharedResistances: PokemonType[] = [];
    for (const type of POKEMON_TYPES) {
      if (resistanceCount[type] >= threshold) {
        sharedResistances.push(type);
      }
    }

    return sharedResistances;
  }

  /**
   * Calculate type synergy score
   * Measures how well the team's types complement each other
   *
   * @param team - Array of Pokemon with their types
   * @returns Synergy score (0-100, higher is better)
   */
  calculateTypeSynergy(team: PokemonTypeConfig[]): number {
    if (team.length === 0) return 0;

    const defensiveCoverage = this.calculateDefensiveCoverage(team);

    // Count how many types are covered (resisted or immune)
    const coveredTypes = defensiveCoverage.immunities.length + defensiveCoverage.resistances.length;

    // Count how many types are problematic (weak or double weak)
    const problematicTypes =
      defensiveCoverage.weaknesses.length + defensiveCoverage.doubleWeaknesses.length;

    // Calculate synergy score
    // More covered types = better, more problematic types = worse
    const maxCovered = POKEMON_TYPES.length;
    const coverageRatio = coveredTypes / maxCovered;
    const problemRatio = problematicTypes / maxCovered;

    const synergyScore = Math.round((coverageRatio - problemRatio * 0.5) * 100);

    return Math.max(0, Math.min(100, synergyScore));
  }
}

// Export singleton instance
export const typeEffectivenessService = new TypeEffectivenessService();
