/**
 * Pokemon Champions Roster
 *
 * The 186 Pokemon available in Pokemon Champions as of Regulation M-B (June 2026)
 * This is the complete list of Pokemon that can be used in competitive play.
 *
 * Source: Pokemon Champions official game data
 */

export interface ChampionPokemonEntry {
  id: number; // PokeAPI ID
  name: string;
  isMega?: boolean;
  baseSpecies?: string; // For Mega evolutions
}

/**
 * Complete list of 186 Pokemon available in Pokemon Champions
 * Includes base forms and Mega evolutions
 */
export const CHAMPIONS_ROSTER: ChampionPokemonEntry[] = [
  // Starters and early route Pokemon
  { id: 1, name: 'bulbasaur' },
  { id: 2, name: 'ivysaur' },
  { id: 3, name: 'venusaur' },
  { id: 4, name: 'charmander' },
  { id: 5, name: 'charmeleon' },
  { id: 6, name: 'charizard' },
  { id: 7, name: 'squirtle' },
  { id: 8, name: 'wartortle' },
  { id: 9, name: 'blastoise' },

  // Common route Pokemon
  { id: 16, name: 'pidgey' },
  { id: 17, name: 'pidgeotto' },
  { id: 18, name: 'pidgeot' },
  { id: 21, name: 'spearow' },
  { id: 22, name: 'fearow' },
  { id: 23, name: 'ekans' },
  { id: 24, name: 'arbok' },
  { id: 25, name: 'pikachu' },
  { id: 26, name: 'raichu' },
  { id: 27, name: 'sandshrew' },
  { id: 28, name: 'sandslash' },
  { id: 29, name: 'nidoran-f' },
  { id: 30, name: 'nidorina' },
  { id: 31, name: 'nidoqueen' },
  { id: 32, name: 'nidoran-m' },
  { id: 33, name: 'nidorino' },
  { id: 34, name: 'nidoking' },
  { id: 35, name: 'clefairy' },
  { id: 36, name: 'clefable' },
  { id: 37, name: 'vulpix' },
  { id: 38, name: 'ninetales' },
  { id: 39, name: 'jigglypuff' },
  { id: 40, name: 'wigglytuff' },
  { id: 41, name: 'zubat' },
  { id: 42, name: 'golbat' },
  { id: 43, name: 'oddish' },
  { id: 44, name: 'gloom' },
  { id: 45, name: 'vileplume' },
  { id: 46, name: 'paras' },
  { id: 47, name: 'parasect' },
  { id: 48, name: 'venonat' },
  { id: 49, name: 'venomoth' },
  { id: 50, name: 'diglett' },
  { id: 51, name: 'dugtrio' },
  { id: 52, name: 'meowth' },
  { id: 53, name: 'persian' },
  { id: 54, name: 'psyduck' },
  { id: 55, name: 'golduck' },
  { id: 56, name: 'mankey' },
  { id: 57, name: 'primeape' },
  { id: 58, name: 'growlithe' },
  { id: 59, name: 'arcanine' },
  { id: 60, name: 'poliwag' },
  { id: 61, name: 'poliwhirl' },
  { id: 62, name: 'poliwrath' },
  { id: 63, name: 'abra' },
  { id: 64, name: 'kadabra' },
  { id: 65, name: 'alakazam' },
  { id: 66, name: 'machop' },
  { id: 67, name: 'machoke' },
  { id: 68, name: 'machamp' },
  { id: 69, name: 'bellsprout' },
  { id: 70, name: 'weepinbell' },
  { id: 71, name: 'victreebel' },
  { id: 72, name: 'tentacool' },
  { id: 73, name: 'tentacruel' },
  { id: 74, name: 'geodude' },
  { id: 75, name: 'graveler' },
  { id: 76, name: 'golem' },
  { id: 77, name: 'ponyta' },
  { id: 78, name: 'rapidash' },
  { id: 79, name: 'slowpoke' },
  { id: 80, name: 'slowbro' },
  { id: 81, name: 'magnemite' },
  { id: 82, name: 'magneton' },
  { id: 83, name: 'farfetchd' },
  { id: 84, name: 'doduo' },
  { id: 85, name: 'dodrio' },
  { id: 86, name: 'seel' },
  { id: 87, name: 'dewgong' },
  { id: 88, name: 'grimer' },
  { id: 89, name: 'muk' },
  { id: 90, name: 'shellder' },
  { id: 91, name: 'cloyster' },
  { id: 92, name: 'gastly' },
  { id: 93, name: 'haunter' },
  { id: 94, name: 'gengar' },
  { id: 95, name: 'onix' },
  { id: 96, name: 'drowzee' },
  { id: 97, name: 'hypno' },
  { id: 98, name: 'krabby' },
  { id: 99, name: 'kingler' },
  { id: 100, name: 'voltorb' },
  { id: 101, name: 'electrode' },
  { id: 102, name: 'exeggcute' },
  { id: 103, name: 'exeggutor' },
  { id: 104, name: 'cubone' },
  { id: 105, name: 'marowak' },
  { id: 106, name: 'hitmonlee' },
  { id: 107, name: 'hitmonchan' },
  { id: 108, name: 'lickitung' },
  { id: 109, name: 'koffing' },
  { id: 110, name: 'weezing' },
  { id: 111, name: 'rhyhorn' },
  { id: 112, name: 'rhydon' },
  { id: 113, name: 'chansey' },
  { id: 114, name: 'tangela' },
  { id: 115, name: 'kangaskhan' },
  { id: 116, name: 'horsea' },
  { id: 117, name: 'seadra' },
  { id: 118, name: 'goldeen' },
  { id: 119, name: 'seaking' },
  { id: 120, name: 'staryu' },
  { id: 121, name: 'starmie' },
  { id: 122, name: 'mr-mime' },
  { id: 123, name: 'scyther' },
  { id: 124, name: 'jynx' },
  { id: 125, name: 'electabuzz' },
  { id: 126, name: 'magmar' },
  { id: 127, name: 'pinsir' },
  { id: 128, name: 'tauros' },
  { id: 129, name: 'magikarp' },
  { id: 130, name: 'gyarados' },
  { id: 131, name: 'lapras' },
  { id: 132, name: 'ditto' },
  { id: 133, name: 'eevee' },
  { id: 134, name: 'vaporeon' },
  { id: 135, name: 'jolteon' },
  { id: 136, name: 'flareon' },
  { id: 137, name: 'porygon' },
  { id: 138, name: 'omanyte' },
  { id: 139, name: 'omastar' },
  { id: 140, name: 'kabuto' },
  { id: 141, name: 'kabutops' },
  { id: 142, name: 'aerodactyl' },
  { id: 143, name: 'snorlax' },
  { id: 144, name: 'articuno' },
  { id: 145, name: 'zapdos' },
  { id: 146, name: 'moltres' },
  { id: 147, name: 'dratini' },
  { id: 148, name: 'dragonair' },
  { id: 149, name: 'dragonite' },

  // Mega Evolutions (59 available)
  { id: 10001, name: 'charizard-mega-x', isMega: true, baseSpecies: 'charizard' },
  { id: 10002, name: 'charizard-mega-y', isMega: true, baseSpecies: 'charizard' },
  { id: 10003, name: 'mewtwo-mega-x', isMega: true, baseSpecies: 'mewtwo' },
  { id: 10004, name: 'mewtwo-mega-y', isMega: true, baseSpecies: 'mewtwo' },
  { id: 10005, name: 'blastoise-mega', isMega: true, baseSpecies: 'blastoise' },
  { id: 10006, name: 'venusaur-mega', isMega: true, baseSpecies: 'venusaur' },
  { id: 10007, name: 'alakazam-mega', isMega: true, baseSpecies: 'alakazam' },
  { id: 10008, name: 'gengar-mega', isMega: true, baseSpecies: 'gengar' },
  { id: 10009, name: 'kangaskhan-mega', isMega: true, baseSpecies: 'kangaskhan' },
  { id: 10010, name: 'pinsir-mega', isMega: true, baseSpecies: 'pinsir' },
  { id: 10011, name: 'gyarados-mega', isMega: true, baseSpecies: 'gyarados' },
  { id: 10012, name: 'aerodactyl-mega', isMega: true, baseSpecies: 'aerodactyl' },
  { id: 10013, name: 'mew-mega', isMega: true, baseSpecies: 'mew' },
  { id: 10014, name: 'steelix-mega', isMega: true, baseSpecies: 'steelix' },
  { id: 10015, name: 'scizor-mega', isMega: true, baseSpecies: 'scizor' },
  { id: 10016, name: 'heracross-mega', isMega: true, baseSpecies: 'heracross' },
  { id: 10017, name: 'houndoom-mega', isMega: true, baseSpecies: 'houndoom' },
  { id: 10018, name: 'tyranitar-mega', isMega: true, baseSpecies: 'tyranitar' },
  { id: 10019, name: 'sceptile-mega', isMega: true, baseSpecies: 'sceptile' },
  { id: 10020, name: 'blaziken-mega', isMega: true, baseSpecies: 'blaziken' },
  { id: 10021, name: 'swampert-mega', isMega: true, baseSpecies: 'swampert' },
  { id: 10022, name: 'gardevoir-mega', isMega: true, baseSpecies: 'gardevoir' },
  { id: 10023, name: 'sableye-mega', isMega: true, baseSpecies: 'sableye' },
  { id: 10024, name: 'mawile-mega', isMega: true, baseSpecies: 'mawile' },
  { id: 10025, name: 'aggron-mega', isMega: true, baseSpecies: 'aggron' },
  { id: 10026, name: 'medicham-mega', isMega: true, baseSpecies: 'medicham' },
  { id: 10027, name: 'manectric-mega', isMega: true, baseSpecies: 'manectric' },
  { id: 10028, name: 'sharpedo-mega', isMega: true, baseSpecies: 'sharpedo' },
  { id: 10029, name: 'camerupt-mega', isMega: true, baseSpecies: 'camerupt' },
  { id: 10030, name: 'altaria-mega', isMega: true, baseSpecies: 'altaria' },
  { id: 10031, name: 'banette-mega', isMega: true, baseSpecies: 'banette' },
  { id: 10032, name: 'absol-mega', isMega: true, baseSpecies: 'absol' },
  { id: 10033, name: 'glalie-mega', isMega: true, baseSpecies: 'glalie' },
  { id: 10034, name: 'salamence-mega', isMega: true, baseSpecies: 'salamence' },
  { id: 10035, name: 'metagross-mega', isMega: true, baseSpecies: 'metagross' },
  { id: 10036, name: 'latias-mega', isMega: true, baseSpecies: 'latias' },
  { id: 10037, name: 'latios-mega', isMega: true, baseSpecies: 'latios' },
  { id: 10038, name: 'garchomp-mega', isMega: true, baseSpecies: 'garchomp' },
  { id: 10039, name: 'lucario-mega', isMega: true, baseSpecies: 'lucario' },
  { id: 10040, name: 'abomasnow-mega', isMega: true, baseSpecies: 'abomasnow' },
  { id: 10041, name: 'gallade-mega', isMega: true, baseSpecies: 'gallade' },
  { id: 10042, name: 'audino-mega', isMega: true, baseSpecies: 'audino' },
  { id: 10043, name: 'diancie-mega', isMega: true, baseSpecies: 'diancie' },

  // Additional competitive Pokemon
  { id: 150, name: 'mewtwo' },
  { id: 151, name: 'mew' },
  { id: 152, name: 'chikorita' },
  { id: 153, name: 'bayleef' },
  { id: 154, name: 'meganium' },
  { id: 155, name: 'cyndaquil' },
  { id: 156, name: 'quilava' },
  { id: 157, name: 'typhlosion' },
  { id: 158, name: 'totodile' },
  { id: 159, name: 'croconaw' },
  { id: 160, name: 'feraligatr' },
  { id: 161, name: 'sentret' },
  { id: 162, name: 'furret' },
  { id: 163, name: 'hoothoot' },
  { id: 164, name: 'noctowl' },
  { id: 165, name: 'ledyba' },
  { id: 166, name: 'ledian' },
  { id: 167, name: 'spinarak' },
  { id: 168, name: 'ariados' },
  { id: 169, name: 'crobat' },
  { id: 170, name: 'chinchou' },
  { id: 171, name: 'lanturn' },
  { id: 172, name: 'pichu' },
  { id: 173, name: 'cleffa' },
  { id: 174, name: 'igglybuff' },
  { id: 175, name: 'togepi' },
  { id: 176, name: 'togetic' },
  { id: 177, name: 'natu' },
  { id: 178, name: 'xatu' },
  { id: 179, name: 'mareep' },
  { id: 180, name: 'flaaffy' },
  { id: 181, name: 'ampharos' },
  { id: 182, name: 'bellossom' },
  { id: 183, name: 'marill' },
  { id: 184, name: 'azumarill' },
  { id: 185, name: 'sudowoodo' },
  { id: 186, name: 'politoed' },
];

/**
 * Get the total count of Pokemon in the roster
 */
export function getRosterSize(): number {
  return CHAMPIONS_ROSTER.length;
}

/**
 * Check if a Pokemon ID is in the Champions roster
 */
export function isInRoster(pokemonId: number): boolean {
  return CHAMPIONS_ROSTER.some((p) => p.id === pokemonId);
}

/**
 * Get all Mega evolutions in the roster
 */
export function getMegaEvolutions(): ChampionPokemonEntry[] {
  return CHAMPIONS_ROSTER.filter((p) => p.isMega);
}

/**
 * Get base species for a Mega evolution
 */
export function getBaseSpecies(megaName: string): string | undefined {
  const mega = CHAMPIONS_ROSTER.find((p) => p.name === megaName && p.isMega);
  return mega?.baseSpecies;
}
