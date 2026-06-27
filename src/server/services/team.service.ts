import { teamRepository } from '@/server/repositories/team.repository';
import {
  CreateTeamInput,
  UpdateTeamInput,
  PaginationSchema,
  type CreateTeamInputData,
  type UpdateTeamInputData,
  type PaginationInput,
} from '@/server/validators/team.validator';
import { ValidationError, NotFoundError, UnauthorizedError } from '@/lib/errors';
import type { ZodError } from 'zod';

function formatZodError(error: ZodError): string {
  return error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
}

/**
 * Service layer for team business logic.
 * Handles validation, authorization, and delegates persistence to the repository.
 */
export class TeamService {
  /**
   * Create a new team with 6 members.
   */
  async createTeam(userId: string, rawData: unknown) {
    const parsed = CreateTeamInput.safeParse(rawData);
    if (!parsed.success) {
      throw new ValidationError(formatZodError(parsed.error));
    }

    return teamRepository.create(parsed.data as CreateTeamInputData, userId);
  }

  /**
   * Update an existing team. Verifies ownership.
   */
  async updateTeam(userId: string, teamId: string, rawData: unknown) {
    const parsed = UpdateTeamInput.safeParse(rawData);
    if (!parsed.success) {
      throw new ValidationError(formatZodError(parsed.error));
    }

    const existing = await teamRepository.findById(teamId);
    if (!existing) {
      throw new NotFoundError('Team', teamId);
    }
    if (existing.userId !== userId) {
      throw new UnauthorizedError('You do not own this team');
    }

    const result = await teamRepository.update(teamId, parsed.data as UpdateTeamInputData, userId);
    if (!result) {
      throw new NotFoundError('Team', teamId);
    }
    return result;
  }

  /**
   * Delete a team. Verifies ownership.
   */
  async deleteTeam(userId: string, teamId: string) {
    const existing = await teamRepository.findById(teamId);
    if (!existing) {
      throw new NotFoundError('Team', teamId);
    }
    if (existing.userId !== userId) {
      throw new UnauthorizedError('You do not own this team');
    }

    return teamRepository.delete(teamId, userId);
  }

  /**
   * Get a single team by ID with full relations.
   */
  async getTeam(teamId: string) {
    const team = await teamRepository.findById(teamId);
    if (!team) {
      throw new NotFoundError('Team', teamId);
    }
    return team;
  }

  /**
   * Get all teams for a user.
   */
  async getUserTeams(userId: string) {
    return teamRepository.findByUserId(userId);
  }

  /**
   * Get paginated public teams.
   */
  async getPublicTeams(rawOptions: unknown) {
    const parsed = PaginationSchema.safeParse(rawOptions);
    if (!parsed.success) {
      throw new ValidationError(formatZodError(parsed.error));
    }

    return teamRepository.findPublicTeams(parsed.data as PaginationInput);
  }
}

export const teamService = new TeamService();
