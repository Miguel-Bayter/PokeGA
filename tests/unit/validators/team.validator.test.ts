/**
 * Unit Tests for Team Validators
 *
 * Tests Zod schemas for team creation/update validation.
 * Covers SP allocation, nature validation, moves, and position constraints.
 */

import { describe, it, expect } from 'vitest';
import {
  TeamSchema,
  TeamMemberSchema,
  CreateTeamInput,
  UpdateTeamInput,
  PaginationSchema,
} from '@/server/validators/team.validator';

function makeValidStatPoints(overrides: Record<string, number> = {}) {
  return { hp: 10, atk: 10, def: 10, spAtk: 10, spDef: 10, spd: 16, ...overrides };
}

function makeValidMember(overrides: Record<string, unknown> = {}) {
  return {
    pokemonId: 25,
    abilityName: 'static',
    nature: 'jolly',
    statPoints: makeValidStatPoints(),
    moves: ['thunderbolt', 'thunder-wave', 'substitute', 'protect'],
    isMega: false,
    position: 0,
    ...overrides,
  };
}

function makeValidTeamInput(memberOverrides: Record<string, unknown>[] = []) {
  const members = Array.from({ length: 6 }, (_, i) =>
    makeValidMember({ position: i, ...(memberOverrides[i] || {}) })
  );
  return {
    name: 'Test Team',
    format: 'champions-doubles',
    isPublic: false,
    members,
  };
}

