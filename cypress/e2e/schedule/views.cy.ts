describe('Schedule API', () => {
  it('GET /api/schedule/today returns response', () => {
    cy.request('/api/schedule/today').then((res) => {
      expect([200, 401]).to.include(res.status);
    });
  });
});