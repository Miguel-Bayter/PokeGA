/**
 * Database Seed Script
 *
 * Populates the database with Pokemon data from PokeAPI
 * Fetches the 186 Pokemon from the Champions roster plus common competitive moves, items, and abilities
 */

import { PrismaClient } from '@prisma/client';
import { fetchPokemon, fetchMove, fetchItem, fetchAbility } from '../../src/lib/pokeapi';
import { CHAMPIONS_ROSTER } from '../../src/data/champions-roster';

const prisma = new PrismaClient();

/**
 * Common competitive moves in Pokemon Champions
 */
const COMPETITIVE_MOVES = [
  // STAB moves
  'flamethrower',
  'fire-blast',
  'hydro-pump',
  'surf',
  'thunderbolt',
  'ice-beam',
  'psychic',
  'shadow-ball',
  'dark-pulse',
  'dragon-pulse',
  'flash-cannon',
  'earth-power',
  'sludge-bomb',
  'energy-ball',
  'air-slash',
  'bug-buzz',
  'stone-edge',
  'iron-head',
  'close-combat',
  'brave-bird',
  'crunch',

  // Coverage moves
  'focus-blast',
  'aura-sphere',
  'grass-knot',
  'thunder',
  'blizzard',
  'heat-wave',
  'ancient-power',
  'rock-slide',
  'earthquake',
  'bulldoze',

  // Status moves
  'protect',
  'substitute',
  'wish-parting-shot',
  'recover',
  'roost',
  'soft-boiled',
  'rest',
  'sleep-talk',
  'calm-mind',
  'nasty-plot',
  'swords-dance',
  'dragon-dance',
  'agility',
  'tailwind',
  'trick-room',

  // Utility moves
  'stealth-rock',
  'spikes',
  'toxic-spikes',
  'rapid-spin',
  'defog',
  'knock-off',
  'uturn',
  'volt-switch',
  'parting-shot',
  'baton-pass',

  // Priority moves
  'extreme-speed',
  'bullet-punch',
  'ice-shard',
  'aqua-jet',
  'mach-punch',
  'sucker-punch',
  'shadow-sneak',
  'priority-move',

  // Status conditions
  'will-o-wisp',
  'thunder-wave',
  'toxic',
  'scald',
  'sleep-powder',
  'spore',
  'hypnosis',
  'glare',
  'stun-spore',
];

/**
 * Common competitive items
 */
const COMPETITIVE_ITEMS = [
  // Choice items
  'choice-band',
  'choice-specs',
  'choice-scarf',

  // Life Orb and damage boosters
  'life-orb',
  'expert-belt',
  'never-melt-ice',
  'charcoal',
  'magnet',
  'miracle-seed',
  'black-belt',
  'poison-barb',
  'soft-sand',
  'sharp-beak',
  'twisted-spoon',
  'silver-powder',
  'hard-stone',
  'spell-tag',
  'dragon-fang',
  'black-glasses',
  'metal-coat',
  'silk-scarf',

  // Defensive items
  'leftovers',
  'rocky-helmet',
  'assault-vest',
  'eviolite',

  // Survival items
  'focus-sash',
  'heavy-duty-boots',

  // Utility items
  'air-balloon',
  'weakness-policy',
  'mental-herb',
  'luminous-moss',
];

/**
 * Common competitive abilities
 */
const COMPETITIVE_ABILITIES = [
  // Weather abilities
  'drizzle',
  'drought',
  'sand-stream',
  'snow-warning',

  // Terrain abilities
  'electric-surge',
  'grassy-surge',
  'misty-surge',
  'psychic-surge',

  // Speed abilities
  'speed-boost',
  'chlorophyll',
  'sand-rush',
  'slush-rush',
  'swift-swim',

  // Defensive abilities
  'intimidate',
  'multiscale',
  'regenerator',
  'thick-fat',
  'flash-fire',
  'water-absorb',
  'volt-absorb',
  'levitate',
  'sturdy',
  'magic-guard',
  'filter',
  'solid-rock',
  'heatproof',
  'dry-skin',

  // Offensive abilities
  'adaptability',
  'protean',
  'beast-boost',
  'moxie',
  'sheer-force',
  'tough-claws',
  'strong-jaw',
  'mega-launcher',
  'iron-fist',

  // Utility abilities
  'prankster',
  'magic-bounce',
  'mold-breaker',
  'teravolt',
  'turboblaze',
  'unaware',
  'contrary',
  'download',
  'analytic',
  'trace',

  // Status abilities
  'poison-heal',
  'toxic-boost',
  'guts',
  'quick-feet',
  'early-bird',
  'hydration',
  'rain-dish',
  'ice-body',
];

