import { prisma } from '@/lib/prisma';
import type {
  CreateTeamInputData,
  UpdateTeamInputData,
  PaginationInput,
} from '@/server/validators/team.validator';

/**
 * Repository for Team CRUD operations.
 * All multi-step writes use Prisma transactions.
 */
export class TeamRepository {
  /**
   * Find a team by ID with full relations (members, pokemon, item).
   */
  async findById(id: string) {
    return prisma.team.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            pokemon: true,
            item: true,
          },
          orderBy: { position: 'asc' },
        },
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            image: true,
          },
        },
      },
    });
  }

  /**
   * Find all teams belonging to a user.
   */
  async findByUserId(userId: string) {
    return prisma.team.findMany({
      where: { userId },
      include: {
        members: {
          include: {
            pokemon: true,
            item: true,
          },
          orderBy: { position: 'asc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Create a team with all 6 members inside a transaction.
   */
  async create(data: CreateTeamInputData, userId: string) {
    const { members, ...teamData } = data;

    return prisma.$transaction(async (tx) => {
      const team = await tx.team.create({
        data: {
          name: teamData.name,
          description: teamData.description ?? null,
          format: teamData.format,
          isPublic: teamData.isPublic,
          userId,
        },
      });

      await tx.teamMember.createMany({
        data: members.map((member) => ({
          teamId: team.id,
          pokemonId: member.pokemonId,
          itemId: member.itemId ?? null,
          abilityName: member.abilityName,
          nature: member.nature.toLowerCase(),
          statPoints: JSON.stringify(member.statPoints),
          moves: JSON.stringify(member.moves),
          isMega: member.isMega,
          teraType: member.teraType ?? null,
          position: member.position,
        })),
      });

      return this.findById(team.id);
    });
  }

  /**
   * Update a team and optionally replace its members.
   * Returns null if team not found.
   */
  async update(id: string, data: UpdateTeamInputData, userId: string) {
    const existing = await prisma.team.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) return null;

    const { members, ...teamFields } = data;

    return prisma.$transaction(async (tx) => {
      if (Object.keys(teamFields).length > 0) {
        await tx.team.update({
          where: { id },
          data: {
            ...(teamFields.name !== undefined && { name: teamFields.name }),
            ...(teamFields.description !== undefined && {
              description: teamFields.description ?? null,
            }),
            ...(teamFields.format !== undefined && { format: teamFields.format }),
            ...(teamFields.isPublic !== undefined && { isPublic: teamFields.isPublic }),
          },
        });
      }

      if (members) {
        await tx.teamMember.deleteMany({ where: { teamId: id } });

        await tx.teamMember.createMany({
          data: members.map((member) => ({
            teamId: id,
            pokemonId: member.pokemonId,
            itemId: member.itemId ?? null,
            abilityName: member.abilityName,
            nature: member.nature.toLowerCase(),
            statPoints: JSON.stringify(member.statPoints),
            moves: JSON.stringify(member.moves),
            isMega: member.isMega,
            teraType: member.teraType ?? null,
            position: member.position,
          })),
        });
      }

      return this.findById(id);
    });
  }

  /**
   * Delete a team. Returns true if deleted, false if not found or not owned.
   */
  async delete(id: string, userId: string): Promise<boolean> {
    const existing = await prisma.team.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) return false;

    await prisma.team.delete({ where: { id } });
    return true;
  }

  /**
   * Paginated list of public teams.
   */
  async findPublicTeams(options: PaginationInput) {
    const { page, limit, sortBy, sortOrder } = options;
    const skip = (page - 1) * limit;

    const [teams, total] = await prisma.$transaction([
      prisma.team.findMany({
        where: { isPublic: true },
        include: {
          members: {
            include: {
              pokemon: true,
              item: true,
            },
            orderBy: { position: 'asc' },
          },
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              image: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.team.count({ where: { isPublic: true } }),
    ]);

    return {
      teams,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}

export const teamRepository = new TeamRepository();
