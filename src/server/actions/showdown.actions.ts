'use server';

import { teamService } from '@/server/services/team.service';
import { exportTeamToText } from '@/server/services/showdown-export.service';
import { importTeamFromText, type ParsedPokemon } from '@/server/services/showdown-import.service';
import { ValidationError } from '@/lib/errors';

interface ActionResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Export a team to Pokemon Showdown text format.
 */
export async function exportTeamToTextAction(teamId: string): Promise<ActionResponse<string>> {
  try {
    if (!teamId || typeof teamId !== 'string') {
      throw new ValidationError('Team ID is required');
    }

    const team = await teamService.getTeam(teamId);

    if (!team) {
      throw new ValidationError('Team not found');
    }

    const membersForExport = team.members.map((member) => {
      const statPoints =
        typeof member.statPoints === 'string'
          ? (JSON.parse(member.statPoints) as Record<string, number>)
          : member.statPoints;

      const moves =
        typeof member.moves === 'string' ? (JSON.parse(member.moves) as string[]) : member.moves;

      return {
        species: member.pokemon.name,
        item: member.item?.name ?? null,
        ability: member.abilityName,
        teraType: member.teraType ?? null,
        level: 50,
        isMega: member.isMega,
        statPoints: {
          hp: statPoints.hp,
          atk: statPoints.atk,
          def: statPoints.def,
          spAtk: statPoints.spAtk,
          spDef: statPoints.spDef,
          spd: statPoints.spd,
        },
        nature: member.nature,
        moves,
      };
    });

    const text = exportTeamToText({
      name: team.name,
      members: membersForExport,
    });

    return { success: true, data: text };
  } catch (error) {
    if (error instanceof ValidationError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to export team' };
  }
}

/**
 * Import a team from Pokemon Showdown text format.
 */
export async function importTeamFromTextAction(
  text: string
): Promise<ActionResponse<ParsedPokemon[]>> {
  try {
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      throw new ValidationError('Import text is required');
    }

    const result = importTeamFromText(text);

    if (!result.success) {
      const errorMessages = result.errors.map((e) => `Block ${e.block}: ${e.message}`).join('; ');
      return { success: false, error: `Import errors: ${errorMessages}` };
    }

    return { success: true, data: result.pokemon };
  } catch (error) {
    if (error instanceof ValidationError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to import team' };
  }
}
