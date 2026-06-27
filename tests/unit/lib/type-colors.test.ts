import { describe, it, expect } from 'vitest';
import { getTypeColor, getTypeBadgeClasses } from '@/lib/type-colors';

describe('type-colors utility', () => {
  describe('getTypeColor', () => {
    it('should return bg and text classes for valid types', () => {
      const fireColor = getTypeColor('fire');
      expect(fireColor).toHaveProperty('bg');
      expect(fireColor).toHaveProperty('text');
      expect(fireColor.bg).toContain('bg-');
      expect(fireColor.text).toContain('text-');
    });

    it('should return default colors for unknown types', () => {
      const unknown = getTypeColor('unknown');
      expect(unknown.bg).toBe('bg-neutral-400');
      expect(unknown.text).toBe('text-white');
    });

    it('should return correct colors for all 18 types', () => {
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

      for (const type of types) {
        const color = getTypeColor(type);
        expect(color.bg).toBeTruthy();
        expect(color.text).toBeTruthy();
      }
    });
  });

  describe('getTypeBadgeClasses', () => {
    it('should return badge classes for valid types', () => {
      const classes = getTypeBadgeClasses('fire');
      expect(classes).toContain('badge');
      expect(classes).toContain('badge-sm');
    });

    it('should return default badge for unknown types', () => {
      const classes = getTypeBadgeClasses('unknown');
      expect(classes).toContain('badge');
      expect(classes).toContain('badge-neutral');
    });
  });
});
