import { POKEMON_TYPES, type PokemonType } from '@/lib/type-chart';
import type { StatPoints } from '@/server/validators/team.validator';

export interface ValidationIssue {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

interface TeamMemberData {
  pokemonId: number;
  pokemon: {
    id: number;
    name: string;
    isMega: boolean;
    megaStone?: string | null;
  };
  itemId?: number | null;
  item?: {
    id: number;
    name: string;
  } | null;
  abilityName: string;
  nature: string;
  statPoints: string | StatPoints;
  moves: string | string[];
  isMega: boolean;
  teraType?: string | null;
  position: number;
}

interface TeamData {
  name: string;
  members: TeamMemberData[];
}

function parseStatPoints(sp: string | StatPoints): StatPoints {
  if (typeof sp === 'string') {
    return JSON.parse(sp) as StatPoints;
  }
  return sp;
}

function parseMoves(moves: string | string[]): string[] {
  if (typeof moves === 'string') {
    return JSON.parse(moves) as string[];
  }
  return moves;
}

function getBaseSpeciesName(name: string): string {
  return name.replace(/-mega-[xy]?$/, '').replace(/-mega$/, '');
}

/**
 * Validate team composition: exactly 6 Pokemon, valid SP, valid moves.
 */
export function validateTeamComposition(team: TeamData): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (team.members.length !== 6) {
    issues.push({
      field: 'members',
      message: `Team must have exactly 6 Pokemon, got ${team.members.length}`,
      severity: 'error',
    });
    return { valid: false, issues };
  }

  for (let i = 0; i < team.members.length; i++) {
    const member = team.members[i];
    const prefix = `members[${i}]`;

    const sp = parseStatPoints(member.statPoints);
    const total = sp.hp + sp.atk + sp.def + sp.spAtk + sp.spDef + sp.spd;

    if (total !== 66) {
      issues.push({
        field: `${prefix}.statPoints`,
        message: `Stat points must total 66, got ${total} for ${member.pokemon.name}`,
        severity: 'error',
      });
    }

    const statKeys: Array<keyof StatPoints> = ['hp', 'atk', 'def', 'spAtk', 'spDef', 'spd'];
    for (const key of statKeys) {
      if (sp[key] < 0 || sp[key] > 32) {
        issues.push({
          field: `${prefix}.statPoints.${key}`,
          message: `Stat ${key} must be between 0 and 32, got ${sp[key]}`,
          severity: 'error',
        });
      }
    }

    const moves = parseMoves(member.moves);
    if (moves.length > 4) {
      issues.push({
        field: `${prefix}.moves`,
        message: `${member.pokemon.name} has ${moves.length} moves, maximum is 4`,
        severity: 'error',
      });
    }

    const uniqueMoves = new Set(moves);
    if (uniqueMoves.size !== moves.length) {
      issues.push({
        field: `${prefix}.moves`,
        message: `${member.pokemon.name} has duplicate moves`,
        severity: 'error',
      });
    }
  }

  return {
    valid: issues.filter((i) => i.severity === 'error').length === 0,
    issues,
  };
}

/**
 * Validate Mega Evolution rules: maximum 1 Mega per team.
 */
export function validateMegaEvolution(members: TeamMemberData[]): ValidationResult {
  const issues: ValidationIssue[] = [];

  const megaMembers = members.filter((m) => m.isMega || m.pokemon.isMega);

  if (megaMembers.length > 1) {
    const names = megaMembers.map((m) => m.pokemon.name).join(', ');
    issues.push({
      field: 'members',
      message: `Team has ${megaMembers.length} Mega Evolutions (max 1): ${names}`,
      severity: 'error',
    });
  }

  for (let i = 0; i < members.length; i++) {
    const member = members[i];
    if (member.isMega && !member.pokemon.isMega) {
      issues.push({
        field: `members[${i}].isMega`,
        message: `${member.pokemon.name} cannot Mega Evolve`,
        severity: 'error',
      });
    }
  }

  return {
    valid: issues.filter((i) => i.severity === 'error').length === 0,
    issues,
  };
}

/**
 * Validate Terastallization: Tera Type must be one of the 18 valid types.
 */
export function validateTerastallization(members: TeamMemberData[]): ValidationResult {
  const issues: ValidationIssue[] = [];
  const validTypes = new Set<string>(POKEMON_TYPES);

  for (let i = 0; i < members.length; i++) {
    const member = members[i];
    if (member.teraType) {
      const normalized = member.teraType.toLowerCase();
      if (!validTypes.has(normalized as PokemonType)) {
        issues.push({
          field: `members[${i}].teraType`,
          message: `Invalid Tera Type "${member.teraType}" for ${member.pokemon.name}. Must be one of: ${POKEMON_TYPES.join(', ')}`,
          severity: 'error',
        });
      }
    }
  }

  return {
    valid: issues.filter((i) => i.severity === 'error').length === 0,
    issues,
  };
}

/**
 * Validate no duplicate species (base species) or items.
 */
export function validateNoDuplicates(members: TeamMemberData[]): ValidationResult {
  const issues: ValidationIssue[] = [];

  const speciesSeen = new Map<string, number>();
  for (let i = 0; i < members.length; i++) {
    const member = members[i];
    const baseSpecies = getBaseSpeciesName(member.pokemon.name.toLowerCase());

    if (speciesSeen.has(baseSpecies)) {
      issues.push({
        field: `members[${i}].pokemonId`,
        message: `Duplicate species: ${member.pokemon.name} shares base species with position ${speciesSeen.get(baseSpecies)}`,
        severity: 'error',
      });
    } else {
      speciesSeen.set(baseSpecies, i);
    }
  }

  const itemsSeen = new Map<number, number>();
  for (let i = 0; i < members.length; i++) {
    const member = members[i];
    if (member.itemId != null) {
      if (itemsSeen.has(member.itemId)) {
        const itemName = member.item?.name ?? `item #${member.itemId}`;
        issues.push({
          field: `members[${i}].itemId`,
          message: `Duplicate item: ${itemName} is also held by position ${itemsSeen.get(member.itemId)}`,
          severity: 'error',
        });
      } else {
        itemsSeen.set(member.itemId, i);
      }
    }
  }

  return {
    valid: issues.filter((i) => i.severity === 'error').length === 0,
    issues,
  };
}

/**
 * Run all validation checks on a team.
 */
export function validateTeam(team: TeamData): ValidationResult {
  const allIssues: ValidationIssue[] = [];

  const composition = validateTeamComposition(team);
  allIssues.push(...composition.issues);

  const mega = validateMegaEvolution(team.members);
  allIssues.push(...mega.issues);

  const tera = validateTerastallization(team.members);
  allIssues.push(...tera.issues);

  const dupes = validateNoDuplicates(team.members);
  allIssues.push(...dupes.issues);

  return {
    valid: allIssues.filter((i) => i.severity === 'error').length === 0,
    issues: allIssues,
  };
}

export class TeamValidatorService {
  validateTeam(team: TeamData): ValidationResult {
    return validateTeam(team);
  }

  validateTeamComposition(team: TeamData): ValidationResult {
    return validateTeamComposition(team);
  }

  validateMegaEvolution(members: TeamMemberData[]): ValidationResult {
    return validateMegaEvolution(members);
  }

  validateTerastallization(members: TeamMemberData[]): ValidationResult {
    return validateTerastallization(members);
  }

  validateNoDuplicates(members: TeamMemberData[]): ValidationResult {
    return validateNoDuplicates(members);
  }
}

export const teamValidatorService = new TeamValidatorService();
export type { TeamData, TeamMemberData };
