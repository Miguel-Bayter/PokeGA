/**
 * Unit Tests for Showdown Import Service
 */

import { describe, it, expect } from 'vitest';
import { importTeamFromText, parsePokemonBlock } from '@/server/services/showdown-import.service';

const VALID_POKEMON_BLOCK = `Blaze (Charizard) @ Charizardite Y
Ability: Blaze
Tera Type: Fire
Level: 50
Mega: Yes
SP:
- HP: 10
- Atk-: 0
- Def: 12
- SpA+: 28
- SpD: 6
- Spe: 10
Timid Nature (+SpA, -Atk)
- Flamethrower
- Air Slash
- Dragon Pulse
- Roost`;

const MINIMAL_POKEMON_BLOCK = `Pikachu
Ability: Static
Level: 50
SP:
- HP: 11
- Atk: 11
- Def: 11
- SpA: 11
- SpD: 11
- Spe: 11
Hardy Nature
- Thunderbolt`;

describe('ShowdownImportService', () => {
  describe('parsePokemonBlock', () => {
    it('should parse a valid Pokemon block with all fields', () => {
      const { pokemon, error } = parsePokemonBlock(VALID_POKEMON_BLOCK, 1);

      expect(error).toBeNull();
      expect(pokemon).not.toBeNull();
      expect(pokemon!.nickname).toBe('Blaze');
      expect(pokemon!.species).toBe('charizard');
      expect(pokemon!.item).toBe('charizardite-y');
      expect(pokemon!.ability).toBe('blaze');
      expect(pokemon!.teraType).toBe('fire');
      expect(pokemon!.level).toBe(50);
      expect(pokemon!.isMega).toBe(true);
      expect(pokemon!.statPoints).toEqual({
        hp: 10,
        atk: 0,
        def: 12,
        spAtk: 28,
        spDef: 6,
        spd: 10,
      });
      expect(pokemon!.nature).toBe('timid');
      expect(pokemon!.moves).toEqual(['flamethrower', 'air-slash', 'dragon-pulse', 'roost']);
    });

    it('should parse a minimal Pokemon block (no item, no tera, no mega)', () => {
      const { pokemon, error } = parsePokemonBlock(MINIMAL_POKEMON_BLOCK, 1);

      expect(error).toBeNull();
      expect(pokemon).not.toBeNull();
      expect(pokemon!.nickname).toBeUndefined();
      expect(pokemon!.species).toBe('pikachu');
      expect(pokemon!.item).toBeUndefined();
      expect(pokemon!.teraType).toBeUndefined();
      expect(pokemon!.isMega).toBe(false);
      expect(pokemon!.nature).toBe('hardy');
      expect(pokemon!.moves).toEqual(['thunderbolt']);
    });

    it('should parse species name without nickname', () => {
      const block = `Gengar
Ability: Cursed Body
SP:
- HP: 11
- Atk: 11
- Def: 11
- SpA: 11
- SpD: 11
- Spe: 11
Modest Nature
- Shadow Ball`;

      const { pokemon, error } = parsePokemonBlock(block, 1);
      expect(error).toBeNull();
      expect(pokemon!.species).toBe('gengar');
      expect(pokemon!.nickname).toBeUndefined();
    });

    it('should parse nickname and species', () => {
      const block = `Spooky (Gengar)
Ability: Cursed Body
SP:
- HP: 11
- Atk: 11
- Def: 11
- SpA: 11
- SpD: 11
- Spe: 11
Modest Nature
- Shadow Ball`;

      const { pokemon } = parsePokemonBlock(block, 1);
      expect(pokemon!.nickname).toBe('Spooky');
      expect(pokemon!.species).toBe('gengar');
    });

    it('should parse item correctly', () => {
      const block = `Charizard @ Choice Specs
Ability: Blaze
SP:
- HP: 11
- Atk: 11
- Def: 11
- SpA: 11
- SpD: 11
- Spe: 11
Modest Nature
- Flamethrower`;

      const { pokemon } = parsePokemonBlock(block, 1);
      expect(pokemon!.item).toBe('choice-specs');
    });

    it('should detect missing ability as error', () => {
      const block = `Charizard
SP:
- HP: 11
- Atk: 11
- Def: 11
- SpA: 11
- SpD: 11
- Spe: 11
Modest Nature
- Flamethrower`;

      const { error } = parsePokemonBlock(block, 1);
      expect(error).not.toBeNull();
      expect(error!.message).toContain('ability');
    });

    it('should detect missing nature as error', () => {
      const block = `Charizard
Ability: Blaze
SP:
- HP: 11
- Atk: 11
- Def: 11
- SpA: 11
- SpD: 11
- Spe: 11
- Flamethrower`;

      const { error } = parsePokemonBlock(block, 1);
      expect(error).not.toBeNull();
      expect(error!.message).toContain('nature');
    });

    it('should handle empty block', () => {
      const { error } = parsePokemonBlock('', 1);
      expect(error).not.toBeNull();
      expect(error!.message).toContain('Empty');
    });

    it('should parse Mega flag correctly', () => {
      const block = `Charizard
Ability: Blaze
Mega: Yes
SP:
- HP: 11
- Atk: 11
- Def: 11
- SpA: 11
- SpD: 11
- Spe: 11
Hardy Nature
- Flamethrower`;

      const { pokemon } = parsePokemonBlock(block, 1);
      expect(pokemon!.isMega).toBe(true);
    });

    it('should handle Mega: No', () => {
      const block = `Charizard
Ability: Blaze
Mega: No
SP:
- HP: 11
- Atk: 11
- Def: 11
- SpA: 11
- SpD: 11
- Spe: 11
Hardy Nature
- Flamethrower`;

      const { pokemon } = parsePokemonBlock(block, 1);
      expect(pokemon!.isMega).toBe(false);
    });

    it('should default level to 50 when not specified', () => {
      const block = `Pikachu
Ability: Static
SP:
- HP: 11
- Atk: 11
- Def: 11
- SpA: 11
- SpD: 11
- Spe: 11
Hardy Nature
- Thunderbolt`;

      const { pokemon } = parsePokemonBlock(block, 1);
      expect(pokemon!.level).toBe(50);
    });

    it('should parse custom level', () => {
      const block = `Pikachu
Ability: Static
Level: 100
SP:
- HP: 11
- Atk: 11
- Def: 11
- SpA: 11
- SpD: 11
- Spe: 11
Hardy Nature
- Thunderbolt`;

      const { pokemon } = parsePokemonBlock(block, 1);
      expect(pokemon!.level).toBe(100);
    });
  });

  describe('importTeamFromText', () => {
    it('should parse multiple Pokemon blocks', () => {
      const text = `${VALID_POKEMON_BLOCK}

${MINIMAL_POKEMON_BLOCK}`;

      const result = importTeamFromText(text);

      expect(result.success).toBe(true);
      expect(result.pokemon).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
      expect(result.pokemon[0].species).toBe('charizard');
      expect(result.pokemon[1].species).toBe('pikachu');
    });

    it('should handle empty input', () => {
      const result = importTeamFromText('');
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle whitespace-only input', () => {
      const result = importTeamFromText('   \n\n  \n  ');
      expect(result.success).toBe(false);
    });

    it('should report errors for invalid blocks while parsing valid ones', () => {
      const invalidBlock = `Invalid Pokemon
No ability line here
Just garbage`;

      const text = `${VALID_POKEMON_BLOCK}

${invalidBlock}`;

      const result = importTeamFromText(text);

      expect(result.pokemon.length).toBeGreaterThanOrEqual(1);
      expect(result.errors.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle a full 6-Pokemon team', () => {
      const blocks = Array.from({ length: 6 }, (_, i) => {
        return `Pokemon${i}
Ability: Ability${i}
SP:
- HP: 11
- Atk: 11
- Def: 11
- SpA: 11
- SpD: 11
- Spe: 11
Hardy Nature
- Move 1`;
      });

      const text = blocks.join('\n\n');
      const result = importTeamFromText(text);

      expect(result.success).toBe(true);
      expect(result.pokemon).toHaveLength(6);
    });

    it('should handle blocks separated by multiple blank lines', () => {
      const text = `${VALID_POKEMON_BLOCK}


${MINIMAL_POKEMON_BLOCK}`;

      const result = importTeamFromText(text);
      expect(result.pokemon).toHaveLength(2);
    });
  });
});
