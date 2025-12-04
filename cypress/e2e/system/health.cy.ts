describe('System health', () => {
  it('GET /health returns ok', () => {
    cy.request('/health').then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.ok).to.eq(true);
    });
  });
});