import { describe, it, expect } from 'vitest';
import {
  canAccessBoard,
  isBoardOwner,
  type BoardAccessInfo,
} from '../../src/domain/services/board-access.js';

const publicBoard: BoardAccessInfo = {
  visibility: 'public',
  owner: 'owner-1',
  members: ['member-1'],
};

const privateBoard: BoardAccessInfo = {
  visibility: 'private',
  owner: 'owner-1',
  members: ['member-1', 'member-2'],
};

describe('canAccessBoard', () => {
  it('allows anyone to access a public board', () => {
    expect(canAccessBoard(publicBoard, 'stranger')).toBe(true);
  });

  it('allows owner to access a private board', () => {
    expect(canAccessBoard(privateBoard, 'owner-1')).toBe(true);
  });

  it('allows member to access a private board', () => {
    expect(canAccessBoard(privateBoard, 'member-1')).toBe(true);
  });

  it('denies stranger access to a private board', () => {
    expect(canAccessBoard(privateBoard, 'stranger')).toBe(false);
  });
});

describe('isBoardOwner', () => {
  it('returns true for the owner', () => {
    expect(isBoardOwner(publicBoard, 'owner-1')).toBe(true);
  });

  it('returns false for a non-owner', () => {
    expect(isBoardOwner(publicBoard, 'member-1')).toBe(false);
  });
});
