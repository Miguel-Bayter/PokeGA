import { POKEMON_TYPES, TYPE_CHART, type PokemonType } from '@/lib/type-chart';
import type { TeamPokemonData, SynergyAnalysis, TypeCore } from './types';

interface CoreDefinition {
  name: string;
  types: PokemonType[];
  description: string;
}

const KNOWN_CORES: CoreDefinition[] = [
  {
    name: 'Fire-Water-Grass',
    types: ['fire', 'water', 'grass'],
    description:
      "Classic starter core. Each type covers the others' weaknesses: Water resists Fire's weaknesses, Grass covers Water's Electric weakness, Fire covers Grass's Ice weakness.",
  },
  {
    name: 'Steel-Dragon-Fairy',
    types: ['steel', 'dragon', 'fairy'],
    description:
      "Powerful offensive core. Steel covers Fairy's Poison/Steel weakness, Fairy covers Dragon's weakness to Fairy-type moves, Dragon provides strong neutral coverage.",
  },
  {
    name: 'Water-Ground-Electric',
    types: ['water', 'ground', 'electric'],
    description:
      "Electric coverage core. Ground covers Electric's Ground weakness, Water covers Ground's Grass/Ice weakness, Electric covers Water's Grass weakness.",
  },
  {
    name: 'Fire-Flying-Bug',
    types: ['fire', 'flying', 'bug'],
    description:
      "Bug-Fire synergy. Fire covers Bug's Rock/Fire/Flying weaknesses, Flying provides Ground immunity, Bug covers Fire with supplementary offense.",
  },
  {
    name: 'Dark-Ghost-Fighting',
    types: ['dark', 'ghost', 'fighting'],
    description:
      "Offensive pressure core. Fighting covers Dark's weakness to Fighting/Fairy, Ghost provides immunity to Normal/Fighting, Dark covers Ghost's Dark weakness.",
  },
  {
    name: 'Ice-Fire-Steel',
    types: ['ice', 'fire', 'steel'],
    description:
      "Defensive triangle. Steel resists Ice's weaknesses to Fire/Fighting/Steel/Rock, Fire covers Steel's Ground/Fire weakness, Ice provides coverage against Ground/Dragon/Flying.",
  },
  {
    name: 'Psychic-Dark-Fighting',
    types: ['psychic', 'dark', 'fighting'],
    description:
      "Fighting-Psychic-Dark triangle. Dark covers Psychic's weakness to Dark/Ghost/Bug, Fighting covers Dark's weakness to Fighting/Bug/Fairy, Psychic covers Fighting's weakness to Psychic/Flying/Fairy.",
  },
  {
    name: 'Poison-Grass-Steel',
    types: ['poison', 'grass', 'steel'],
    description:
      "Defensive core. Steel resists Poison's weaknesses to Ground/Psychic, Grass covers Steel's Fire/Ground weakness, Poison covers Grass's weakness to Fire/Ice/Flying/Psychic.",
  },
];

/**
 * Detects type cores and synergies within a team.
 *
 * Algorithm:
 * 1. Check if team contains known core type combinations
 * 2. Calculate synergy score based on number of cores and type coverage
 * 3. Identify type triangles that cover each other's weaknesses
 * 4. Calculate type coverage (how many of 18 types are covered)
 */
export class SynergyDetectorService {
  /**
   * Analyze type synergy for a team.
   *
   * @param team - Array of Pokemon with their types
   * @returns Synergy analysis with detected cores and scoring
   */
  analyze(team: TeamPokemonData[]): SynergyAnalysis {
    if (team.length === 0) {
      return this.emptyResult();
    }

    const teamTypes = new Set<PokemonType>();
    for (const pokemon of team) {
      for (const type of pokemon.types) {
        teamTypes.add(type);
      }
    }

    const cores = this.detectCores(team, teamTypes);
    const typeCoverage = teamTypes.size;
    const synergyScore = this.calculateSynergyScore(cores, teamTypes);
    const recommendations = this.generateRecommendations(cores, teamTypes);

    return {
      cores,
      synergyScore,
      typeCoverage,
      recommendations,
    };
  }

  private detectCores(team: TeamPokemonData[], teamTypes: Set<PokemonType>): TypeCore[] {
    const detectedCores: TypeCore[] = [];

    for (const coreDef of KNOWN_CORES) {
      const matchedTypes = coreDef.types.filter((t) => teamTypes.has(t));
      if (matchedTypes.length >= 2) {
        const contributingPokemon: string[] = [];

        for (const pokemon of team) {
          const hasCoreType = pokemon.types.some((t) => coreDef.types.includes(t));
          if (hasCoreType) {
            contributingPokemon.push(pokemon.name);
          }
        }

        detectedCores.push({
          name: coreDef.name,
          types: coreDef.types,
          pokemon: contributingPokemon,
          description: coreDef.description,
        });
      }
    }

    const triangleCores = this.findTriangleCores(team, teamTypes, detectedCores);
    detectedCores.push(...triangleCores);

    return detectedCores;
  }