describe('TeamSchema', () => {
  it('should accept valid team data', () => {
    const result = TeamSchema.safeParse({ name: 'My Team' });
    expect(result.success).toBe(true);
  });

  it('should accept team with description', () => {
    const result = TeamSchema.safeParse({ name: 'My Team', description: 'A great team' });
    expect(result.success).toBe(true);
  });

  it('should accept empty string description', () => {
    const result = TeamSchema.safeParse({ name: 'My Team', description: '' });
    expect(result.success).toBe(true);
  });

  it('should reject empty name', () => {
    const result = TeamSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('should reject name over 100 characters', () => {
    const result = TeamSchema.safeParse({ name: 'a'.repeat(101) });
    expect(result.success).toBe(false);
  });

  it('should reject description over 500 characters', () => {
    const result = TeamSchema.safeParse({ name: 'Team', description: 'a'.repeat(501) });
    expect(result.success).toBe(false);
  });

  it('should default format to champions-doubles', () => {
    const result = TeamSchema.safeParse({ name: 'Team' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.format).toBe('champions-doubles');
    }
  });

  it('should default isPublic to false', () => {
    const result = TeamSchema.safeParse({ name: 'Team' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isPublic).toBe(false);
    }
  });
});

describe('StatPointsSchema (via TeamMemberSchema)', () => {
  it('should accept stat points totaling exactly 66', () => {
    const member = makeValidMember({
      statPoints: { hp: 10, atk: 12, def: 8, spAtk: 16, spDef: 10, spd: 10 },
    });
    const result = TeamMemberSchema.safeParse(member);
    expect(result.success).toBe(true);
  });

  it('should accept max points in one stat (32 in spd)', () => {
    const member = makeValidMember({
      statPoints: makeValidStatPoints({ hp: 6, atk: 6, def: 6, spAtk: 6, spDef: 10, spd: 32 }),
    });
    const result = TeamMemberSchema.safeParse(member);
    expect(result.success).toBe(true);
  });

  it('should reject stat points totaling less than 66', () => {
    const member = makeValidMember({
      statPoints: { hp: 0, atk: 0, def: 0, spAtk: 0, spDef: 0, spd: 65 },
    });
    const result = TeamMemberSchema.safeParse(member);
    expect(result.success).toBe(false);
  });

  it('should reject stat points totaling more than 66', () => {
    const member = makeValidMember({
      statPoints: { hp: 0, atk: 0, def: 0, spAtk: 0, spDef: 0, spd: 67 },
    });
    const result = TeamMemberSchema.safeParse(member);
    expect(result.success).toBe(false);
  });

  it('should reject individual stat over 32', () => {
    const member = makeValidMember({
      statPoints: { hp: 33, atk: 0, def: 0, spAtk: 0, spDef: 0, spd: 33 },
    });
    const result = TeamMemberSchema.safeParse(member);
    expect(result.success).toBe(false);
  });

  it('should reject negative stat values', () => {
    const member = makeValidMember({
      statPoints: { hp: -1, atk: 0, def: 0, spAtk: 0, spDef: 0, spd: 67 },
    });
    const result = TeamMemberSchema.safeParse(member);
    expect(result.success).toBe(false);
  });

  it('should reject non-integer stat values', () => {
    const member = makeValidMember({
      statPoints: { hp: 10.5, atk: 10, def: 10, spAtk: 10, spDef: 10, spd: 15.5 },
    });
    const result = TeamMemberSchema.safeParse(member);
    expect(result.success).toBe(false);
  });
});

describe('TeamMemberSchema - Nature validation', () => {
  it('should accept all 25 valid natures', () => {
    const natures = [
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
    ];

    for (const nature of natures) {
      const member = makeValidMember({ nature });
      const result = TeamMemberSchema.safeParse(member);
      expect(result.success).toBe(true);
    }
  });

  it('should accept natures case-insensitively', () => {
    const member = makeValidMember({ nature: 'JOLLY' });
    const result = TeamMemberSchema.safeParse(member);
    expect(result.success).toBe(true);
  });

  it('should reject invalid nature', () => {
    const member = makeValidMember({ nature: 'invalid-nature' });
    const result = TeamMemberSchema.safeParse(member);
    expect(result.success).toBe(false);
  });

  it('should reject empty nature', () => {
    const member = makeValidMember({ nature: '' });
    const result = TeamMemberSchema.safeParse(member);
    expect(result.success).toBe(false);
  });
});

describe('TeamMemberSchema - Moves validation', () => {
  it('should accept 1-4 moves', () => {
    for (let count = 1; count <= 4; count++) {
      const moves = Array.from({ length: count }, (_, i) => `move-${i}`);
      const member = makeValidMember({ moves });
      const result = TeamMemberSchema.safeParse(member);
      expect(result.success).toBe(true);
    }
  });

  it('should reject more than 4 moves', () => {
    const member = makeValidMember({
      moves: ['move-1', 'move-2', 'move-3', 'move-4', 'move-5'],
    });
    const result = TeamMemberSchema.safeParse(member);
    expect(result.success).toBe(false);
  });

  it('should reject duplicate moves', () => {
    const member = makeValidMember({
      moves: ['thunderbolt', 'thunderbolt', 'protect', 'substitute'],
    });
    const result = TeamMemberSchema.safeParse(member);
    expect(result.success).toBe(false);
  });

  it('should accept empty moves array', () => {
    const member = makeValidMember({ moves: [] });
    const result = TeamMemberSchema.safeParse(member);
    expect(result.success).toBe(true);
  });
});

describe('TeamMemberSchema - Position validation', () => {
  it('should accept positions 0-5', () => {
    for (let pos = 0; pos <= 5; pos++) {
      const member = makeValidMember({ position: pos });
      const result = TeamMemberSchema.safeParse(member);
      expect(result.success).toBe(true);
    }
  });

  it('should reject position > 5', () => {
    const member = makeValidMember({ position: 6 });
    const result = TeamMemberSchema.safeParse(member);
    expect(result.success).toBe(false);
  });

  it('should reject negative position', () => {
    const member = makeValidMember({ position: -1 });
    const result = TeamMemberSchema.safeParse(member);
    expect(result.success).toBe(false);
  });
});

describe('CreateTeamInput', () => {
  it('should accept valid team with 6 members', () => {
    const input = makeValidTeamInput();
    const result = CreateTeamInput.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('should reject team with fewer than 6 members', () => {
    const input = makeValidTeamInput();
    input.members = input.members.slice(0, 5);
    const result = CreateTeamInput.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should reject team with more than 6 members', () => {
    const input = makeValidTeamInput();
    input.members.push(makeValidMember({ position: 6 }));
    const result = CreateTeamInput.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should reject duplicate positions', () => {
    const input = makeValidTeamInput([{ position: 0 }, { position: 0 }]);
    const result = CreateTeamInput.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should reject missing team name', () => {
    const input = makeValidTeamInput();
    delete (input as Record<string, unknown>).name;
    const result = CreateTeamInput.safeParse(input);
    expect(result.success).toBe(false);
  });
});

describe('UpdateTeamInput', () => {
  it('should accept partial update (name only)', () => {
    const result = UpdateTeamInput.safeParse({ name: 'Updated Name' });
    expect(result.success).toBe(true);
  });

  it('should accept partial update (isPublic only)', () => {
    const result = UpdateTeamInput.safeParse({ isPublic: true });
    expect(result.success).toBe(true);
  });

  it('should accept update with members', () => {
    const members = Array.from({ length: 6 }, (_, i) => makeValidMember({ position: i }));
    const result = UpdateTeamInput.safeParse({ name: 'Updated', members });
    expect(result.success).toBe(true);
  });

  it('should reject members with wrong count in update', () => {
    const members = Array.from({ length: 3 }, (_, i) => makeValidMember({ position: i }));
    const result = UpdateTeamInput.safeParse({ members });
    expect(result.success).toBe(false);
  });

  it('should accept completely empty update', () => {
    const result = UpdateTeamInput.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe('PaginationSchema', () => {
  it('should provide sensible defaults', () => {
    const result = PaginationSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
      expect(result.data.sortBy).toBe('createdAt');
      expect(result.data.sortOrder).toBe('desc');
    }
  });

  it('should coerce string numbers', () => {
    const result = PaginationSchema.safeParse({ page: '2', limit: '10' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
      expect(result.data.limit).toBe(10);
    }
  });

  it('should reject page < 1', () => {
    const result = PaginationSchema.safeParse({ page: 0 });
    expect(result.success).toBe(false);
  });

  it('should reject limit > 50', () => {
    const result = PaginationSchema.safeParse({ limit: 51 });
    expect(result.success).toBe(false);
  });

  it('should reject invalid sortBy', () => {
    const result = PaginationSchema.safeParse({ sortBy: 'invalid' });
    expect(result.success).toBe(false);
  });
});
