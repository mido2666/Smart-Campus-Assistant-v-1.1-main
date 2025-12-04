/// <reference types="cypress" />

describe('Auth Token Refresh Flow', () => {
  it('handles 401 by refreshing token and retrying request', () => {
    const apiBase = (Cypress.env('API_BASE') as string) || 'http://localhost:3001';

    // Seed expired access token and valid refresh token
    cy.visit('/');
    cy.window().then((win) => {
      win.localStorage.setItem('accessToken', 'expired-token');
      win.localStorage.setItem('refreshToken', 'valid-refresh');
      // expiresAt in the past forces refresh
      win.localStorage.setItem('expiresAt', String(Date.now() - 60_000));
    });

    // First authenticated call returns 401
    cy.intercept('GET', '**/api/notifications', (req) => {
      if (!(req as any)._retried) {
        (req as any)._retried = true;
        req.reply({ statusCode: 401, body: { success: false, message: 'Unauthorized' } });
      } else {
        req.reply({ statusCode: 200, body: { success: true, data: { notifications: [] } } });
      }
    }).as('getNotifications');

    // Refresh endpoint returns new tokens
    cy.intercept('POST', '**/api/auth/refresh', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          accessToken: 'new-access',
          refreshToken: 'new-refresh',
          expiresIn: 900
        }
      }
    }).as('refresh');

    cy.visit('/student-notifications');
    cy.wait('@getNotifications');
    cy.wait('@refresh');
    cy.wait('@getNotifications');

    // Verify new tokens persisted
    cy.window().then((win) => {
      expect(win.localStorage.getItem('accessToken')).to.eq('new-access');
      expect(win.localStorage.getItem('refreshToken')).to.eq('new-refresh');
    });
  });
});


