import { create } from 'zustand';
import type { PokemonType } from '@/lib/type-chart';

export interface TeamMemberSlot {
  pokemonId: number;
  pokemonName: string;
  pokemonTypes: PokemonType[];
  itemId: number | null;
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
  moves: string[];
  isMega: boolean;
  teraType: PokemonType | null;
}

export interface TeamBuilderState {
  teamName: string;
  teamDescription: string;
  members: (TeamMemberSlot | null)[];
  activeSlotIndex: number;
  isDirty: boolean;
}

export interface TeamBuilderActions {
  setActiveSlot: (index: number) => void;
  setMember: (index: number, member: TeamMemberSlot) => void;
  removeMember: (index: number) => void;
  updateMemberField: <K extends keyof TeamMemberSlot>(
    index: number,
    field: K,
    value: TeamMemberSlot[K]
  ) => void;
  setTeamName: (name: string) => void;
  setTeamDescription: (description: string) => void;
  resetTeam: () => void;
  loadTeam: (data: {
    name: string;
    description: string;
    members: (TeamMemberSlot | null)[];
  }) => void;
  markClean: () => void;
  applyImportedTeam: (pokemon: ImportedPokemonData[]) => void;
  setMegaForSlot: (index: number, enabled: boolean) => void;
}

export interface TeamBuilderComputed {
  totalSPUsed: () => number;
  spRemaining: () => number;
  isValidTeam: () => boolean;
  isSlotValid: (index: number) => boolean;
  getMegaSlotIndex: () => number;
}

export interface ImportedPokemonData {
  nickname?: string;
  species: string;
  item?: string;
  ability: string;
  teraType?: string;
  level?: number;
  isMega?: boolean;
  statPoints: {
    hp: number;
    atk: number;
    def: number;
    spAtk: number;
    spDef: number;
    spd: number;
  };
  nature: string;
  moves: string[];
}

const DEFAULT_STAT_POINTS: TeamMemberSlot['statPoints'] = {
  hp: 0,
  atk: 0,
  def: 0,
  spAtk: 0,
  spDef: 0,
  spd: 0,
};

const EMPTY_MEMBERS: (TeamMemberSlot | null)[] = Array(6).fill(null);

const initialState: TeamBuilderState = {
  teamName: '',
  teamDescription: '',
  members: [...EMPTY_MEMBERS],
  activeSlotIndex: 0,
  isDirty: false,
};

export const useTeamBuilderStore = create<
  TeamBuilderState & TeamBuilderActions & TeamBuilderComputed
>()((set, get) => ({
  ...initialState,

  setActiveSlot: (index: number) => {
    if (index < 0 || index > 5) return;
    set({ activeSlotIndex: index });
  },

  setMember: (index: number, member: TeamMemberSlot) => {
    if (index < 0 || index > 5) return;
    const members = [...get().members];
    members[index] = member;
    set({ members, isDirty: true });
  },

  removeMember: (index: number) => {
    if (index < 0 || index > 5) return;
    const members = [...get().members];
    members[index] = null;
    set({ members, isDirty: true });
  },

  updateMemberField: <K extends keyof TeamMemberSlot>(
    index: number,
    field: K,
    value: TeamMemberSlot[K]
  ) => {
    if (index < 0 || index > 5) return;
    const members = [...get().members];
    const member = members[index];
    if (!member) return;
    members[index] = { ...member, [field]: value };
    set({ members, isDirty: true });
  },

  setTeamName: (name: string) => {
    set({ teamName: name, isDirty: true });
  },

  setTeamDescription: (description: string) => {
    set({ teamDescription: description, isDirty: true });
  },

  resetTeam: () => {
    set({ ...initialState, members: [...EMPTY_MEMBERS] });
  },

  loadTeam: (data: { name: string; description: string; members: (TeamMemberSlot | null)[] }) => {
    const members = [...EMPTY_MEMBERS];
    for (let i = 0; i < 6; i++) {
      members[i] = data.members[i] ?? null;
    }
    set({
      teamName: data.name,
      teamDescription: data.description,
      members,
      isDirty: false,
    });
  },

  markClean: () => {
    set({ isDirty: false });
  },

  applyImportedTeam: (pokemon: ImportedPokemonData[]) => {
    const members: (TeamMemberSlot | null)[] = [...EMPTY_MEMBERS];
    for (let i = 0; i < Math.min(pokemon.length, 6); i++) {
      const p = pokemon[i];
      members[i] = {
        pokemonId: 0,
        pokemonName: p.species,
        pokemonTypes: [],
        itemId: null,
        abilityName: p.ability,
        nature: p.nature,
        statPoints: { ...p.statPoints },
        moves: [...p.moves],
        isMega: p.isMega ?? false,
        teraType: (p.teraType as PokemonType) ?? null,
      };
    }
    const megaCount = members.filter((m) => m?.isMega).length;
    if (megaCount > 1) {
      let foundFirst = false;
      for (let i = 0; i < members.length; i++) {
        if (members[i]?.isMega) {
          if (foundFirst) {
            members[i] = { ...members[i]!, isMega: false };
          }
          foundFirst = true;
        }
      }
    }
    set({ members, isDirty: true });
  },

  setMegaForSlot: (index: number, enabled: boolean) => {
    if (index < 0 || index > 5) return;
    const members = [...get().members];
    if (enabled) {
      for (let i = 0; i < members.length; i++) {
        if (members[i] && i !== index && members[i]!.isMega) {
          members[i] = { ...members[i]!, isMega: false };
        }
      }
    }
    if (members[index]) {
      members[index] = { ...members[index]!, isMega: enabled };
    }
    set({ members, isDirty: true });
  },

  totalSPUsed: () => {
    const { members } = get();
    let total = 0;
    for (const member of members) {
      if (!member) continue;
      const { hp, atk, def, spAtk, spDef, spd } = member.statPoints;
      total += hp + atk + def + spAtk + spDef + spd;
    }
    return total;
  },

  spRemaining: () => {
    return 66 - get().totalSPUsed();
  },

  isValidTeam: () => {
    const { members, teamName } = get();
    if (!teamName.trim()) return false;
    const filledSlots = members.filter((m) => m !== null);
    if (filledSlots.length !== 6) return false;
    return filledSlots.every((_, i) => get().isSlotValid(i));
  },

  isSlotValid: (index: number) => {
    const member = get().members[index];
    if (!member) return false;
    const { hp, atk, def, spAtk, spDef, spd } = member.statPoints;
    const total = hp + atk + def + spAtk + spDef + spd;
    if (total !== 66) return false;
    if (!member.abilityName) return false;
    if (!member.nature) return false;
    if (member.moves.length === 0) return false;
    return true;
  },

  getMegaSlotIndex: () => {
    const { members } = get();
    return members.findIndex((m) => m?.isMega === true);
  },
}));

export { DEFAULT_STAT_POINTS };
