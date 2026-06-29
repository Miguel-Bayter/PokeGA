import type { TeamPokemonData, BalanceAnalysis } from './types';

/**
 * Analyzes team's physical/special offensive balance.
 *
 * Algorithm:
 * 1. Count physical, special, and status moves across the team
 * 2. Calculate ratio (ideal: 50/50 or 60/40 split)
 * 3. Consider each Pokemon's higher attacking stat (Attack vs Special Attack)
 * 4. Score based on how close to optimal balance
 */
export class BalanceAnalyzerService {
  /**
   * Analyze the physical/special balance of a team.
   *
   * @param team - Array of Pokemon with their moves and base stats
   * @returns Balance analysis with percentages and recommendations
   */
  analyze(team: TeamPokemonData[]): BalanceAnalysis {
    if (team.length === 0) {
      return this.emptyResult();
    }

    let physicalMoves = 0;
    let specialMoves = 0;
    let statusMoves = 0;

    for (const pokemon of team) {
      for (const move of pokemon.moves) {
        switch (move.category) {
          case 'physical':
            physicalMoves++;
            break;
          case 'special':
            specialMoves++;
            break;
          case 'status':
            statusMoves++;
            break;
        }
      }
    }

    const totalAttackingMoves = physicalMoves + specialMoves;
    const physicalPercentage =
      totalAttackingMoves > 0 ? Math.round((physicalMoves / totalAttackingMoves) * 100) : 0;
    const specialPercentage =
      totalAttackingMoves > 0 ? Math.round((specialMoves / totalAttackingMoves) * 100) : 0;

    const balanceScore = this.calculateBalanceScore(physicalPercentage, specialPercentage, team);

    const recommendation = this.generateRecommendation(
      physicalPercentage,
      specialPercentage,
      balanceScore,
      team
    );

    return {
      physicalMoves,
      specialMoves,
      statusMoves,
      physicalPercentage,
      specialPercentage,
      balanceScore,
      recommendation,
    };
  }

  private calculateBalanceScore(
    physicalPercentage: number,
    specialPercentage: number,
    team: TeamPokemonData[]
  ): number {
    if (physicalPercentage === 0 && specialPercentage === 0) return 0;

    const ratioDiff = Math.abs(physicalPercentage - specialPercentage);

    const statAlignment = this.checkStatAlignment(team);

    let baseScore = Math.max(0, 100 - ratioDiff);

    if (statAlignment > 0.7 && ratioDiff > 30) {
      baseScore = Math.min(100, baseScore + 15);
    }

    return Math.max(0, Math.min(100, Math.round(baseScore)));
  }

  private checkStatAlignment(team: TeamPokemonData[]): number {
    if (team.length === 0) return 0;

    let physicalOriented = 0;
    let specialOriented = 0;

    for (const pokemon of team) {
      if (pokemon.baseStats.atk > pokemon.baseStats.spAtk) {
        physicalOriented++;
      } else if (pokemon.baseStats.spAtk > pokemon.baseStats.atk) {
        specialOriented++;
      }
    }

    return Math.max(physicalOriented, specialOriented) / team.length;
  }

  private generateRecommendation(
    physicalPercentage: number,
    specialPercentage: number,
    balanceScore: number,
    team: TeamPokemonData[]
  ): string {
    if (balanceScore >= 80) {
      return 'Excellent offensive balance. Your team can handle both physical and special walls.';
    }

    if (physicalPercentage > 75) {
      const physicalWallCount = team.filter((p) => p.baseStats.def > p.baseStats.spDef).length;
      return (
        `Team is heavily physically oriented (${physicalPercentage}%). ` +
        `Consider adding special attackers to break through physical walls ` +
        `(${physicalWallCount} Pokemon on the team have higher Defense).`
      );
    }

    if (specialPercentage > 75) {
      const specialWallCount = team.filter((p) => p.baseStats.spDef > p.baseStats.def).length;
      return (
        `Team is heavily specially oriented (${specialPercentage}%). ` +
        `Consider adding physical attackers to break through special walls ` +
        `(${specialWallCount} Pokemon on the team have higher Special Defense).`
      );
    }

    return 'Moderate balance. Consider diversifying your offensive categories for better coverage.';
  }

  private emptyResult(): BalanceAnalysis {
    return {
      physicalMoves: 0,
      specialMoves: 0,
      statusMoves: 0,
      physicalPercentage: 0,
      specialPercentage: 0,
      balanceScore: 0,
      recommendation: 'No moves to analyze. Add Pokemon with moves to get balance data.',
    };
  }
}

export const balanceAnalyzerService = new BalanceAnalyzerService();
