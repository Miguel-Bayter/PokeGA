/**
 * PokeAPI Client
 *
 * Fetches Pokemon data from the public PokeAPI (https://pokeapi.co/)
 * Implements rate limiting and caching to be respectful to the API
 */

export interface PokeAPIPokemon {
  id: number;
  name: string;
  height: number;
  weight: number;
  types: Array<{
    slot: number;
    type: {
      name: string;
      url: string;
    };
  }>;
  stats: Array<{
    base_stat: number;
    effort: number;
    stat: {
      name: string;
      url: string;
    };
  }>;
  abilities: Array<{
    ability: {
      name: string;
      url: string;
    };
    is_hidden: boolean;
    slot: number;
  }>;
  sprites: {
    front_default: string | null;
    other?: {
      'official-artwork'?: {
        front_default: string | null;
      };
    };
  };
}

export interface PokeAPIMove {
  id: number;
  name: string;
  type: {
    name: string;
    url: string;
  };
  damage_class: {
    name: string;
    url: string;
  };
  power: number | null;
  accuracy: number | null;
  pp: number | null;
  priority: number;
  effect_entries: Array<{
    effect: string;
    short_effect: string;
    language: {
      name: string;
      url: string;
    };
  }>;
}

export interface PokeAPIItem {
  id: number;
  name: string;
  category: {
    name: string;
    url: string;
  };
  effect_entries: Array<{
    effect: string;
    short_effect: string;
    language: {
      name: string;
      url: string;
    };
  }>;
}

export interface PokeAPIAbility {
  id: number;
  name: string;
  effect_entries: Array<{
    effect: string;
    short_effect: string;
    language: {
      name: string;
      url: string;
    };
  }>;
}

const BASE_URL = 'https://pokeapi.co/api/v2';

// Rate limiting: 100ms between requests to be respectful
const RATE_LIMIT_DELAY = 100;

/**
 * Sleep for a specified duration
 */
async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch a Pokemon by ID or name
 */
export async function fetchPokemon(idOrName: string | number): Promise<PokeAPIPokemon> {
  await sleep(RATE_LIMIT_DELAY);

  const response = await fetch(`${BASE_URL}/pokemon/${idOrName}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch Pokemon ${idOrName}: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch a move by ID or name
 */
export async function fetchMove(idOrName: string | number): Promise<PokeAPIMove> {
  await sleep(RATE_LIMIT_DELAY);

  const response = await fetch(`${BASE_URL}/move/${idOrName}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch move ${idOrName}: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch an item by ID or name
 */
export async function fetchItem(idOrName: string | number): Promise<PokeAPIItem> {
  await sleep(RATE_LIMIT_DELAY);

  const response = await fetch(`${BASE_URL}/item/${idOrName}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch item ${idOrName}: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch an ability by ID or name
 */
export async function fetchAbility(idOrName: string | number): Promise<PokeAPIAbility> {
  await sleep(RATE_LIMIT_DELAY);

  const response = await fetch(`${BASE_URL}/ability/${idOrName}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch ability ${idOrName}: ${response.statusText}`);
  }

  return response.json();
}
