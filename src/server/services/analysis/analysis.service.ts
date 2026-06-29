import { teamRepository } from '@/server/repositories/team.repository';
import { offensiveCoverageService } from './offensive-coverage.service';
import { defensiveCoverageService } from './defensive-coverage.service';
import { weaknessDetectionService } from './weakness-detection.service';
import { speedTierService } from './speed-tier.service';
import { balanceAnalyzerService } from './balance-analyzer.service';
import { synergyDetectorService } from './synergy-detector.service';
import type { PokemonType } from '@/lib/type-chart';
import type { TeamPokemonData, MoveData, AnalysisReport } from './types';

/**
 * Orchestrates all analysis services to produce a comprehensive team report.
 *
 * Combines offensive coverage, defensive coverage, weakness detection,
 * speed tier analysis, physical/special balance, and type synergy detection
 * into a single unified report with overall scoring and recommendations.
 */
export class AnalysisService {
  /**
   * Run full analysis on a team by ID.
   *
   * @param teamId - The team ID to analyze
   * @returns Comprehensive analysis report
   * @throws {NotFoundError} If team not found
   */
  async analyzeTeam(teamId: string): Promise<AnalysisReport> {
    const team = await teamRepository.findById(teamId);
    if (!team) {
      throw new Error(`Team with id ${teamId} not found`);
    }

    const pokemonData = await this.mapTeamToPokemonData(team);
    return this.analyzeTeamData(team.id, team.name, pokemonData);
  }

  /**
   * Run full analysis on pre-mapped team data.
   *
   * @param teamId - Team identifier
   * @param teamName - Team display name
   * @param team - Array of Pokemon data
   * @returns Comprehensive analysis report
   */
  analyzeTeamData(teamId: string, teamName: string, team: TeamPokemonData[]): AnalysisReport {
    const offensiveCoverage = offensiveCoverageService.calculate(team);
    const defensiveCoverage = defensiveCoverageService.calculate(team);
    const weaknessReport = weaknessDetectionService.analyze(defensiveCoverage);
    const speedAnalysis = speedTierService.analyze(team);
    const balanceAnalysis = balanceAnalyzerService.analyze(team);
    const synergyAnalysis = synergyDetectorService.analyze(team);

    const overallScore = this.calculateOverallScore({
      offensiveCoverage: offensiveCoverage.coverageScore,
      defensiveCoverage: defensiveCoverage.defensiveScore,
      speedScore: speedAnalysis.speedScore,
      balanceScore: balanceAnalysis.balanceScore,
      synergyScore: synergyAnalysis.synergyScore,
      criticalWeaknesses: weaknessReport.criticalCount,
    });

    const strengths = this.identifyStrengths({
      offensiveCoverage,
      defensiveCoverage,
      speedAnalysis,
      balanceAnalysis,
      synergyAnalysis,
    });

    const weaknessesList = this.identifyWeaknesses({
      weaknessReport,
      offensiveCoverage,
      defensiveCoverage,
      balanceAnalysis,
    });

    const recommendations = [
      ...weaknessReport.recommendations,
      ...synergyAnalysis.recommendations,
      ...this.generateAdditionalRecommendations({
        speedAnalysis,
        balanceAnalysis,
      }),
    ];

    return {
      teamId,
      teamName,
      offensiveCoverage,
      defensiveCoverage,
      weaknessReport,
      speedAnalysis,
      balanceAnalysis,
      synergyAnalysis,
      overallScore,
      strengths,
      weaknesses: weaknessesList,
      recommendations,
    };
  }

  private async mapTeamToPokemonData(team: {
    members: Array<{
      pokemon: {
        name: string;
        types: string;
        baseStats: string;
      };
      abilityName: string;
      nature: string;
      statPoints: string;
      moves: string;
      isMega: boolean;
      teraType: string | null;
    }>;
  }): Promise<TeamPokemonData[]> {
    const result: TeamPokemonData[] = [];

    for (const member of team.members) {
      const types = member.pokemon.types.split(',') as PokemonType[];
      const baseStats = JSON.parse(member.pokemon.baseStats) as TeamPokemonData['baseStats'];
      const statPoints = JSON.parse(member.statPoints) as TeamPokemonData['statPoints'];
      const moveNames = JSON.parse(member.moves) as string[];

      const moves: MoveData[] = moveNames.map((name) => ({
        name,
        type: types[0],
        category: 'physical' as const,
        power: null,
      }));

      result.push({
        name: member.pokemon.name,
        types,
        baseStats,
        abilityName: member.abilityName,
        nature: member.nature,
        statPoints,
        moves,
        isMega: member.isMega,
        teraType: member.teraType as PokemonType | null,
      });
    }

    return result;
  }

