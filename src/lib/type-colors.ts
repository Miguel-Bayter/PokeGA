import type { PokemonType } from '@/lib/type-chart';

const TYPE_COLOR_MAP: Record<PokemonType, { bg: string; text: string; badge: string }> = {
  normal: { bg: 'bg-neutral-400', text: 'text-white', badge: 'badge-neutral' },
  fire: { bg: 'bg-red-500', text: 'text-white', badge: 'badge-error' },
  water: { bg: 'bg-blue-500', text: 'text-white', badge: 'badge-info' },
  electric: { bg: 'bg-yellow-400', text: 'text-black', badge: 'badge-warning' },
  grass: { bg: 'bg-green-500', text: 'text-white', badge: 'badge-success' },
  ice: { bg: 'bg-cyan-300', text: 'text-black', badge: 'badge-info' },
  fighting: { bg: 'bg-orange-700', text: 'text-white', badge: 'badge-error' },
  poison: { bg: 'bg-purple-500', text: 'text-white', badge: 'badge-secondary' },
  ground: { bg: 'bg-amber-600', text: 'text-white', badge: 'badge-neutral' },
  flying: { bg: 'bg-indigo-300', text: 'text-black', badge: 'badge-primary' },
  psychic: { bg: 'bg-pink-500', text: 'text-white', badge: 'badge-secondary' },
  bug: { bg: 'bg-lime-500', text: 'text-black', badge: 'badge-success' },
  rock: { bg: 'bg-yellow-700', text: 'text-white', badge: 'badge-neutral' },
  ghost: { bg: 'bg-purple-700', text: 'text-white', badge: 'badge-secondary' },
  dragon: { bg: 'bg-indigo-600', text: 'text-white', badge: 'badge-primary' },
  dark: { bg: 'bg-gray-800', text: 'text-white', badge: 'badge-neutral' },
  steel: { bg: 'bg-gray-400', text: 'text-black', badge: 'badge-neutral' },
  fairy: { bg: 'bg-pink-300', text: 'text-black', badge: 'badge-accent' },
};

export function getTypeColor(type: string): { bg: string; text: string } {
  const colors = TYPE_COLOR_MAP[type as PokemonType];
  if (!colors) return { bg: 'bg-neutral-400', text: 'text-white' };
  return { bg: colors.bg, text: colors.text };
}

export function getTypeBadgeClasses(type: string): string {
  const colors = TYPE_COLOR_MAP[type as PokemonType];
  if (!colors) return 'badge badge-neutral';
  return `badge ${colors.badge} badge-sm`;
}

export function getTypeTypeColorMap(): Record<
  PokemonType,
  { bg: string; text: string; badge: string }
> {
  return { ...TYPE_COLOR_MAP };
}
