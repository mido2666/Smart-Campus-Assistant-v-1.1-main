/// <reference types="cypress" />

describe('Student AI Assistant - Minimal E2E', () => {
  it('sends a chatbot message and gets JSON 200 via API', () => {
    const apiBase = (Cypress.env('API_BASE') as string) || 'http://localhost:3001';
    cy.request({
      method: 'POST',
      url: `${apiBase}/api/chatbot/message`,
      headers: { 'Content-Type': 'application/json' },
      body: { message: 'Hello from Cypress', lang: 'en', userId: 'student-1' }
    }).then((res) => {
      expect(res.status).to.be.oneOf([200]);
      expect(res.headers['content-type']).to.include('application/json');
      expect(res.body).to.have.property('success', true);
    });
  });
});


