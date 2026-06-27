/**
 * Integration Tests for Team Service
 *
 * Tests business logic with mocked repository.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TeamService } from '@/server/services/team.service';
import { ValidationError, NotFoundError, UnauthorizedError } from '@/lib/errors';

const { mockRepository } = vi.hoisted(() => ({
  mockRepository: {
    findById: vi.fn(),
    findByUserId: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findPublicTeams: vi.fn(),
  },
}));

vi.mock('@/server/repositories/team.repository', () => ({
  teamRepository: mockRepository,
}));

const mockTeam = {
  id: 'team-1',
  name: 'Test Team',
  description: null,
  format: 'champions-doubles',
  isPublic: false,
  userId: 'user-1',
  members: [],
  user: { id: 'user-1', username: 'test', displayName: 'Test', image: null },
};

function makeValidStatPoints() {
  return { hp: 10, atk: 10, def: 10, spAtk: 10, spDef: 10, spd: 16 };
}

function makeValidMember(position: number) {
  return {
    pokemonId: 25 + position,
    abilityName: 'static',
    nature: 'jolly',
    statPoints: makeValidStatPoints(),
    moves: ['thunderbolt'],
    isMega: false,
    position,
  };
}

function makeValidCreateInput() {
  return {
    name: 'Test Team',
    format: 'champions-doubles',
    isPublic: false,
    members: Array.from({ length: 6 }, (_, i) => makeValidMember(i)),
  };
}

describe('TeamService', () => {
  let service: TeamService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new TeamService();
  });

  describe('createTeam', () => {
    it('should create team with valid data', async () => {
      mockRepository.create.mockResolvedValue(mockTeam);

      const result = await service.createTeam('user-1', makeValidCreateInput());

      expect(result).toEqual(mockTeam);
      expect(mockRepository.create).toHaveBeenCalledWith(expect.any(Object), 'user-1');
    });

    it('should throw ValidationError for invalid data', async () => {
      await expect(service.createTeam('user-1', { name: '' })).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when members count is wrong', async () => {
      const input = makeValidCreateInput();
      input.members = input.members.slice(0, 3);

      await expect(service.createTeam('user-1', input)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid SP total', async () => {
      const input = makeValidCreateInput();
      input.members[0].statPoints = { hp: 0, atk: 0, def: 0, spAtk: 0, spDef: 0, spd: 50 };

      await expect(service.createTeam('user-1', input)).rejects.toThrow(ValidationError);
    });
  });

  describe('updateTeam', () => {
    it('should update team when user is owner', async () => {
      mockRepository.findById.mockResolvedValue(mockTeam);
      mockRepository.update.mockResolvedValue({ ...mockTeam, name: 'Updated' });

      const result = await service.updateTeam('user-1', 'team-1', { name: 'Updated' });

      expect(result.name).toBe('Updated');
    });

    it('should throw NotFoundError for non-existent team', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(
        service.updateTeam('user-1', 'non-existent', { name: 'Updated' })
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw UnauthorizedError when user is not owner', async () => {
      mockRepository.findById.mockResolvedValue({ ...mockTeam, userId: 'other-user' });

      await expect(service.updateTeam('user-1', 'team-1', { name: 'Updated' })).rejects.toThrow(
        UnauthorizedError
      );
    });

    it('should throw ValidationError for invalid update data', async () => {
      mockRepository.findById.mockResolvedValue(mockTeam);

      await expect(service.updateTeam('user-1', 'team-1', { name: '' })).rejects.toThrow(
        ValidationError
      );
    });
  });

  describe('deleteTeam', () => {
    it('should delete team when user is owner', async () => {
      mockRepository.findById.mockResolvedValue(mockTeam);
      mockRepository.delete.mockResolvedValue(true);

      const result = await service.deleteTeam('user-1', 'team-1');
      expect(result).toBe(true);
    });

    it('should throw NotFoundError for non-existent team', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.deleteTeam('user-1', 'non-existent')).rejects.toThrow(NotFoundError);
    });

    it('should throw UnauthorizedError when user is not owner', async () => {
      mockRepository.findById.mockResolvedValue({ ...mockTeam, userId: 'other-user' });

      await expect(service.deleteTeam('user-1', 'team-1')).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('getTeam', () => {
    it('should return team when found', async () => {
      mockRepository.findById.mockResolvedValue(mockTeam);

      const result = await service.getTeam('team-1');
      expect(result).toEqual(mockTeam);
    });

    it('should throw NotFoundError when team not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.getTeam('non-existent')).rejects.toThrow(NotFoundError);
    });
  });

  describe('getUserTeams', () => {
    it('should return all teams for user', async () => {
      mockRepository.findByUserId.mockResolvedValue([mockTeam]);

      const result = await service.getUserTeams('user-1');
      expect(result).toEqual([mockTeam]);
    });
  });

  describe('getPublicTeams', () => {
    it('should return paginated public teams', async () => {
      const paginatedResult = {
        teams: [mockTeam],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };
      mockRepository.findPublicTeams.mockResolvedValue(paginatedResult);

      const result = await service.getPublicTeams({
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      expect(result).toEqual(paginatedResult);
    });

    it('should throw ValidationError for invalid pagination', async () => {
      await expect(service.getPublicTeams({ page: 0, limit: 100 })).rejects.toThrow(
        ValidationError
      );
    });
  });
});
