'use server';

import { prisma } from '@/lib/prisma';
import type { PokemonType } from '@/lib/type-chart';

interface ActionResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PokemonListItem {
  id: number;
  name: string;
  types: PokemonType[];
  spriteUrl: string | null;
  isMega: boolean;
  abilities: string[];
}

export interface ItemListItem {
  id: number;
  name: string;
  category: string;
  description: string | null;
}

export interface MoveListItem {
  id: number;
  name: string;
  type: string;
  category: string;
  power: number | null;
  accuracy: number | null;
  pp: number | null;
}

export interface AbilityListItem {
  id: number;
  name: string;
  shortEffect: string | null;
}

function parseTypes(typesStr: string): PokemonType[] {
  return typesStr.split(',').map((t) => t.trim()) as PokemonType[];
}

function parseAbilities(abilitiesStr: string): string[] {
  return abilitiesStr.split(',').map((a) => a.trim());
}

export async function getPokemonListAction(
  search?: string,
  typeFilter?: PokemonType
): Promise<ActionResponse<PokemonListItem[]>> {
  try {
    const where: Record<string, unknown> = {};

    if (search) {
      where.name = { contains: search.toLowerCase() };
    }

    if (typeFilter) {
      where.types = { contains: typeFilter };
    }

    const pokemon = await prisma.pokemon.findMany({
      where,
      orderBy: { id: 'asc' },
      take: 50,
    });

    const result: PokemonListItem[] = pokemon.map((p) => ({
      id: p.id,
      name: p.name,
      types: parseTypes(p.types),
      spriteUrl: p.spriteUrl,
      isMega: p.isMega,
      abilities: parseAbilities(p.abilities),
    }));

    return { success: true, data: result };
  } catch (error) {
    console.error('getPokemonListAction error:', error);
    return { success: false, error: 'Failed to fetch Pokemon list' };
  }
}

export async function getItemsAction(): Promise<ActionResponse<ItemListItem[]>> {
  try {
    const items = await prisma.item.findMany({
      orderBy: { name: 'asc' },
    });

    const result: ItemListItem[] = items.map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      description: item.description,
    }));

    return { success: true, data: result };
  } catch (error) {
    console.error('getItemsAction error:', error);
    return { success: false, error: 'Failed to fetch items' };
  }
}

export async function getMovesAction(search?: string): Promise<ActionResponse<MoveListItem[]>> {
  try {
    const where: Record<string, unknown> = {};

    if (search) {
      where.name = { contains: search.toLowerCase() };
    }

    const moves = await prisma.move.findMany({
      where,
      orderBy: { name: 'asc' },
      take: 100,
    });

    const result: MoveListItem[] = moves.map((m) => ({
      id: m.id,
      name: m.name,
      type: m.type,
      category: m.category,
      power: m.power,
      accuracy: m.accuracy,
      pp: m.pp,
    }));

    return { success: true, data: result };
  } catch (error) {
    console.error('getMovesAction error:', error);
    return { success: false, error: 'Failed to fetch moves' };
  }
}

export async function getAbilitiesAction(
  pokemonId: number
): Promise<ActionResponse<AbilityListItem[]>> {
  try {
    const pokemon = await prisma.pokemon.findUnique({
      where: { id: pokemonId },
    });

    if (!pokemon) {
      return { success: false, error: 'Pokemon not found' };
    }

    const abilityNames = parseAbilities(pokemon.abilities);

    const abilities = await prisma.ability.findMany({
      where: {
        name: { in: abilityNames },
      },
    });

    const result: AbilityListItem[] = abilities.map((a) => ({
      id: a.id,
      name: a.name,
      shortEffect: a.shortEffect,
    }));

    return { success: true, data: result };
  } catch (error) {
    console.error('getAbilitiesAction error:', error);
    return { success: false, error: 'Failed to fetch abilities' };
  }
}