async function seedPokemon() {
  console.log('🌱 Seeding Pokemon data...');

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const entry of CHAMPIONS_ROSTER) {
    try {
      // Check if already exists
      const existing = await prisma.pokemon.findUnique({
        where: { id: entry.id },
      });

      if (existing) {
        skipped++;
        continue;
      }

      // Fetch from PokeAPI
      const apiData = await fetchPokemon(entry.name);

      // Extract types
      const types = apiData.types
        .sort((a: { slot: number }, b: { slot: number }) => a.slot - b.slot)
        .map((t: { type: { name: string } }) => t.type.name);

      // Extract base stats
      const stats: Record<string, number> = {};
      for (const stat of apiData.stats) {
        stats[stat.stat.name] = stat.base_stat;
      }

      // Extract abilities
      const abilities = apiData.abilities.map((a: { ability: { name: string } }) => a.ability.name);

      // Get sprite URL
      const spriteUrl =
        apiData.sprites.other?.['official-artwork']?.front_default ||
        apiData.sprites.front_default ||
        null;

      // Create Pokemon record
      await prisma.pokemon.create({
        data: {
          id: apiData.id,
          name: apiData.name,
          types: types.join(','),
          baseStats: JSON.stringify(stats),
          abilities: abilities.join(','),
          isMega: entry.isMega || false,
          megaStone: entry.baseSpecies ? `${entry.baseSpecies}ite` : null,
          generation: getGeneration(apiData.id),
          spriteUrl,
        },
      });

      imported++;
      console.log(`  ✓ ${apiData.name} (${imported}/${CHAMPIONS_ROSTER.length})`);
    } catch (error) {
      errors++;
      console.error(
        `  ✗ Failed to import ${entry.name}:`,
        error instanceof Error ? error.message : error
      );
    }
  }

  console.log(`\nPokemon import complete:`);
  console.log(`  Imported: ${imported}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Errors: ${errors}`);
}

async function seedMoves() {
  console.log('\n🌱 Seeding common competitive moves...');

  let imported = 0;
  let errors = 0;

  for (const moveName of COMPETITIVE_MOVES) {
    try {
      const existing = await prisma.move.findUnique({
        where: { name: moveName },
      });

      if (existing) {
        continue;
      }

      const apiData = await fetchMove(moveName);

      await prisma.move.create({
        data: {
          id: apiData.id,
          name: apiData.name,
          type: apiData.type.name,
          category: apiData.damage_class.name,
          power: apiData.power,
          accuracy: apiData.accuracy,
          pp: apiData.pp,
          priority: apiData.priority,
          effect: apiData.effect_entries[0]?.effect || null,
          shortEffect: apiData.effect_entries[0]?.short_effect || null,
        },
      });

      imported++;
      console.log(`  ✓ ${apiData.name} (${imported}/${COMPETITIVE_MOVES.length})`);
    } catch (error) {
      errors++;
      console.error(
        `  ✗ Failed to import move ${moveName}:`,
        error instanceof Error ? error.message : error
      );
    }
  }

  console.log(`\nMoves import complete:`);
  console.log(`  Imported: ${imported}`);
  console.log(`  Errors: ${errors}`);
}

async function seedItems() {
  console.log('\n🌱 Seeding common competitive items...');

  let imported = 0;
  let errors = 0;

  for (const itemName of COMPETITIVE_ITEMS) {
    try {
      const existing = await prisma.item.findUnique({
        where: { name: itemName },
      });

      if (existing) {
        continue;
      }

      const apiData = await fetchItem(itemName);

      await prisma.item.create({
        data: {
          id: apiData.id,
          name: apiData.name,
          category: apiData.category.name,
          description: apiData.effect_entries[0]?.effect || null,
          effect: apiData.effect_entries[0]?.short_effect || null,
        },
      });

      imported++;
      console.log(`  ✓ ${apiData.name} (${imported}/${COMPETITIVE_ITEMS.length})`);
    } catch (error) {
      errors++;
      console.error(
        `  ✗ Failed to import item ${itemName}:`,
        error instanceof Error ? error.message : error
      );
    }
  }

  console.log(`\nItems import complete:`);
  console.log(`  Imported: ${imported}`);
  console.log(`  Errors: ${errors}`);
}

async function seedAbilities() {
  console.log('\n🌱 Seeding common competitive abilities...');

  let imported = 0;
  let errors = 0;

  for (const abilityName of COMPETITIVE_ABILITIES) {
    try {
      const existing = await prisma.ability.findUnique({
        where: { name: abilityName },
      });

      if (existing) {
        continue;
      }

      const apiData = await fetchAbility(abilityName);

      await prisma.ability.create({
        data: {
          id: apiData.id,
          name: apiData.name,
          effect: apiData.effect_entries[0]?.effect || null,
          shortEffect: apiData.effect_entries[0]?.short_effect || null,
        },
      });

      imported++;
      console.log(`  ✓ ${apiData.name} (${imported}/${COMPETITIVE_ABILITIES.length})`);
    } catch (error) {
      errors++;
      console.error(
        `  ✗ Failed to import ability ${abilityName}:`,
        error instanceof Error ? error.message : error
      );
    }
  }

  console.log(`\nAbilities import complete:`);
  console.log(`  Imported: ${imported}`);
  console.log(`  Errors: ${errors}`);
}

/**
 * Helper function to determine Pokemon generation from ID
 */
function getGeneration(pokemonId: number): number {
  if (pokemonId <= 151) return 1;
  if (pokemonId <= 251) return 2;
  if (pokemonId <= 386) return 3;
  if (pokemonId <= 493) return 4;
  if (pokemonId <= 649) return 5;
  if (pokemonId <= 721) return 6;
  if (pokemonId <= 809) return 7;
  if (pokemonId <= 905) return 8;
  return 9;
}

async function main() {
  console.log('🚀 Starting Pokemon Champions database seed...\n');

  try {
    await seedPokemon();
    await seedMoves();
    await seedItems();
    await seedAbilities();

    console.log('\n✅ Database seed completed successfully!');
  } catch (error) {
    console.error('\n❌ Seed failed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
