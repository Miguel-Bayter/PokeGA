import type { PokemonType } from '@/lib/type-chart';

export interface TeamPokemonData {
  name: string;
  types: PokemonType[];
  baseStats: {
    hp: number;
    atk: number;
    def: number;
    spAtk: number;
    spDef: number;
    spd: number;
  };
  abilityName: string;
  nature: string;
  statPoints: {
    hp: number;
    atk: number;
    def: number;
    spAtk: number;
    spDef: number;
    spd: number;
  };
  moves: MoveData[];
  isMega: boolean;
  teraType: PokemonType | null;
}

export interface MoveData {
  name: string;
  type: PokemonType;
  category: 'physical' | 'special' | 'status';
  power: number | null;
}

export interface CoverageMatrix {
  [attackingType: string]: {
    [defendingType: string]: number;
  };
}

export interface OffensiveCoverageResult {
  matrix: CoverageMatrix;
  superEffective: Record<string, string[]>;
  notVeryEffective: Record<string, string[]>;
  immune: Record<string, string[]>;
  coverageScore: number;
  pokemonContributions: Record<string, string[]>;
}

export interface DefensivePokemonEntry {
  effectiveness: number;
  weakPokemon: string[];
  resistantPokemon: string[];
}

export interface DefensiveCoverage {
  [attackingType: string]: DefensivePokemonEntry;
}

export interface DefensiveCoverageResult {
  coverage: DefensiveCoverage;
  sharedWeaknesses: string[];
  defensiveScore: number;
}

export interface SharedWeakness {
  type: string;
  weakPokemonCount: number;
  maxEffectiveness: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggestedCovers: string[];
}

export interface WeaknessReport {
  sharedWeaknesses: SharedWeakness[];
  criticalCount: number;
  recommendations: string[];
}

export interface SpeedTier {
  pokemonName: string;
  baseSpeed: number;
  allocatedSP: number;
  nature: string;
  finalSpeed: number;
  rank: number;
}

export interface SpeedAnalysisResult {
  tiers: SpeedTier[];
  fastest: SpeedTier;
  slowest: SpeedTier;
  averageSpeed: number;
  speedGaps: number[];
  speedScore: number;
}

export interface BalanceAnalysis {
  physicalMoves: number;
  specialMoves: number;
  statusMoves: number;
  physicalPercentage: number;
  specialPercentage: number;
  balanceScore: number;
  recommendation: string;
}

export interface TypeCore {
  name: string;
  types: string[];
  pokemon: string[];
  description: string;
}

export interface SynergyAnalysis {
  cores: TypeCore[];
  synergyScore: number;
  typeCoverage: number;
  recommendations: string[];
}

export interface AnalysisReport {
  teamId: string;
  teamName: string;
  offensiveCoverage: OffensiveCoverageResult;
  defensiveCoverage: DefensiveCoverageResult;
  weaknessReport: WeaknessReport;
  speedAnalysis: SpeedAnalysisResult;
  balanceAnalysis: BalanceAnalysis;
  synergyAnalysis: SynergyAnalysis;
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}
