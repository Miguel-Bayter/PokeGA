'use server';

import { revalidatePath } from 'next/cache';
import { teamService } from '@/server/services/team.service';
import { ValidationError, NotFoundError, UnauthorizedError } from '@/lib/errors';

interface ActionResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Create a new team.
 */
export async function createTeamAction(data: unknown): Promise<ActionResponse<unknown>> {
  try {
    const team = await teamService.createTeam('placeholder-user-id', data);
    revalidatePath('/teams');
    return { success: true, data: team };
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Update an existing team.
 */
export async function updateTeamAction(
  teamId: string,
  data: unknown
): Promise<ActionResponse<unknown>> {
  try {
    const team = await teamService.updateTeam('placeholder-user-id', teamId, data);
    revalidatePath('/teams');
    revalidatePath(`/teams/${teamId}`);
    return { success: true, data: team };
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Delete a team.
 */
export async function deleteTeamAction(
  teamId: string
): Promise<ActionResponse<{ deleted: boolean }>> {
  try {
    const deleted = await teamService.deleteTeam('placeholder-user-id', teamId);
    revalidatePath('/teams');
    return { success: true, data: { deleted } };
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Get a single team by ID.
 */
export async function getTeamAction(teamId: string): Promise<ActionResponse<unknown>> {
  try {
    const team = await teamService.getTeam(teamId);
    return { success: true, data: team };
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Get all teams for the current user.
 * TODO: Replace placeholder user ID with real auth context.
 */
export async function getUserTeamsAction(): Promise<ActionResponse<unknown>> {
  try {
    const teams = await teamService.getUserTeams('placeholder-user-id');
    return { success: true, data: teams };
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Get paginated public teams.
 */
export async function getPublicTeamsAction(options: unknown): Promise<ActionResponse<unknown>> {
  try {
    const result = await teamService.getPublicTeams(options);
    return { success: true, data: result };
  } catch (error) {
    return handleError(error);
  }
}

function handleError(error: unknown): ActionResponse<never> {
  if (error instanceof ValidationError) {
    return { success: false, error: error.message };
  }
  if (error instanceof NotFoundError) {
    return { success: false, error: error.message };
  }
  if (error instanceof UnauthorizedError) {
    return { success: false, error: error.message };
  }
  return { success: false, error: 'An unexpected error occurred' };
}
