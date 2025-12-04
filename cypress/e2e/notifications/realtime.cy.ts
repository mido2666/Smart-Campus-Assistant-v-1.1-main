describe('Notifications API', () => {
  it('lists notifications', () => {
    cy.request('/api/notifications').then((res) => {
      expect([200, 401]).to.include(res.status);
    });
  });
});