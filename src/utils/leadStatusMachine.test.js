import { LEAD_STATUSES, allowedNextStatuses, statusLabel } from './leadStatusMachine';

describe('frontend lead status machine (mirror of backend)', () => {
  it('lists the 7 funnel statuses (excludes the pending intake state)', () => {
    expect(LEAD_STATUSES).toEqual(['New', 'Qualified', 'Site Visit Completed', 'Negotiating', 'Booked', 'Lost', 'Revived']);
  });
  it('allowedNextStatuses matches the backend transitions', () => {
    expect(allowedNextStatuses('New')).toEqual(['Qualified', 'Lost']);
    expect(allowedNextStatuses('Qualified')).toEqual(['Site Visit Completed', 'Lost']);
    expect(allowedNextStatuses('Site Visit Completed')).toEqual(['Negotiating', 'Booked', 'Lost']);
    expect(allowedNextStatuses('Negotiating')).toEqual(['Booked', 'Lost']);
    expect(allowedNextStatuses('Lost')).toEqual(['Revived']);
    expect(allowedNextStatuses('Revived')).toEqual(['Site Visit Completed', 'Negotiating']);
    expect(allowedNextStatuses('Booked')).toEqual(['Lost']);
  });
  it('statusLabel renders Booked as "Booking", others unchanged', () => {
    expect(statusLabel('Booked')).toBe('Booking');
    expect(statusLabel('Qualified')).toBe('Qualified');
  });
});
