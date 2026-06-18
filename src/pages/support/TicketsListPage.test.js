// src/pages/support/TicketsListPage.test.js
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { supportAPI } from '../../services/api';
import TicketsListPage from './TicketsListPage';

// Mock the API module so no network calls fire.
jest.mock('../../services/api', () => ({
  supportAPI: {
    list: jest.fn(),
    ingestTest: jest.fn(),
  },
}));

// Deterministic signed-in non-owner user.
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ isOwner: false, user: { _id: 'u1', role: 'Sales Manager' } }),
}));

// notistack
jest.mock('notistack', () => ({
  useSnackbar: () => ({ enqueueSnackbar: jest.fn() }),
}));

describe('TicketsListPage', () => {
  it('renders the header and a ticket row from the API', async () => {
    supportAPI.list.mockResolvedValue({
      data: {
        data: [
          {
            _id: 't1',
            displayId: 'TKT-000123',
            subject: 'Cannot download my cost sheet',
            category: 'sales',
            status: 'new',
            assignee: null,
            updatedAt: new Date().toISOString(),
          },
        ],
      },
    });

    render(
      <MemoryRouter>
        <TicketsListPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Support tickets')).toBeInTheDocument();

    expect(await screen.findByText(/TKT-000123/)).toBeInTheDocument();
    expect(screen.getByText(/Cannot download my cost sheet/)).toBeInTheDocument();
  });
});