  private findTriangleCores(
    team: TeamPokemonData[],
    teamTypes: Set<PokemonType>,
    existingCores: TypeCore[]
  ): TypeCore[] {
    const triangles: TypeCore[] = [];
    const existingNames = new Set(existingCores.map((c) => c.name));
    const typesArray = Array.from(teamTypes);

    for (let i = 0; i < typesArray.length; i++) {
      for (let j = i + 1; j < typesArray.length; j++) {
        for (let k = j + 1; k < typesArray.length; k++) {
          const typeA = typesArray[i];
          const typeB = typesArray[j];
          const typeC = typesArray[k];

          if (this.isDefensiveTriangle(typeA, typeB, typeC)) {
            const name = `${typeA}-${typeB}-${typeC}`;
            if (existingNames.has(name)) continue;

            const contributingPokemon: string[] = [];
            for (const pokemon of team) {
              const contributes = pokemon.types.some(
                (t) => t === typeA || t === typeB || t === typeC
              );
              if (contributes) {
                contributingPokemon.push(pokemon.name);
              }
            }

            triangles.push({
              name,
              types: [typeA, typeB, typeC],
              pokemon: contributingPokemon,
              description: `Defensive triangle: ${typeA}, ${typeB}, and ${typeC} cover each other's weaknesses.`,
            });
          }
        }
      }
    }

    return triangles.slice(0, 3);
  }

  private isDefensiveTriangle(typeA: PokemonType, typeB: PokemonType, typeC: PokemonType): boolean {
    const aCoversB = this.coversWeakness(typeA, typeB);
    const bCoversC = this.coversWeakness(typeB, typeC);
    const cCoversA = this.coversWeakness(typeC, typeA);

    return aCoversB && bCoversC && cCoversA;
  }

  private coversWeakness(coverType: PokemonType, protectedType: PokemonType): boolean {
    for (const atkType of POKEMON_TYPES) {
      const effectivenessAgainstProtected = TYPE_CHART[atkType][protectedType];
      if (effectivenessAgainstProtected >= 2) {
        const effectivenessFromCover = TYPE_CHART[atkType][coverType];
        if (effectivenessFromCover <= 0.5) {
          return true;
        }
      }
    }
    return false;
  }

  private calculateSynergyScore(cores: TypeCore[], teamTypes: Set<PokemonType>): number {
    let score = 0;

    const fullCores = cores.filter((c) => c.types.every((t) => teamTypes.has(t as PokemonType)));
    score += fullCores.length * 20;

    const partialCores = cores.filter(
      (c) => !c.types.every((t) => teamTypes.has(t as PokemonType))
    );
    score += partialCores.length * 10;

    const coverageBonus = Math.round((teamTypes.size / POKEMON_TYPES.length) * 30);
    score += coverageBonus;

    return Math.min(100, score);
  }

  private generateRecommendations(cores: TypeCore[], teamTypes: Set<PokemonType>): string[] {
    const recommendations: string[] = [];

    if (cores.length === 0) {
      recommendations.push(
        'No type cores detected. Consider building around a core like Fire-Water-Grass or Steel-Dragon-Fairy for better synergy.'
      );
    }

    if (teamTypes.size < 10) {
      recommendations.push(
        `Team covers only ${teamTypes.size}/18 types offensively. Consider adding Pokemon with different types to improve coverage.`
      );
    }

    const missingCoreTypes = this.findMissingCoreTypes(cores, teamTypes);
    if (missingCoreTypes.length > 0 && cores.length > 0) {
      recommendations.push(
        `Near-complete cores detected. Adding a ${missingCoreTypes.join('/')} type would complete additional cores.`
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('Excellent type synergy! Your team has strong core combinations.');
    }

    return recommendations;
  }

  private findMissingCoreTypes(cores: TypeCore[], teamTypes: Set<PokemonType>): string[] {
    const missing = new Set<string>();

    for (const core of cores) {
      const missingInCore = core.types.filter((t) => !teamTypes.has(t as PokemonType));
      if (missingInCore.length === 1) {
        missing.add(missingInCore[0]);
      }
    }

    return Array.from(missing);
  }

  private emptyResult(): SynergyAnalysis {
    return {
      cores: [],
      synergyScore: 0,
      typeCoverage: 0,
      recommendations: ['Add Pokemon to analyze type synergy.'],
    };
  }
}

export const synergyDetectorService = new SynergyDetectorService();
