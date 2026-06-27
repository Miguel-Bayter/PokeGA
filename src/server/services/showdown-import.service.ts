import { z } from 'zod';
import type { StatPoints } from '@/server/validators/team.validator';
import { getNatureEffect } from './showdown-export.service';

const ParsedPokemonSchema = z.object({
  nickname: z.string().optional(),
  species: z.string().min(1, 'Species is required'),
  item: z.string().optional(),
  ability: z.string().min(1, 'Ability is required'),
  teraType: z.string().optional(),
  level: z.number().int().min(1).max(100).default(50),
  isMega: z.boolean().default(false),
  statPoints: z.object({
    hp: z.number().int().min(0).max(32),
    atk: z.number().int().min(0).max(32),
    def: z.number().int().min(0).max(32),
    spAtk: z.number().int().min(0).max(32),
    spDef: z.number().int().min(0).max(32),
    spd: z.number().int().min(0).max(32),
  }),
  nature: z.string().min(1, 'Nature is required'),
  moves: z.array(z.string().min(1)).max(4),
});

export type ParsedPokemon = z.infer<typeof ParsedPokemonSchema>;

export interface ImportError {
  block: number;
  message: string;
  line?: number;
}

export interface ImportResult {
  success: boolean;
  pokemon: ParsedPokemon[];
  errors: ImportError[];
}

interface StatPointsPartial {
  hp?: number;
  atk?: number;
  def?: number;
  spAtk?: number;
  spDef?: number;
  spd?: number;
}

function toKebabCase(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, '-');
}

function parseHeaderLine(line: string): { nickname?: string; species: string; item?: string } {
  let nickname: string | undefined;
  let species: string;
  let item: string | undefined;

  let working = line.trim();

  const itemMatch = working.match(/^(.+?)\s*@\s*(.+)$/);
  if (itemMatch) {
    working = itemMatch[1].trim();
    item = toKebabCase(itemMatch[2].trim());
  }

  const nicknameMatch = working.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (nicknameMatch) {
    nickname = nicknameMatch[1].trim();
    species = toKebabCase(nicknameMatch[2].trim());
  } else {
    species = toKebabCase(working);
  }

  return { nickname, species, item };
}

function parseStatLine(line: string): { stat: keyof StatPointsPartial; value: number } | null {
  const match = line.match(/^-\s*(HP|Atk|Def|SpA|SpD|Spe)[+\-]?:\s*(\d+)/i);
  if (!match) return null;

  const statMap: Record<string, keyof StatPointsPartial> = {
    hp: 'hp',
    atk: 'atk',
    def: 'def',
    spa: 'spAtk',
    spd: 'spDef',
    spe: 'spd',
  };

  const statKey = match[1].toLowerCase();
  const mapped = statMap[statKey];
  if (!mapped) return null;

  return { stat: mapped, value: parseInt(match[2], 10) };
}

function parseNatureLine(line: string): string | null {
  const match = line.match(/^(\w+)\s*nature/i);
  if (!match) return null;
  return match[1].toLowerCase();
}

function parseMoveLine(line: string): string | null {
  const match = line.match(/^-\s+(.+)$/);
  if (!match) return null;
  return toKebabCase(match[1].trim());
}

/**
 * Parse a single Pokemon block from Showdown text format.
 */
export function parsePokemonBlock(
  block: string,
  blockIndex: number = 0
): {
  pokemon: ParsedPokemon | null;
  error: ImportError | null;
} {
  const lines = block
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return {
      pokemon: null,
      error: { block: blockIndex, message: 'Empty Pokemon block' },
    };
  }

  const header = parseHeaderLine(lines[0]);
  let ability: string | undefined;
  let teraType: string | undefined;
  let level = 50;
  let isMega = false;
  const statPoints: StatPointsPartial = {};
  let nature: string | undefined;
  const moves: string[] = [];
  let inSPSection = false;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('Ability:')) {
      ability = toKebabCase(line.replace(/^Ability:\s*/i, ''));
      continue;
    }

    if (line.startsWith('Tera Type:')) {
      teraType = line
        .replace(/^Tera Type:\s*/i, '')
        .trim()
        .toLowerCase();
      continue;
    }

    if (line.startsWith('Level:')) {
      const lvl = parseInt(line.replace(/^Level:\s*/i, '').trim(), 10);
      if (!isNaN(lvl)) level = lvl;
      continue;
    }

    if (line.startsWith('Mega:')) {
      const megaVal = line
        .replace(/^Mega:\s*/i, '')
        .trim()
        .toLowerCase();
      isMega = megaVal === 'yes' || megaVal === 'true' || megaVal === '1';
      continue;
    }

    if (line === 'SP:') {
      inSPSection = true;
      continue;
    }

    if (inSPSection && line.startsWith('-')) {
      const statResult = parseStatLine(line);
      if (statResult) {
        statPoints[statResult.stat] = statResult.value;
      }
      continue;
    }

    const natureResult = parseNatureLine(line);
    if (natureResult) {
      nature = natureResult;
      inSPSection = false;
      continue;
    }

    const moveResult = parseMoveLine(line);
    if (moveResult) {
      moves.push(moveResult);
      inSPSection = false;
      continue;
    }

    inSPSection = false;
  }

  if (!header.species) {
    return {
      pokemon: null,
      error: { block: blockIndex, message: 'Missing species name' },
    };
  }

  if (!ability) {
    return {
      pokemon: null,
      error: { block: blockIndex, message: 'Missing ability' },
    };
  }

  if (!nature) {
    return {
      pokemon: null,
      error: { block: blockIndex, message: 'Missing nature' },
    };
  }

  const defaultSP: StatPoints = {
    hp: 0,
    atk: 0,
    def: 0,
    spAtk: 0,
    spDef: 0,
    spd: 0,
  };

  const finalStatPoints: StatPoints = {
    hp: statPoints.hp ?? defaultSP.hp,
    atk: statPoints.atk ?? defaultSP.atk,
    def: statPoints.def ?? defaultSP.def,
    spAtk: statPoints.spAtk ?? defaultSP.spAtk,
    spDef: statPoints.spDef ?? defaultSP.spDef,
    spd: statPoints.spd ?? defaultSP.spd,
  };

  const rawData = {
    nickname: header.nickname,
    species: header.species,
    item: header.item,
    ability,
    teraType,
    level,
    isMega,
    statPoints: finalStatPoints,
    nature,
    moves,
  };

  const result = ParsedPokemonSchema.safeParse(rawData);

  if (!result.success) {
    const messages = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    return {
      pokemon: null,
      error: { block: blockIndex, message: `Validation failed: ${messages}` },
    };
  }

  return { pokemon: result.data, error: null };
}

/**
 * Import an entire team from Pokemon Showdown text format.
 * Splits the text into blocks separated by blank lines and parses each.
 */
export function importTeamFromText(text: string): ImportResult {
  if (!text || text.trim().length === 0) {
    return {
      success: false,
      pokemon: [],
      errors: [{ block: 0, message: 'Empty input text' }],
    };
  }

  const blocks = text
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter((b) => b.length > 0);

  if (blocks.length === 0) {
    return {
      success: false,
      pokemon: [],
      errors: [{ block: 0, message: 'No Pokemon blocks found' }],
    };
  }

  const pokemon: ParsedPokemon[] = [];
  const errors: ImportError[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const { pokemon: parsed, error } = parsePokemonBlock(blocks[i], i + 1);
    if (parsed) {
      pokemon.push(parsed);
    }
    if (error) {
      errors.push(error);
    }
  }

  return {
    success: errors.length === 0,
    pokemon,
    errors,
  };
}

export { getNatureEffect };
