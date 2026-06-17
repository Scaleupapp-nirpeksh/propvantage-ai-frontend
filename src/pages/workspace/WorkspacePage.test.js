// src/pages/workspace/WorkspacePage.test.js
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import WorkspacePage from './WorkspacePage';

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
    cards: [],
    ownedCards: [],
    sharedWithMe: [],
    layout: { items: [] },
    loading: false,
    refresh: jest.fn(),
    createCard: jest.fn(),
    addToBoard: jest.fn(),
    removeFromBoard: jest.fn(),
    deleteCard: jest.fn(),
    updateCard: jest.fn(),
  }),
}));

// Stub heavy children so the smoke test stays focused on the page shell.
jest.mock('./WorkspaceBoard', () => () => <div data-testid="board" />);
jest.mock('./CardBuilderDialog', () => () => null);
jest.mock('./SharedWithMeTray', () => () => null);
jest.mock('./SuggestedCardsDialog', () => () => null);
jest.mock('./RoleDashboard', () => () => <div data-testid="role-dashboard" />);

describe('WorkspacePage', () => {
  it('renders the My View header and the empty state', () => {
    render(
      <MemoryRouter>
        <WorkspacePage />
      </MemoryRouter>,
    );

    // Subtitle is unique (the title "My View" also appears in the view toggle).
    expect(screen.getByText('Your saved, filtered views across every module')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add card/i })).toBeInTheDocument();
    // Empty-state heading + suggested-cards CTA.
    expect(screen.getByText('Build your view')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add suggested cards/i })).toBeInTheDocument();
  });
});
