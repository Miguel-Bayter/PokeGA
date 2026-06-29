import type { TeamPokemonData, SpeedAnalysisResult, SpeedTier } from './types';

const SPEED_BOOST_NATURES = new Set(['timid', 'hasty', 'jolly', 'naive']);
const SPEED_REDUCE_NATURES = new Set([
  'bold',
  'relaxed',
  'brave',
  'calm',
  'careful',
  'sassy',
  'lax',
  'gentle',
]);

const LEVEL = 50;
const IV = 31;

/**
 * Calculates speed tiers at Level 50 with SP allocation.
 *
 * Formula: floor((floor((2 * Base + IV + floor(SP/4)) * Level / 100) + 5) * NatureMultiplier)
 *
 * - Level = 50 (fixed for Champions format)
 * - IV = 31 (perfect IVs assumed)
 * - SP = allocated speed points (0-32)
 * - NatureMultiplier = 1.1 (boosting), 0.9 (reducing), or 1.0 (neutral)
 */
export class SpeedTierService {
  /**
   * Analyze speed tiers for a team.
   *
   * @param team - Array of Pokemon with base stats, SP, and nature
   * @returns Speed analysis with tiers, gaps, and scoring
   */
  analyze(team: TeamPokemonData[]): SpeedAnalysisResult {
    if (team.length === 0) {
      return this.emptyResult();
    }

    const tiers: SpeedTier[] = team.map((pokemon) => {
      const finalSpeed = this.calculateSpeed(
        pokemon.baseStats.spd,
        pokemon.statPoints.spd,
        pokemon.nature
      );

      return {
        pokemonName: pokemon.name,
        baseSpeed: pokemon.baseStats.spd,
        allocatedSP: pokemon.statPoints.spd,
        nature: pokemon.nature,
        finalSpeed,
        rank: 0,
      };
    });

    tiers.sort((a, b) => b.finalSpeed - a.finalSpeed);

    for (let i = 0; i < tiers.length; i++) {
      tiers[i].rank = i + 1;
    }

    const fastest = tiers[0];
    const slowest = tiers[tiers.length - 1];
    const averageSpeed = Math.round(tiers.reduce((sum, t) => sum + t.finalSpeed, 0) / tiers.length);

    const speedGaps: number[] = [];
    for (let i = 0; i < tiers.length - 1; i++) {
      speedGaps.push(tiers[i].finalSpeed - tiers[i + 1].finalSpeed);
    }

    const speedScore = this.calculateSpeedScore(tiers, speedGaps);

    return {
      tiers,
      fastest,
      slowest,
      averageSpeed,
      speedGaps,
      speedScore,
    };
  }

  /**
   * Calculate the final speed stat for a single Pokemon.
   *
   * @param baseSpeed - Base speed stat
   * @param sp - Allocated speed SP (0-32)
   * @param nature - Nature name
   * @returns Final speed stat at level 50
   */
  calculateSpeed(baseSpeed: number, sp: number, nature: string): number {
    const natureMultiplier = this.getNatureMultiplier(nature);
    const spContribution = Math.floor(sp / 4);
    const innerValue = 2 * baseSpeed + IV + spContribution;
    const levelAdjusted = Math.floor((innerValue * LEVEL) / 100);
    const withBase = levelAdjusted + 5;
    const finalSpeed = Math.floor(withBase * natureMultiplier);

    return finalSpeed;
  }

  /**
   * Get the nature multiplier for speed.
   *
   * @param nature - Nature name
   * @returns 1.1 for speed-boosting, 0.9 for speed-reducing, 1.0 for neutral
   */
  getNatureMultiplier(nature: string): number {
    const normalized = nature.toLowerCase();
    if (SPEED_BOOST_NATURES.has(normalized)) return 1.1;
    if (SPEED_REDUCE_NATURES.has(normalized)) return 0.9;
    return 1.0;
  }

  private calculateSpeedScore(tiers: SpeedTier[], gaps: number[]): number {
    if (tiers.length === 0) return 0;

    const maxSpeed = tiers[0].finalSpeed;
    const minSpeed = tiers[tiers.length - 1].finalSpeed;

    if (maxSpeed === 0) return 0;

    const spreadRatio = (maxSpeed - minSpeed) / maxSpeed;
    const spreadScore = Math.max(0, 50 - spreadRatio * 50);

    const avgGap = gaps.length > 0 ? gaps.reduce((s, g) => s + g, 0) / gaps.length : 0;
    const gapScore = Math.max(0, 50 - avgGap * 2);

    return Math.max(0, Math.min(100, Math.round(spreadScore + gapScore)));
  }

  private emptyResult(): SpeedAnalysisResult {
    return {
      tiers: [],
      fastest: {
        pokemonName: '',
        baseSpeed: 0,
        allocatedSP: 0,
        nature: '',
        finalSpeed: 0,
        rank: 0,
      },
      slowest: {
        pokemonName: '',
        baseSpeed: 0,
        allocatedSP: 0,
        nature: '',
        finalSpeed: 0,
        rank: 0,
      },
      averageSpeed: 0,
      speedGaps: [],
      speedScore: 0,
    };
  }
}

export const speedTierService = new SpeedTierService();
