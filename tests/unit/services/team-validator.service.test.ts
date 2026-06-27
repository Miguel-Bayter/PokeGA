/**
 * Unit Tests for Team Validator Service
 */

import { describe, it, expect } from 'vitest';
import {
  validateTeamComposition,
  validateMegaEvolution,
  validateTerastallization,
  validateNoDuplicates,
  validateTeam,
  type TeamData,
  type TeamMemberData,
} from '@/server/services/team-validator.service';

function makeMember(overrides: Partial<TeamMemberData> = {}): TeamMemberData {
  return {
    pokemonId: 6,
    pokemon: {
      id: 6,
      name: 'charizard',
      isMega: false,
      megaStone: null,
    },
    itemId: null,
    item: null,
    abilityName: 'blaze',
    nature: 'timid',
    statPoints: JSON.stringify({ hp: 11, atk: 11, def: 11, spAtk: 11, spDef: 11, spd: 11 }),
    moves: JSON.stringify(['flamethrower', 'air-slash', 'dragon-pulse', 'roost']),
    isMega: false,
    teraType: null,
    position: 0,
    ...overrides,
  };
}

function makeValidTeam(overrides: Partial<TeamMemberData>[] = []): TeamData {
  const defaults: Partial<TeamMemberData>[] = [
    { pokemonId: 6, pokemon: { id: 6, name: 'charizard', isMega: false }, position: 0 },
    { pokemonId: 9, pokemon: { id: 9, name: 'blastoise', isMega: false }, position: 1 },
    { pokemonId: 3, pokemon: { id: 3, name: 'venusaur', isMega: false }, position: 2 },
    { pokemonId: 25, pokemon: { id: 25, name: 'pikachu', isMega: false }, position: 3 },
    { pokemonId: 94, pokemon: { id: 94, name: 'gengar', isMega: false }, position: 4 },
    { pokemonId: 149, pokemon: { id: 149, name: 'dragonite', isMega: false }, position: 5 },
  ];

  const members = defaults.map((d, i) => {
    const override = overrides[i] ?? {};
    return makeMember({ ...d, ...override });
  });

  return { name: 'Test Team', members };
}

