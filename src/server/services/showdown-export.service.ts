import type { StatPoints } from '@/server/validators/team.validator';

type NatureStat = 'atk' | 'def' | 'spAtk' | 'spDef' | 'spd';

interface NatureEffect {
  plus: NatureStat | null;
  minus: NatureStat | null;
}

const NATURE_MAP: Record<string, NatureEffect> = {
  hardy: { plus: null, minus: null },
  lonely: { plus: 'atk', minus: 'def' },
  brave: { plus: 'atk', minus: 'spd' },
  adamant: { plus: 'atk', minus: 'spAtk' },
  naughty: { plus: 'atk', minus: 'spDef' },
  bold: { plus: 'def', minus: 'atk' },
  docile: { plus: null, minus: null },
  relaxed: { plus: 'def', minus: 'spd' },
  impish: { plus: 'def', minus: 'spAtk' },
  lax: { plus: 'def', minus: 'spDef' },
  timid: { plus: 'spd', minus: 'atk' },
  hasty: { plus: 'spd', minus: 'def' },
  serious: { plus: null, minus: null },
  jolly: { plus: 'spd', minus: 'spAtk' },
  naive: { plus: 'spd', minus: 'spDef' },
  modest: { plus: 'spAtk', minus: 'atk' },
  mild: { plus: 'spAtk', minus: 'def' },
  quiet: { plus: 'spAtk', minus: 'spd' },
  bashful: { plus: null, minus: null },
  rash: { plus: 'spAtk', minus: 'spDef' },
  calm: { plus: 'spDef', minus: 'atk' },
  gentle: { plus: 'spDef', minus: 'def' },
  sassy: { plus: 'spDef', minus: 'spd' },
  careful: { plus: 'spDef', minus: 'spAtk' },
  quirky: { plus: null, minus: null },
};

const STAT_LABELS: Record<string, string> = {
  hp: 'HP',
  atk: 'Atk',
  def: 'Def',
  spAtk: 'SpA',
  spDef: 'SpD',
  spd: 'Spe',
};

const STAT_LABELS_SHORT: Record<string, string> = {
  atk: 'Atk',
  def: 'Def',
  spAtk: 'SpA',
  spDef: 'SpD',
  spd: 'Spe',
};

interface PokemonData {
  nickname?: string;
  species: string;
  item?: string | null;
  ability: string;
  teraType?: string | null;
  level?: number;
  isMega: boolean;
  statPoints: StatPoints;
  nature: string;
  moves: string[];
}

interface TeamWithMembers {
  name: string;
  members: PokemonData[];
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function formatSpeciesName(name: string): string {
  return name
    .split('-')
    .map((w) => capitalize(w))
    .join('-');
}

function formatMoveName(name: string): string {
  return name
    .split('-')
    .map((w) => capitalize(w))
    .join(' ');
}

function formatItemName(name: string): string {
  return name
    .split('-')
    .map((w) => capitalize(w))
    .join(' ');
}

function formatAbilityName(name: string): string {
  return name
    .split('-')
    .map((w) => capitalize(w))
    .join(' ');
}

/**
 * Export a single Pokemon member to Pokemon Showdown text format.
 */
export function exportMemberToText(member: PokemonData): string {
  const lines: string[] = [];

  const speciesFormatted = formatSpeciesName(member.species);
  const header = member.nickname ? `${member.nickname} (${speciesFormatted})` : speciesFormatted;

  const itemLine = member.item ? `${header} @ ${formatItemName(member.item)}` : header;
  lines.push(itemLine);

  lines.push(`Ability: ${formatAbilityName(member.ability)}`);

  if (member.teraType) {
    lines.push(`Tera Type: ${capitalize(member.teraType)}`);
  }

  const level = member.level ?? 50;
  lines.push(`Level: ${level}`);

  if (member.isMega) {
    lines.push('Mega: Yes');
  }

  lines.push('SP:');

  const natureEffect = NATURE_MAP[member.nature.toLowerCase()] ?? { plus: null, minus: null };

  const statKeys: Array<keyof StatPoints> = ['hp', 'atk', 'def', 'spAtk', 'spDef', 'spd'];

  for (const key of statKeys) {
    const value = member.statPoints[key];
    const label = STAT_LABELS[key];

    if (key !== 'hp' && natureEffect.plus === key) {
      lines.push(`- ${label}+: ${value}`);
    } else if (key !== 'hp' && natureEffect.minus === key) {
      lines.push(`- ${label}-: ${value}`);
    } else {
      lines.push(`- ${label}: ${value}`);
    }
  }

  const natureName = capitalize(member.nature);
  if (natureEffect.plus && natureEffect.minus) {
    const plusLabel = STAT_LABELS_SHORT[natureEffect.plus];
    const minusLabel = STAT_LABELS_SHORT[natureEffect.minus];
    lines.push(`${natureName} Nature (+${plusLabel}, -${minusLabel})`);
  } else {
    lines.push(`${natureName} Nature`);
  }

  for (const move of member.moves) {
    lines.push(`- ${formatMoveName(move)}`);
  }

  return lines.join('\n');
}

/**
 * Export an entire team to Pokemon Showdown text format.
 * Each Pokemon is separated by a blank line.
 */
export function exportTeamToText(team: TeamWithMembers): string {
  return team.members.map((member) => exportMemberToText(member)).join('\n\n');
}

/**
 * Get the nature effect (boosted/lowered stats) for a given nature name.
 */
export function getNatureEffect(nature: string): NatureEffect {
  return NATURE_MAP[nature.toLowerCase()] ?? { plus: null, minus: null };
}

export { NATURE_MAP };
export type { NatureEffect, PokemonData, TeamWithMembers };
