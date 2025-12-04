describe('Attendance marking', () => {
  it('marks attendance via QR scan', () => {
    cy.intercept('POST', '/api/attendance/scan', {
      statusCode: 200,
      body: { success: true, data: { status: 'PRESENT' } }
    }).as('scan');

    cy.visit('/attendance');
    cy.get('[data-cy="mark-attendance-button"]').click();
    cy.get('[data-cy="qr-code-input"]').type('SAFE_CS101_S1');
    cy.get('[data-cy="verify-qr-button"]').click();
    cy.wait('@scan');
    cy.contains('Attendance marked').should('be.visible');
  });
});