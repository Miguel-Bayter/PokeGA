import { describe, it, expect, beforeEach } from 'vitest';
import { useTeamBuilderStore } from '@/stores/team-builder.store';
import type { TeamMemberSlot } from '@/stores/team-builder.store';

function createMockMember(overrides: Partial<TeamMemberSlot> = {}): TeamMemberSlot {
  return {
    pokemonId: 25,
    pokemonName: 'pikachu',
    pokemonTypes: ['electric'],
    itemId: null,
    abilityName: 'static',
    nature: 'jolly',
    statPoints: { hp: 11, atk: 11, def: 11, spAtk: 11, spDef: 11, spd: 11 },
    moves: ['thunderbolt', 'quick-attack'],
    isMega: false,
    teraType: null,
    ...overrides,
  };
}

describe('Team Builder Store', () => {
  beforeEach(() => {
    useTeamBuilderStore.getState().resetTeam();
  });

  describe('initial state', () => {
    it('should start with empty team', () => {
      const state = useTeamBuilderStore.getState();
      expect(state.teamName).toBe('');
      expect(state.teamDescription).toBe('');
      expect(state.members).toHaveLength(6);
      expect(state.members.every((m) => m === null)).toBe(true);
      expect(state.activeSlotIndex).toBe(0);
      expect(state.isDirty).toBe(false);
    });
  });

  describe('setActiveSlot', () => {
    it('should set active slot index', () => {
      useTeamBuilderStore.getState().setActiveSlot(3);
      expect(useTeamBuilderStore.getState().activeSlotIndex).toBe(3);
    });

    it('should not set invalid slot index', () => {
      useTeamBuilderStore.getState().setActiveSlot(-1);
      expect(useTeamBuilderStore.getState().activeSlotIndex).toBe(0);

      useTeamBuilderStore.getState().setActiveSlot(6);
      expect(useTeamBuilderStore.getState().activeSlotIndex).toBe(0);
    });
  });

  describe('setMember', () => {
    it('should set a member in the specified slot', () => {
      const member = createMockMember();
      useTeamBuilderStore.getState().setMember(0, member);

      const state = useTeamBuilderStore.getState();
      expect(state.members[0]).toEqual(member);
      expect(state.isDirty).toBe(true);
    });

    it('should not set member in invalid slot', () => {
      const member = createMockMember();
      useTeamBuilderStore.getState().setMember(-1, member);
      useTeamBuilderStore.getState().setMember(6, member);

      const state = useTeamBuilderStore.getState();
      expect(state.members.every((m) => m === null)).toBe(true);
    });
  });

  describe('removeMember', () => {
    it('should remove a member from the specified slot', () => {
      const member = createMockMember();
      useTeamBuilderStore.getState().setMember(2, member);
      useTeamBuilderStore.getState().removeMember(2);

      expect(useTeamBuilderStore.getState().members[2]).toBeNull();
    });
  });

  describe('updateMemberField', () => {
    it('should update a specific field of a member', () => {
      const member = createMockMember();
      useTeamBuilderStore.getState().setMember(0, member);
      useTeamBuilderStore.getState().updateMemberField(0, 'nature', 'adamant');

      expect(useTeamBuilderStore.getState().members[0]?.nature).toBe('adamant');
    });

    it('should not update field if member is null', () => {
      useTeamBuilderStore.getState().updateMemberField(0, 'nature', 'adamant');
      expect(useTeamBuilderStore.getState().members[0]).toBeNull();
    });
  });

  describe('resetTeam', () => {
    it('should reset all state to initial values', () => {
      useTeamBuilderStore.getState().setTeamName('My Team');
      useTeamBuilderStore.getState().setMember(0, createMockMember());
      useTeamBuilderStore.getState().resetTeam();

      const state = useTeamBuilderStore.getState();
      expect(state.teamName).toBe('');
      expect(state.members.every((m) => m === null)).toBe(true);
      expect(state.isDirty).toBe(false);
    });
  });

  describe('loadTeam', () => {
    it('should load team data', () => {
      const member = createMockMember();
      useTeamBuilderStore.getState().loadTeam({
        name: 'Loaded Team',
        description: 'A loaded team',
        members: [member, null, null, null, null, null],
      });

      const state = useTeamBuilderStore.getState();
      expect(state.teamName).toBe('Loaded Team');
      expect(state.teamDescription).toBe('A loaded team');
      expect(state.members[0]).toEqual(member);
      expect(state.isDirty).toBe(false);
    });
  });

  describe('computed values', () => {
    it('should calculate total SP used', () => {
      const member1 = createMockMember({
        statPoints: { hp: 10, atk: 10, def: 10, spAtk: 10, spDef: 10, spd: 10 },
      });
      const member2 = createMockMember({
        statPoints: { hp: 11, atk: 11, def: 11, spAtk: 11, spDef: 11, spd: 11 },
      });

      useTeamBuilderStore.getState().setMember(0, member1);
      useTeamBuilderStore.getState().setMember(1, member2);

      expect(useTeamBuilderStore.getState().totalSPUsed()).toBe(60 + 66);
    });

    it('should calculate SP remaining', () => {
      const member = createMockMember({
        statPoints: { hp: 11, atk: 11, def: 11, spAtk: 11, spDef: 11, spd: 11 },
      });
      useTeamBuilderStore.getState().setMember(0, member);

      expect(useTeamBuilderStore.getState().spRemaining()).toBe(0);
    });

    it('should validate team correctly', () => {
      expect(useTeamBuilderStore.getState().isValidTeam()).toBe(false);

      useTeamBuilderStore.getState().setTeamName('Test Team');

      for (let i = 0; i < 6; i++) {
        useTeamBuilderStore.getState().setMember(
          i,
          createMockMember({
            pokemonId: i + 1,
            statPoints: { hp: 11, atk: 11, def: 11, spAtk: 11, spDef: 11, spd: 11 },
          })
        );
      }

      expect(useTeamBuilderStore.getState().isValidTeam()).toBe(true);
    });

    it('should validate individual slot', () => {
      expect(useTeamBuilderStore.getState().isSlotValid(0)).toBe(false);

      useTeamBuilderStore.getState().setMember(
        0,
        createMockMember({
          statPoints: { hp: 11, atk: 11, def: 11, spAtk: 11, spDef: 11, spd: 11 },
        })
      );

      expect(useTeamBuilderStore.getState().isSlotValid(0)).toBe(true);
    });
  });
});
