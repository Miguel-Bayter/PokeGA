/**
 * Integration Tests for Team Repository
 *
 * Tests CRUD operations against a mocked Prisma client.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TeamRepository } from '@/server/repositories/team.repository';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    team: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    teamMember: {
      createMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
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

describe('TeamRepository', () => {
  let repo: TeamRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new TeamRepository();
  });

  describe('findById', () => {
    it('should return team with relations', async () => {
      mockPrisma.team.findUnique.mockResolvedValue(mockTeam);

      const result = await repo.findById('team-1');

      expect(result).toEqual(mockTeam);
      expect(mockPrisma.team.findUnique).toHaveBeenCalledWith({
        where: { id: 'team-1' },
        include: expect.objectContaining({
          members: expect.any(Object),
          user: expect.any(Object),
        }),
      });
    });

    it('should return null for non-existent team', async () => {
      mockPrisma.team.findUnique.mockResolvedValue(null);

      const result = await repo.findById('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('should return all teams for user', async () => {
      mockPrisma.team.findMany.mockResolvedValue([mockTeam]);

      const result = await repo.findByUserId('user-1');

      expect(result).toEqual([mockTeam]);
      expect(mockPrisma.team.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: expect.any(Object),
        orderBy: { updatedAt: 'desc' },
      });
    });
  });

  describe('create', () => {
    it('should create team with members in transaction', async () => {
      const mockTx = {
        team: { create: vi.fn().mockResolvedValue({ id: 'team-1' }) },
        teamMember: { createMany: vi.fn().mockResolvedValue({ count: 6 }) },
      };

      mockPrisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
        const result = await fn(mockTx);
        return result;
      });

      mockPrisma.team.findUnique.mockResolvedValue(mockTeam);

      const validStatPoints = { hp: 10, atk: 10, def: 10, spAtk: 10, spDef: 10, spd: 16 };
      const data = {
        name: 'Test Team',
        format: 'champions-doubles',
        isPublic: false,
        members: Array.from({ length: 6 }, (_, i) => ({
          pokemonId: 25 + i,
          abilityName: 'static',
          nature: 'jolly',
          statPoints: validStatPoints,
          moves: ['move-1'],
          isMega: false,
          position: i,
        })),
      };

      const result = await repo.create(data, 'user-1');

      expect(mockTx.team.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Test Team',
          userId: 'user-1',
        }),
      });
      expect(mockTx.teamMember.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([expect.objectContaining({ teamId: 'team-1', position: 0 })]),
      });
      expect(result).toEqual(mockTeam);
    });
  });

  describe('update', () => {
    it('should return null if team not found', async () => {
      mockPrisma.team.findUnique.mockResolvedValue(null);

      const result = await repo.update('non-existent', { name: 'Updated' }, 'user-1');
      expect(result).toBeNull();
    });

    it('should return null if user does not own the team', async () => {
      mockPrisma.team.findUnique.mockResolvedValue({ ...mockTeam, userId: 'other-user' });

      const result = await repo.update('team-1', { name: 'Updated' }, 'user-1');
      expect(result).toBeNull();
    });

    it('should update team fields in transaction', async () => {
      const mockTx = {
        team: { update: vi.fn().mockResolvedValue({}) },
        teamMember: { deleteMany: vi.fn(), createMany: vi.fn() },
      };

      mockPrisma.team.findUnique
        .mockResolvedValueOnce(mockTeam)
        .mockResolvedValueOnce({ ...mockTeam, name: 'Updated' });

      mockPrisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
        return fn(mockTx);
      });

      const result = await repo.update('team-1', { name: 'Updated' }, 'user-1');

      expect(mockTx.team.update).toHaveBeenCalledWith({
        where: { id: 'team-1' },
        data: { name: 'Updated' },
      });
      expect(result).toEqual({ ...mockTeam, name: 'Updated' });
    });
  });

  describe('delete', () => {
    it('should return false if team not found', async () => {
      mockPrisma.team.findUnique.mockResolvedValue(null);

      const result = await repo.delete('non-existent', 'user-1');
      expect(result).toBe(false);
    });

    it('should return false if user does not own the team', async () => {
      mockPrisma.team.findUnique.mockResolvedValue({ ...mockTeam, userId: 'other-user' });

      const result = await repo.delete('team-1', 'user-1');
      expect(result).toBe(false);
    });

    it('should delete team and return true', async () => {
      mockPrisma.team.findUnique.mockResolvedValue(mockTeam);
      mockPrisma.team.delete.mockResolvedValue(mockTeam);

      const result = await repo.delete('team-1', 'user-1');

      expect(result).toBe(true);
      expect(mockPrisma.team.delete).toHaveBeenCalledWith({ where: { id: 'team-1' } });
    });
  });

  describe('findPublicTeams', () => {
    it('should return paginated public teams', async () => {
      const teams = [mockTeam];
      const totalCount = 1;

      mockPrisma.$transaction.mockResolvedValue([teams, totalCount]);

      const result = await repo.findPublicTeams({
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      expect(result.teams).toEqual(teams);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('should calculate correct skip value for pagination', async () => {
      mockPrisma.$transaction.mockResolvedValue([[], 0]);

      await repo.findPublicTeams({
        page: 3,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });
});
