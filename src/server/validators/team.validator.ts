import { z } from 'zod';

const VALID_NATURES = [
  'adamant',
  'bashful',
  'bold',
  'brave',
  'calm',
  'careful',
  'docile',
  'gentle',
  'hardy',
  'hasty',
  'impish',
  'jolly',
  'lax',
  'lonely',
  'mild',
  'modest',
  'naive',
  'naughty',
  'quiet',
  'quirky',
  'rash',
  'relaxed',
  'sassy',
  'serious',
  'timid',
] as const;

export type Nature = (typeof VALID_NATURES)[number];

const StatPointsSchema = z
  .object({
    hp: z.number().int().min(0).max(32),
    atk: z.number().int().min(0).max(32),
    def: z.number().int().min(0).max(32),
    spAtk: z.number().int().min(0).max(32),
    spDef: z.number().int().min(0).max(32),
    spd: z.number().int().min(0).max(32),
  })
  .superRefine((stats, ctx) => {
    const total = stats.hp + stats.atk + stats.def + stats.spAtk + stats.spDef + stats.spd;
    if (total !== 66) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Stat points must total exactly 66, got ${total}`,
        path: [],
      });
    }
  });

export type StatPoints = z.infer<typeof StatPointsSchema>;

export const TeamSchema = z.object({
  name: z
    .string()
    .min(1, 'Team name is required')
    .max(100, 'Team name must be 100 characters or less'),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or less')
    .optional()
    .or(z.literal('')),
  format: z.string().default('champions-doubles'),
  isPublic: z.boolean().default(false),
});

export type TeamFormData = z.infer<typeof TeamSchema>;

export const TeamMemberSchema = z
  .object({
    pokemonId: z.number().int().positive('Pokemon ID must be a positive integer'),
    itemId: z.number().int().positive().optional(),
    abilityName: z.string().min(1, 'Ability name is required'),
    nature: z.string().min(1, 'Nature is required'),
    statPoints: StatPointsSchema,
    moves: z
      .array(z.string().min(1))
      .max(4, 'A Pokemon can have at most 4 moves')
      .superRefine((moves, ctx) => {
        const uniqueMoves = new Set(moves);
        if (uniqueMoves.size !== moves.length) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Duplicate moves are not allowed',
            path: [],
          });
        }
      }),
    isMega: z.boolean().default(false),
    teraType: z.string().optional(),
    position: z.number().int().min(0).max(5, 'Position must be between 0 and 5'),
  })
  .superRefine((member, ctx) => {
    if (!VALID_NATURES.includes(member.nature.toLowerCase() as Nature)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Invalid nature: ${member.nature}. Must be one of: ${[...VALID_NATURES].join(', ')}`,
        path: ['nature'],
      });
    }
  });

export type TeamMemberFormData = z.infer<typeof TeamMemberSchema>;

export const CreateTeamInput = z.object({
  ...TeamSchema.shape,
  members: z
    .array(TeamMemberSchema)
    .length(6, 'A team must have exactly 6 members')
    .superRefine((members, ctx) => {
      const positions = members.map((m) => m.position);
      const uniquePositions = new Set(positions);
      if (uniquePositions.size !== positions.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Each team member must have a unique position (0-5)',
          path: [],
        });
      }
    }),
});

export type CreateTeamInputData = z.infer<typeof CreateTeamInput>;

export const UpdateTeamInput = z.object({
  name: z
    .string()
    .min(1, 'Team name is required')
    .max(100, 'Team name must be 100 characters or less')
    .optional(),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or less')
    .optional()
    .or(z.literal('')),
  format: z.string().optional(),
  isPublic: z.boolean().optional(),
  members: z
    .array(TeamMemberSchema)
    .length(6, 'A team must have exactly 6 members')
    .superRefine((members, ctx) => {
      const positions = members.map((m) => m.position);
      const uniquePositions = new Set(positions);
      if (uniquePositions.size !== positions.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Each team member must have a unique position (0-5)',
          path: [],
        });
      }
    })
    .optional(),
});

export type UpdateTeamInputData = z.infer<typeof UpdateTeamInput>;

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  sortBy: z.enum(['createdAt', 'score', 'name']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationInput = z.infer<typeof PaginationSchema>;
