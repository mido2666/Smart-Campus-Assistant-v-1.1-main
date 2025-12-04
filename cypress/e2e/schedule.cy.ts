/// <reference types="cypress" />

describe('Schedule Page - API Flow', () => {
  it('loads schedule from API and filters by day', () => {
    cy.intercept('GET', '**/api/schedule/user', {
      statusCode: 200,
      body: [
        { id: 1, courseName: 'Algorithms', courseCode: 'CS201', dayOfWeek: 1, startTime: '09:00', endTime: '10:30', room: 'A101', professorFirstName: 'Sara', professorLastName: 'Youssef' },
        { id: 2, courseName: 'Databases', courseCode: 'CS220', dayOfWeek: 3, startTime: '11:00', endTime: '12:15', room: 'B202', professorFirstName: 'Omar', professorLastName: 'Ali' },
        { id: 3, courseName: 'Networks', courseCode: 'CS240', dayOfWeek: 1, startTime: '14:00', endTime: '15:00', room: 'C303', professorFirstName: 'Nour', professorLastName: 'Hassan' }
      ]
    }).as('scheduleUser');

    cy.visit('/schedule');
    cy.wait('@scheduleUser');

    // Expect some rows rendered
    cy.contains('Algorithms (CS201)').should('be.visible');
    cy.contains('Databases (CS220)').should('be.visible');

    // Filter by Monday (dayOfWeek 1)
    cy.get('select').first().select('Monday');
    cy.contains('Databases (CS220)').should('not.exist');
    cy.contains('Algorithms (CS201)').should('be.visible');
    cy.contains('Networks (CS240)').should('be.visible');
  });
});


