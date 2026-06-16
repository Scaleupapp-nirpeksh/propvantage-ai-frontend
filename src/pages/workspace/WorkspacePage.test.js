// src/pages/workspace/WorkspacePage.test.js
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock the API module so no network calls fire.
jest.mock('../../services/api', () => ({
  workspaceAPI: {
    getCards: jest.fn(() => Promise.resolve({ data: { data: [] } })),
    getLayout: jest.fn(() => Promise.resolve({ data: { data: { items: [] } } })),
    createCard: jest.fn(),
    saveLayout: jest.fn(),
  },
}));

// Mock contexts to a deterministic, signed-in Sales Manager with an empty board.
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: { _id: 'u1', role: 'Sales Manager' } }),
}));
jest.mock('../../context/WorkspaceContext', () => ({
  useWorkspace: () => ({
    ownedCards: [],
    sharedWithMe: [],
    layout: { items: [] },
    loading: false,
    refresh: jest.fn(),
    createCard: jest.fn(),
    addToBoard: jest.fn(),
  }),
}));

// Stub heavy children so the smoke test stays focused on the page shell.
jest.mock('./WorkspaceBoard', () => () => <div data-testid="board" />);
jest.mock('./CardBuilderDialog', () => () => null);
jest.mock('./SharedWithMeTray', () => () => null);

import WorkspacePage from './WorkspacePage';

describe('WorkspacePage', () => {
  it('renders the header and the role-based empty state', () => {
    render(
      <MemoryRouter>
        <WorkspacePage />
      </MemoryRouter>,
    );

    expect(screen.getByText('My Workspace')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add card/i })).toBeInTheDocument();
    // Empty-state CTA + a Sales Manager starter suggestion chip.
    expect(screen.getByRole('button', { name: /add suggested cards/i })).toBeInTheDocument();
    expect(screen.getByText('Stale CP leads')).toBeInTheDocument();
  });
});