describe('TeamValidatorService', () => {
  describe('validateTeamComposition', () => {
    it('should pass for a valid team with 6 members', () => {
      const team = makeValidTeam();
      const result = validateTeamComposition(team);
      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should reject a team with fewer than 6 members', () => {
      const team: TeamData = {
        name: 'Short Team',
        members: [makeMember(), makeMember()],
      };
      const result = validateTeamComposition(team);
      expect(result.valid).toBe(false);
      expect(result.issues[0].message).toContain('6');
    });

    it('should reject a team with more than 6 members', () => {
      const members = Array.from({ length: 7 }, () => makeMember());
      const team: TeamData = { name: 'Long Team', members };
      const result = validateTeamComposition(team);
      expect(result.valid).toBe(false);
    });

    it('should reject invalid SP total (not 66)', () => {
      const team = makeValidTeam([
        { statPoints: JSON.stringify({ hp: 10, atk: 10, def: 10, spAtk: 10, spDef: 10, spd: 10 }) },
      ]);
      const result = validateTeamComposition(team);
      expect(result.valid).toBe(false);
      expect(result.issues.some((i) => i.message.includes('66'))).toBe(true);
    });

    it('should reject SP value exceeding 32', () => {
      const team = makeValidTeam([
        {
          statPoints: JSON.stringify({
            hp: 33,
            atk: 11,
            def: 11,
            spAtk: 0,
            spDef: 0,
            spd: 1,
          }),
        },
      ]);
      const result = validateTeamComposition(team);
      expect(result.valid).toBe(false);
      expect(result.issues.some((i) => i.field.includes('statPoints.hp'))).toBe(true);
    });

    it('should reject more than 4 moves', () => {
      const team = makeValidTeam([
        {
          moves: JSON.stringify(['move1', 'move2', 'move3', 'move4', 'move5']),
        },
      ]);
      const result = validateTeamComposition(team);
      expect(result.valid).toBe(false);
      expect(result.issues.some((i) => i.message.includes('4'))).toBe(true);
    });

    it('should reject duplicate moves', () => {
      const team = makeValidTeam([
        {
          moves: JSON.stringify(['flamethrower', 'flamethrower', 'air-slash', 'roost']),
        },
      ]);
      const result = validateTeamComposition(team);
      expect(result.valid).toBe(false);
      expect(result.issues.some((i) => i.message.includes('duplicate'))).toBe(true);
    });

    it('should accept StatPoints as object (not JSON string)', () => {
      const member = makeMember();
      member.statPoints = { hp: 11, atk: 11, def: 11, spAtk: 11, spDef: 11, spd: 11 };
      member.moves = ['flamethrower', 'air-slash', 'dragon-pulse', 'roost'];

      const team: TeamData = {
        name: 'Test',
        members: [member, makeMember(), makeMember(), makeMember(), makeMember(), makeMember()],
      };
      const result = validateTeamComposition(team);
      expect(result.valid).toBe(true);
    });
  });

  describe('validateMegaEvolution', () => {
    it('should pass with 0 or 1 Mega Evolution', () => {
      const members = [makeMember(), makeMember()];
      expect(validateMegaEvolution(members).valid).toBe(true);

      members[0] = makeMember({
        isMega: true,
        pokemon: { id: 10001, name: 'charizard-mega-x', isMega: true },
      });
      expect(validateMegaEvolution(members).valid).toBe(true);
    });

    it('should reject multiple Mega Evolutions', () => {
      const members = [
        makeMember({
          isMega: true,
          pokemon: { id: 10001, name: 'charizard-mega-x', isMega: true },
        }),
        makeMember({ isMega: true, pokemon: { id: 10005, name: 'blastoise-mega', isMega: true } }),
      ];
      const result = validateMegaEvolution(members);
      expect(result.valid).toBe(false);
      expect(result.issues[0].message).toContain('2 Mega Evolutions');
    });

    it('should reject isMega=true on a Pokemon that cannot mega evolve', () => {
      const members = [
        makeMember({ isMega: true, pokemon: { id: 25, name: 'pikachu', isMega: false } }),
      ];
      const result = validateMegaEvolution(members);
      expect(result.valid).toBe(false);
      expect(result.issues[0].message).toContain('cannot Mega Evolve');
    });
  });

  describe('validateTerastallization', () => {
    it('should pass with valid Tera Types', () => {
      const members = [
        makeMember({ teraType: 'fire' }),
        makeMember({ teraType: 'water' }),
        makeMember({ teraType: null }),
      ];
      const result = validateTerastallization(members);
      expect(result.valid).toBe(true);
    });

    it('should reject invalid Tera Type', () => {
      const members = [makeMember({ teraType: 'invalid-type' })];
      const result = validateTerastallization(members);
      expect(result.valid).toBe(false);
      expect(result.issues[0].message).toContain('Invalid Tera Type');
    });

    it('should allow multiple Pokemon with the same Tera Type', () => {
      const members = [makeMember({ teraType: 'fire' }), makeMember({ teraType: 'fire' })];
      const result = validateTerastallization(members);
      expect(result.valid).toBe(true);
    });

    it('should accept all 18 types', () => {
      const types = [
        'normal',
        'fire',
        'water',
        'electric',
        'grass',
        'ice',
        'fighting',
        'poison',
        'ground',
        'flying',
        'psychic',
        'bug',
        'rock',
        'ghost',
        'dragon',
        'dark',
        'steel',
        'fairy',
      ];
      const members = types.map((t) => makeMember({ teraType: t }));
      const result = validateTerastallization(members);
      expect(result.valid).toBe(true);
    });
  });

  describe('validateNoDuplicates', () => {
    it('should pass with all unique species and items', () => {
      const team = makeValidTeam();
      const result = validateNoDuplicates(team.members);
      expect(result.valid).toBe(true);
    });

    it('should reject duplicate species', () => {
      const members = [
        makeMember({ pokemonId: 6, pokemon: { id: 6, name: 'charizard', isMega: false } }),
        makeMember({ pokemonId: 6, pokemon: { id: 6, name: 'charizard', isMega: false } }),
      ];
      const result = validateNoDuplicates(members);
      expect(result.valid).toBe(false);
      expect(result.issues[0].message).toContain('Duplicate species');
    });

    it('should reject duplicate items', () => {
      const members = [
        makeMember({
          pokemonId: 6,
          pokemon: { id: 6, name: 'charizard', isMega: false },
          itemId: 100,
          item: { id: 100, name: 'choice-specs' },
        }),
        makeMember({
          pokemonId: 9,
          pokemon: { id: 9, name: 'blastoise', isMega: false },
          itemId: 100,
          item: { id: 100, name: 'choice-specs' },
        }),
      ];
      const result = validateNoDuplicates(members);
      expect(result.valid).toBe(false);
      expect(result.issues[0].message).toContain('Duplicate item');
    });

    it('should allow different forms of the same base species (mega vs base)', () => {
      const members = [
        makeMember({
          pokemonId: 6,
          pokemon: { id: 6, name: 'charizard', isMega: false },
        }),
        makeMember({
          pokemonId: 10001,
          pokemon: { id: 10001, name: 'charizard-mega-x', isMega: true },
        }),
      ];
      const result = validateNoDuplicates(members);
      expect(result.valid).toBe(false);
    });

    it('should allow Pokemon with no items (null itemId)', () => {
      const members = [
        makeMember({
          pokemonId: 6,
          pokemon: { id: 6, name: 'charizard', isMega: false },
          itemId: null,
          item: null,
        }),
        makeMember({
          pokemonId: 9,
          pokemon: { id: 9, name: 'blastoise', isMega: false },
          itemId: null,
          item: null,
        }),
      ];
      const result = validateNoDuplicates(members);
      expect(result.valid).toBe(true);
    });
  });

  describe('validateTeam (full validation)', () => {
    it('should pass for a fully valid team', () => {
      const team = makeValidTeam();
      const result = validateTeam(team);
      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should aggregate errors from all validators', () => {
      const team: TeamData = {
        name: 'Bad Team',
        members: [
          makeMember({
            isMega: true,
            pokemon: { id: 10001, name: 'charizard-mega-x', isMega: true },
          }),
          makeMember({
            isMega: true,
            pokemon: { id: 10005, name: 'blastoise-mega', isMega: true },
          }),
          makeMember({ teraType: 'invalid' }),
          makeMember({
            pokemonId: 6,
            pokemon: { id: 6, name: 'charizard', isMega: false },
          }),
          makeMember(),
          makeMember(),
        ],
      };

      const result = validateTeam(team);
      expect(result.valid).toBe(false);
      expect(result.issues.length).toBeGreaterThanOrEqual(3);
    });
  });
});