  private calculateOverallScore(scores: {
    offensiveCoverage: number;
    defensiveCoverage: number;
    speedScore: number;
    balanceScore: number;
    synergyScore: number;
    criticalWeaknesses: number;
  }): number {
    const weights = {
      offensiveCoverage: 0.2,
      defensiveCoverage: 0.25,
      speedScore: 0.1,
      balanceScore: 0.15,
      synergyScore: 0.3,
    };

    let score =
      scores.offensiveCoverage * weights.offensiveCoverage +
      scores.defensiveCoverage * weights.defensiveCoverage +
      scores.speedScore * weights.speedScore +
      scores.balanceScore * weights.balanceScore +
      scores.synergyScore * weights.synergyScore;

    score -= scores.criticalWeaknesses * 10;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private identifyStrengths(results: {
    offensiveCoverage: { coverageScore: number };
    defensiveCoverage: { defensiveScore: number };
    speedAnalysis: { averageSpeed: number; speedScore: number };
    balanceAnalysis: { balanceScore: number };
    synergyAnalysis: { synergyScore: number; cores: Array<{ name: string }> };
  }): string[] {
    const strengths: string[] = [];

    if (results.offensiveCoverage.coverageScore >= 80) {
      strengths.push('Excellent offensive coverage across all types.');
    }
    if (results.defensiveCoverage.defensiveScore >= 70) {
      strengths.push('Strong defensive profile with good resistances.');
    }
    if (results.speedAnalysis.speedScore >= 70) {
      strengths.push('Well-distributed speed tiers across the team.');
    }
    if (results.balanceAnalysis.balanceScore >= 70) {
      strengths.push('Good physical/special offensive balance.');
    }
    if (results.synergyAnalysis.synergyScore >= 60) {
      const coreNames = results.synergyAnalysis.cores.map((c) => c.name).join(', ');
      strengths.push(`Strong type synergy with cores: ${coreNames}.`);
    }

    if (strengths.length === 0) {
      strengths.push('Team has room for improvement in multiple areas.');
    }

    return strengths;
  }

  private identifyWeaknesses(results: {
    weaknessReport: {
      criticalCount: number;
      sharedWeaknesses: Array<{ type: string; severity: string }>;
    };
    offensiveCoverage: { coverageScore: number };
    defensiveCoverage: { defensiveScore: number };
    balanceAnalysis: { balanceScore: number };
  }): string[] {
    const weaknesses: string[] = [];

    if (results.weaknessReport.criticalCount > 0) {
      const criticalTypes = results.weaknessReport.sharedWeaknesses
        .filter((w) => w.severity === 'critical')
        .map((w) => w.type)
        .join(', ');
      weaknesses.push(`Critical shared weaknesses to: ${criticalTypes}.`);
    }

    if (results.offensiveCoverage.coverageScore < 50) {
      weaknesses.push(
        `Limited offensive coverage (${results.offensiveCoverage.coverageScore}%). Many types cannot be hit super effectively.`
      );
    }

    if (results.defensiveCoverage.defensiveScore < 40) {
      weaknesses.push('Poor defensive profile. Team takes too much damage from many types.');
    }

    if (results.balanceAnalysis.balanceScore < 40) {
      weaknesses.push('Heavily unbalanced offense. Vulnerable to the right type of wall.');
    }

    return weaknesses;
  }

  private generateAdditionalRecommendations(results: {
    speedAnalysis: {
      speedScore: number;
      fastest: { finalSpeed: number };
      slowest: { finalSpeed: number };
    };
    balanceAnalysis: { balanceScore: number; recommendation: string };
  }): string[] {
    const recommendations: string[] = [];

    if (results.speedAnalysis.speedScore < 50) {
      recommendations.push(
        `Speed tiers are uneven (fastest: ${results.speedAnalysis.fastest.finalSpeed}, ` +
          `slowest: ${results.speedAnalysis.slowest.finalSpeed}). ` +
          `Consider adjusting SP allocations to create better speed control.`
      );
    }

    if (results.balanceAnalysis.balanceScore < 60) {
      recommendations.push(results.balanceAnalysis.recommendation);
    }

    return recommendations;
  }
}

export const analysisService = new AnalysisService();
