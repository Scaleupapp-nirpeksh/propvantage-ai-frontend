import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { peopleAPI } from '../../../services/api';
import MemberDetailDrawer from '../MemberDetailDrawer';

jest.mock('../../../services/api', () => ({
  peopleAPI: {
    member: jest.fn(),
    memberReflections: jest.fn(),
  },
}));

jest.mock('notistack', () => ({
  useSnackbar: () => ({ enqueueSnackbar: jest.fn() }),
}));

const theme = createTheme();
const Wrapper = ({ children }) => <ThemeProvider theme={theme}>{children}</ThemeProvider>;

const MEMBER_RESPONSE = {
  data: {
    data: {
      user: {
        _id: 'u99',
        firstName: 'Rina',
        lastName: 'Kapoor',
        role: 'Sales Executive',
      },
      metrics: {
        salesValue: 2500000,
        salesCount: 5,
        leadsWorked: 20,
        conversionRate: 0.25,
        taskSlaRate: 0.9,
        interactionsLogged: 15,
      },
      attainment: {
        salesValue: { actual: 2500000, target: 3000000, pct: 83 },
      },
      flags: {},
      flagCount: 0,
    },
  },
};

const REFLECTIONS_RESPONSE = {
  data: {
    data: [],
  },
};

describe('MemberDetailDrawer', () => {
  beforeEach(() => {
    peopleAPI.member.mockResolvedValue(MEMBER_RESPONSE);
    peopleAPI.memberReflections.mockResolvedValue(REFLECTIONS_RESPONSE);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders the member full name after loading', async () => {
    render(
      <Wrapper>
        <MemberDetailDrawer open userId="u99" range="this_month" onClose={jest.fn()} />
      </Wrapper>
    );
    // 'Rina Kapoor' appears in both header and Scorecard — getAllByText is fine
    const nameEls = await screen.findAllByText('Rina Kapoor');
    expect(nameEls.length).toBeGreaterThanOrEqual(1);
  });

  it('renders a metric value inside the drawer', async () => {
    render(
      <Wrapper>
        <MemberDetailDrawer open userId="u99" range="this_month" onClose={jest.fn()} />
      </Wrapper>
    );
    await screen.findAllByText('Rina Kapoor');
    // salesValue 2500000 → ₹25.00 L
    expect(screen.getAllByText(/₹25\.00 L/).length).toBeGreaterThanOrEqual(1);
  });

  it('renders the member role', async () => {
    render(
      <Wrapper>
        <MemberDetailDrawer open userId="u99" range="this_month" onClose={jest.fn()} />
      </Wrapper>
    );
    await screen.findAllByText('Rina Kapoor');
    // 'Sales Executive' appears in the header area + Scorecard caption — use getAllByText
    expect(screen.getAllByText('Sales Executive').length).toBeGreaterThanOrEqual(1);
  });

  it('shows a 403 error gracefully', async () => {
    const err = new Error('Forbidden');
    err.response = { status: 403 };
    peopleAPI.member.mockRejectedValue(err);

    render(
      <Wrapper>
        <MemberDetailDrawer open userId="u99" range="this_month" onClose={jest.fn()} />
      </Wrapper>
    );
    expect(await screen.findByText(/do not have permission/i)).toBeInTheDocument();
  });

  it('does not render drawer content when closed', () => {
    render(
      <Wrapper>
        <MemberDetailDrawer open={false} userId="u99" range="this_month" onClose={jest.fn()} />
      </Wrapper>
    );
    // Drawer is closed — member name should not appear
    expect(screen.queryByText('Rina Kapoor')).not.toBeInTheDocument();
  });
});
