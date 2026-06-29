'use server';

import { analysisService } from '@/server/services/analysis/analysis.service';
import { offensiveCoverageService } from '@/server/services/analysis/offensive-coverage.service';
import { defensiveCoverageService } from '@/server/services/analysis/defensive-coverage.service';
import { teamRepository } from '@/server/repositories/team.repository';
import type { PokemonType } from '@/lib/type-chart';
import type {
  AnalysisReport,
  OffensiveCoverageResult,
  DefensiveCoverageResult,
  TeamPokemonData,
  MoveData,
} from '@/server/services/analysis/types';

interface ActionResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Get a full analysis report for a team.
 *
 * @param teamId - The team ID to analyze
 * @returns Full analysis report with all metrics
 */
export async function analyzeTeamAction(teamId: string): Promise<ActionResponse<AnalysisReport>> {
  try {
    const report = await analysisService.analyzeTeam(teamId);
    return { success: true, data: report };
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Get offensive coverage analysis for a team.
 *
 * @param teamId - The team ID to analyze
 * @returns Offensive coverage result with coverage matrix
 */
export async function getOffensiveCoverageAction(
  teamId: string
): Promise<ActionResponse<OffensiveCoverageResult>> {
  try {
    const team = await teamRepository.findById(teamId);
    if (!team) {
      return { success: false, error: 'Team not found' };
    }

    const pokemonData = mapTeamMembers(team.members);
    const result = offensiveCoverageService.calculate(pokemonData);
    return { success: true, data: result };
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Get defensive coverage analysis for a team.
 *
 * @param teamId - The team ID to analyze
 * @returns Defensive coverage result with type matchups
 */
export async function getDefensiveCoverageAction(
  teamId: string
): Promise<ActionResponse<DefensiveCoverageResult>> {
  try {
    const team = await teamRepository.findById(teamId);
    if (!team) {
      return { success: false, error: 'Team not found' };
    }

    const pokemonData = mapTeamMembers(team.members);
    const result = defensiveCoverageService.calculate(pokemonData);
    return { success: true, data: result };
  } catch (error) {
    return handleError(error);
  }
}

function mapTeamMembers(
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
  }>
): TeamPokemonData[] {
  return members.map((member) => {
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

    return {
      name: member.pokemon.name,
      types,
      baseStats,
      abilityName: member.abilityName,
      nature: member.nature,
      statPoints,
      moves,
      isMega: member.isMega,
      teraType: member.teraType as PokemonType | null,
    };
  });
}

function handleError(error: unknown): ActionResponse<never> {
  if (error instanceof Error) {
    return { success: false, error: error.message };
  }
  return { success: false, error: 'An unexpected error occurred' };
}
