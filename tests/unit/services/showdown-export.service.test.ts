/**
 * Unit Tests for Showdown Export Service
 */

import { describe, it, expect } from 'vitest';
import {
  exportTeamToText,
  exportMemberToText,
  getNatureEffect,
  type PokemonData,
  type TeamWithMembers,
} from '@/server/services/showdown-export.service';

function makePokemon(overrides: Partial<PokemonData> = {}): PokemonData {
  return {
    species: 'charizard',
    ability: 'blaze',
    nature: 'timid',
    statPoints: { hp: 10, atk: 0, def: 12, spAtk: 28, spDef: 6, spd: 10 },
    moves: ['flamethrower', 'air-slash', 'dragon-pulse', 'roost'],
    isMega: false,
    ...overrides,
  };
}

describe('ShowdownExportService', () => {
  describe('exportMemberToText', () => {
    it('should export a Pokemon with all fields populated', () => {
      const pokemon = makePokemon({
        nickname: 'Blaze',
        species: 'charizard',
        item: 'charizardite-y',
        ability: 'blaze',
        teraType: 'fire',
        level: 50,
        isMega: true,
        nature: 'timid',
        statPoints: { hp: 10, atk: 0, def: 12, spAtk: 28, spDef: 6, spd: 10 },
        moves: ['flamethrower', 'air-slash', 'dragon-pulse', 'roost'],
      });

      const text = exportMemberToText(pokemon);

      expect(text).toContain('Blaze (Charizard) @ Charizardite Y');
      expect(text).toContain('Ability: Blaze');
      expect(text).toContain('Tera Type: Fire');
      expect(text).toContain('Level: 50');
      expect(text).toContain('Mega: Yes');
      expect(text).toContain('SP:');
      expect(text).toContain('- HP: 10');
      expect(text).toContain('- Spe+: 10');
      expect(text).toContain('- Atk-: 0');
      expect(text).toContain('Timid Nature (+Spe, -Atk)');
      expect(text).toContain('- Flamethrower');
      expect(text).toContain('- Air Slash');
      expect(text).toContain('- Dragon Pulse');
      expect(text).toContain('- Roost');
    });

    it('should export a Pokemon with minimal fields (no item, no tera, no mega)', () => {
      const pokemon = makePokemon({
        species: 'pikachu',
        ability: 'static',
        nature: 'jolly',
        statPoints: { hp: 11, atk: 11, def: 11, spAtk: 11, spDef: 11, spd: 11 },
        moves: ['thunderbolt'],
      });

      const text = exportMemberToText(pokemon);

      expect(text).toContain('Pikachu');
      expect(text).not.toContain('@');
      expect(text).not.toContain('Tera Type');
      expect(text).not.toContain('Mega');
      expect(text).toContain('Ability: Static');
      expect(text).toContain('Level: 50');
      expect(text).toContain('Jolly Nature (+Spe, -SpA)');
      expect(text).toContain('- Spe+: 11');
      expect(text).toContain('- SpA-: 11');
    });

    it('should handle neutral nature without stat modifiers', () => {
      const pokemon = makePokemon({
        nature: 'hardy',
        statPoints: { hp: 11, atk: 11, def: 11, spAtk: 11, spDef: 11, spd: 11 },
      });

      const text = exportMemberToText(pokemon);

      expect(text).toContain('Hardy Nature');
      expect(text).not.toContain('+');
      expect(text).not.toContain('-:');
    });

    it('should format species names with hyphens correctly', () => {
      const pokemon = makePokemon({ species: 'mr-mime' });
      const text = exportMemberToText(pokemon);
      expect(text).toContain('Mr-Mime');
    });

    it('should format move names with spaces', () => {
      const pokemon = makePokemon({ moves: ['fire-blast', 'ice-beam'] });
      const text = exportMemberToText(pokemon);
      expect(text).toContain('- Fire Blast');
      expect(text).toContain('- Ice Beam');
    });

    it('should handle all nature stat modifications', () => {
      const natures: Array<{ nature: string; expectedPlus: string; expectedMinus: string }> = [
        { nature: 'adamant', expectedPlus: 'Atk', expectedMinus: 'SpA' },
        { nature: 'modest', expectedPlus: 'SpA', expectedMinus: 'Atk' },
        { nature: 'jolly', expectedPlus: 'Spe', expectedMinus: 'SpA' },
        { nature: 'calm', expectedPlus: 'SpD', expectedMinus: 'Atk' },
        { nature: 'bold', expectedPlus: 'Def', expectedMinus: 'Atk' },
      ];

      for (const { nature, expectedPlus, expectedMinus } of natures) {
        const pokemon = makePokemon({
          nature,
          statPoints: { hp: 11, atk: 11, def: 11, spAtk: 11, spDef: 11, spd: 11 },
        });
        const text = exportMemberToText(pokemon);
        expect(text).toContain(`+${expectedPlus}`);
        expect(text).toContain(`-${expectedMinus}`);
      }
    });
  });

  describe('exportTeamToText', () => {
    it('should export a team with multiple Pokemon separated by blank lines', () => {
      const team: TeamWithMembers = {
        name: 'Test Team',
        members: [
          makePokemon({ species: 'charizard', ability: 'blaze' }),
          makePokemon({ species: 'blastoise', ability: 'torrent' }),
          makePokemon({ species: 'venusaur', ability: 'overgrow' }),
        ],
      };

      const text = exportTeamToText(team);

      expect(text).toContain('Charizard');
      expect(text).toContain('Blastoise');
      expect(text).toContain('Venusaur');

      const blocks = text.split('\n\n');
      expect(blocks.length).toBe(3);
    });

    it('should handle a single Pokemon team', () => {
      const team: TeamWithMembers = {
        name: 'Solo',
        members: [makePokemon()],
      };

      const text = exportTeamToText(team);
      expect(text).toContain('Charizard');
      expect(text).not.toContain('\n\n');
    });
  });

  describe('getNatureEffect', () => {
    it('should return plus/minus for boosting natures', () => {
      const effect = getNatureEffect('adamant');
      expect(effect.plus).toBe('atk');
      expect(effect.minus).toBe('spAtk');
    });

    it('should return null/null for neutral natures', () => {
      const effect = getNatureEffect('hardy');
      expect(effect.plus).toBeNull();
      expect(effect.minus).toBeNull();
    });

    it('should be case-insensitive', () => {
      const effect = getNatureEffect('TIMID');
      expect(effect.plus).toBe('spd');
      expect(effect.minus).toBe('atk');
    });

    it('should return null/null for unknown natures', () => {
      const effect = getNatureEffect('unknown-nature');
      expect(effect.plus).toBeNull();
      expect(effect.minus).toBeNull();
    });
  });
});
