describe('Auth health', () => {
  it('health endpoint responds', () => {
    cy.request('/health').its('status').should('eq', 200);
    cy.request('/api/auth/health').then((res) => {
      expect([200, 404]).to.include(res.status);
    });
  });
});