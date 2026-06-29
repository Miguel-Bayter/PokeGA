import {
  POKEMON_TYPES,
  TYPE_CHART,
  calculateDualTypeEffectiveness,
  type PokemonType,
} from '@/lib/type-chart';
import type { TeamPokemonData, DefensiveCoverageResult, DefensiveCoverage } from './types';

const ABILITY_EFFECTIVENESS_MODIFIERS: Record<string, { type: PokemonType; modifier: number }[]> = {
  levitate: [{ type: 'ground', modifier: 0 }],
  'flash-fire': [{ type: 'fire', modifier: 0 }],
  'water-absorb': [{ type: 'water', modifier: 0 }],
  'volt-absorb': [{ type: 'electric', modifier: 0 }],
  'sap-sipper': [{ type: 'grass', modifier: 0 }],
  'motor-drive': [{ type: 'electric', modifier: 0 }],
  'dry-skin': [{ type: 'water', modifier: 0 }],
  'storm-drain': [{ type: 'water', modifier: 0 }],
  'earth-eater': [{ type: 'ground', modifier: 0 }],
  'thermal-exchange': [{ type: 'fire', modifier: 0 }],
  'purifying-salt': [{ type: 'ghost', modifier: 0.5 }],
  'wonder-skin': [{ type: 'psychic', modifier: 0.5 }],
  'thick-fat': [
    { type: 'fire', modifier: 0.5 },
    { type: 'ice', modifier: 0.5 },
  ],
  heatproof: [{ type: 'fire', modifier: 0.5 }],
  'water-bubble': [{ type: 'fire', modifier: 0.5 }],
};

/**
 * Calculates defensive coverage for a team.
 *
 * Algorithm:
 * 1. For each Pokemon, calculate defensive matchups using dual-type multiplicative model
 * 2. Apply ability-based modifiers (Levitate, Flash Fire, etc.)
 * 3. Aggregate across team, tracking which Pokemon are weak/resistant
 * 4. Identify shared weaknesses (3+ Pokemon weak to same type)
 */
export class DefensiveCoverageService {
  /**
   * Calculate defensive coverage for a team.
   *
   * @param team - Array of Pokemon with types and abilities
   * @returns Defensive coverage with per-type effectiveness and Pokemon tracking
   */
  calculate(team: TeamPokemonData[]): DefensiveCoverageResult {
    if (team.length === 0) {
      return this.emptyResult();
    }

    const coverage: DefensiveCoverage = {};

    for (const atkType of POKEMON_TYPES) {
      coverage[atkType] = {
        effectiveness: 0,
        weakPokemon: [],
        resistantPokemon: [],
      };
    }

    for (const pokemon of team) {
      const defenseTypes = pokemon.types as [PokemonType] | [PokemonType, PokemonType];
      const abilityModifiers = this.getAbilityModifiers(pokemon.abilityName);

      for (const atkType of POKEMON_TYPES) {
        let effectiveness = calculateDualTypeEffectiveness(atkType, defenseTypes);

        const modifier = abilityModifiers.get(atkType);
        if (modifier !== undefined) {
          effectiveness *= modifier;
        }

        if (pokemon.teraType && pokemon.teraType !== atkType) {
          const teraModifier = this.getTypeEffectiveness(atkType, pokemon.teraType);
          if (teraModifier === 0) {
            effectiveness = 0;
          }
        }

        coverage[atkType].effectiveness += effectiveness;

        if (effectiveness >= 2) {
          coverage[atkType].weakPokemon.push(pokemon.name);
        } else if (effectiveness <= 0.5) {
          coverage[atkType].resistantPokemon.push(pokemon.name);
        }
      }
    }

    const teamSize = team.length;
    for (const atkType of POKEMON_TYPES) {
      coverage[atkType].effectiveness =
        Math.round((coverage[atkType].effectiveness / teamSize) * 100) / 100;
    }

    const sharedWeaknesses: string[] = [];
    for (const atkType of POKEMON_TYPES) {
      if (coverage[atkType].weakPokemon.length >= 3) {
        sharedWeaknesses.push(atkType);
      }
    }

    const defensiveScore = this.calculateDefensiveScore(coverage);

    return {
      coverage,
      sharedWeaknesses,
      defensiveScore,
    };
  }

  private getAbilityModifiers(abilityName: string): Map<PokemonType, number> {
    const modifiers = new Map<PokemonType, number>();
    const normalized = abilityName.toLowerCase().replace(/\s+/g, '-');
    const entries = ABILITY_EFFECTIVENESS_MODIFIERS[normalized];

    if (entries) {
      for (const entry of entries) {
        modifiers.set(entry.type, entry.modifier);
      }
    }

    return modifiers;
  }

  private getTypeEffectiveness(attackType: PokemonType, defenseType: PokemonType): number {
    return TYPE_CHART[attackType][defenseType];
  }

  private calculateDefensiveScore(coverage: DefensiveCoverage): number {
    let totalEffectiveness = 0;
    let penalty = 0;

    for (const atkType of POKEMON_TYPES) {
      const eff = coverage[atkType].effectiveness;
      totalEffectiveness += eff;

      if (eff >= 2) {
        penalty += (eff - 1) * 10;
      }
    }

    const averageEffectiveness = totalEffectiveness / POKEMON_TYPES.length;
    const baseScore = Math.max(0, 100 - (averageEffectiveness - 1) * 50);
    const finalScore = Math.max(0, Math.min(100, Math.round(baseScore - penalty)));

    return finalScore;
  }

  private emptyResult(): DefensiveCoverageResult {
    const coverage: DefensiveCoverage = {};
    for (const atkType of POKEMON_TYPES) {
      coverage[atkType] = {
        effectiveness: 0,
        weakPokemon: [],
        resistantPokemon: [],
      };
    }

    return {
      coverage,
      sharedWeaknesses: [],
      defensiveScore: 0,
    };
  }
}

export const defensiveCoverageService = new DefensiveCoverageService();
