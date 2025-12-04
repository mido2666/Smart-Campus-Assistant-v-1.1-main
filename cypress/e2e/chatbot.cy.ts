describe('Chatbot Functionality', () => {
  beforeEach(() => {
    cy.clearAllMocks();
    cy.clearLocalStorage();
    cy.clearSessionStorage();
  });

  describe('Student Chatbot', () => {
    beforeEach(() => {
      cy.login('student@example.com', 'password123', 'student');
    });

    it('should display chatbot interface correctly', () => {
      // Mock chatbot initialization
      cy.mockApiResponse('GET', '/api/chatbot/sessions', {
        success: true,
        data: {
          sessions: [
            {
              id: 1,
              name: 'General Questions',
              lastMessageAt: '2024-01-15T10:30:00Z',
              messageCount: 5
            }
          ]
        }
      });

      cy.visit('/student/chatbot');
      cy.waitForPageLoad();
      
      // Check chatbot interface elements
      cy.get('[data-testid="chatbot-container"]').should('be.visible');
      cy.get('[data-testid="chat-input"]').should('be.visible');
      cy.get('[data-testid="send-button"]').should('be.visible');
      cy.get('[data-testid="sessions-sidebar"]').should('be.visible');
      
      // Check session list
      cy.get('[data-testid="session-1"]').should('contain.text', 'General Questions');
    });

    it('should send message and receive AI response', () => {
      // Mock message sending
      cy.mockApiResponse('POST', '/api/chatbot/message', {
        success: true,
        data: {
          message: 'I can help you with course information, assignments, and general questions. What would you like to know?',
          session: {
            id: 1,
            name: 'General Questions'
          },
          suggestions: [
            'What are my upcoming assignments?',
            'When is the next exam?',
            'How do I submit an assignment?'
          ],
          analytics: {
            responseTime: 1.2,
            tokensUsed: 150
          }
        }
      });

      cy.visit('/student/chatbot');
      cy.waitForPageLoad();
      
      // Type message
      cy.get('[data-testid="chat-input"]').type('Hello, I need help with my assignments');
      
      // Send message
      cy.get('[data-testid="send-button"]').click();
      
      cy.waitForApiCall('post_/api/chatbot/message');
      
      // Check if message appears in chat
      cy.get('[data-testid="user-message"]').should('contain.text', 'Hello, I need help with my assignments');
      cy.get('[data-testid="ai-response"]').should('contain.text', 'I can help you with course information');
      
      // Check suggestions
      cy.get('[data-testid="suggestions"]').should('be.visible');
      cy.get('[data-testid="suggestion-1"]').should('contain.text', 'What are my upcoming assignments?');
    });

    it('should show typing indicator while waiting for response', () => {
      // Mock delayed response
      cy.intercept('POST', '/api/chatbot/message', (req) => {
        req.reply((res) => {
          res.delay(2000);
          res.send({
            success: true,
            data: {
              message: 'This is a delayed response',
              session: { id: 1, name: 'Test Session' },
              suggestions: [],
              analytics: { responseTime: 2.0, tokensUsed: 50 }
            }
          });
        });
      }).as('delayedResponse');

      cy.visit('/student/chatbot');
      cy.waitForPageLoad();
      
      cy.get('[data-testid="chat-input"]').type('Test message');
      cy.get('[data-testid="send-button"]').click();
      
      // Should show typing indicator
      cy.get('[data-testid="typing-indicator"]').should('be.visible');
      
      cy.wait('@delayedResponse');
      
      // Typing indicator should disappear
      cy.get('[data-testid="typing-indicator"]').should('not.exist');
    });

    it('should handle chatbot errors gracefully', () => {
      // Mock chatbot error
      cy.mockApiResponse('POST', '/api/chatbot/message', {
        success: false,
        message: 'Chatbot service is temporarily unavailable',
        code: 'SERVICE_UNAVAILABLE'
      }, 503);

      cy.visit('/student/chatbot');
      cy.waitForPageLoad();
      
      cy.get('[data-testid="chat-input"]').type('Test message');
      cy.get('[data-testid="send-button"]').click();
      
      cy.waitForApiCall('post_/api/chatbot/message');
      
      cy.shouldShowNotification('Chatbot service is temporarily unavailable', 'error');
    });

    it('should create new chat session', () => {
      // Mock new session creation
      cy.mockApiResponse('POST', '/api/chatbot/sessions', {
        success: true,
        data: {
          id: 2,
          name: 'New Session',
          createdAt: '2024-01-20T10:00:00Z'
        }
      });

      cy.visit('/student/chatbot');
      cy.waitForPageLoad();
      
      // Click new session button
      cy.get('[data-testid="new-session-button"]').click();
      
      cy.waitForApiCall('post_/api/chatbot/sessions');
      
      // Should show new session in sidebar
      cy.get('[data-testid="session-2"]').should('contain.text', 'New Session');
    });

    it('should switch between chat sessions', () => {
      // Mock multiple sessions
      cy.mockApiResponse('GET', '/api/chatbot/sessions', {
        success: true,
        data: {
          sessions: [
            {
              id: 1,
              name: 'General Questions',
              lastMessageAt: '2024-01-15T10:30:00Z',
              messageCount: 5
            },
            {
              id: 2,
              name: 'Assignment Help',
              lastMessageAt: '2024-01-16T14:20:00Z',
              messageCount: 3
            }
          ]
        }
      });

      // Mock chat history for session 2
      cy.mockApiResponse('GET', '/api/chatbot/history/2', {
        success: true,
        data: {
          messages: [
            {
              id: 1,
              message: 'How do I submit an assignment?',
              response: 'To submit an assignment, go to the assignments page...',
              timestamp: '2024-01-16T14:20:00Z',
              isUser: true
            }
          ],
          pagination: {
            limit: 50,
            offset: 0,
            total: 1
          }
        }
      });

      cy.visit('/student/chatbot');
      cy.waitForPageLoad();
      
      // Click on second session
      cy.get('[data-testid="session-2"]').click();
      
      cy.waitForApiCall('get_/api/chatbot/history/2');
      
      // Should show chat history for session 2
      cy.get('[data-testid="chat-history"]').should('contain.text', 'How do I submit an assignment?');
    });

    it('should show quick suggestions', () => {
      // Mock suggestions API
      cy.mockApiResponse('GET', '/api/chatbot/suggestions', {
        success: true,
        data: {
          suggestions: [
            'What are my upcoming assignments?',
            'When is the next exam?',
            'How do I check my grades?',
            'Where can I find course materials?',
            'How do I contact my professor?'
          ]
        }
      });

      cy.visit('/student/chatbot');
      cy.waitForPageLoad();
      
      // Check if suggestions are displayed
      cy.get('[data-testid="quick-suggestions"]').should('be.visible');
      cy.get('[data-testid="suggestion-item-1"]').should('contain.text', 'What are my upcoming assignments?');
      
      // Click on a suggestion
      cy.get('[data-testid="suggestion-item-1"]').click();
      
      // Should populate chat input
      cy.get('[data-testid="chat-input"]').should('have.value', 'What are my upcoming assignments?');
    });

    it('should show FAQ items', () => {
      // Mock FAQ API
      cy.mockApiResponse('GET', '/api/chatbot/faq', {
        success: true,
        data: {
          faqItems: [
            {
              id: 1,
              question: 'How do I reset my password?',
              answer: 'You can reset your password by clicking the forgot password link on the login page.',
              category: 'ACCOUNT'
            },
            {
              id: 2,
              question: 'How do I submit an assignment?',
              answer: 'Go to the assignments page, select your assignment, and upload your file.',
              category: 'ACADEMIC'
            }
          ]
        }
      });

      cy.visit('/student/chatbot');
      cy.waitForPageLoad();
      
      // Click FAQ tab
      cy.get('[data-testid="faq-tab"]').click();
      
      // Check FAQ items
      cy.get('[data-testid="faq-item-1"]').should('contain.text', 'How do I reset my password?');
      cy.get('[data-testid="faq-item-2"]').should('contain.text', 'How do I submit an assignment?');
      
      // Click on FAQ item
      cy.get('[data-testid="faq-item-1"]').click();
      
      // Should show answer
      cy.get('[data-testid="faq-answer-1"]').should('contain.text', 'You can reset your password by clicking the forgot password link');
    });

    it('should clear chat history', () => {
      // Mock clear history API
      cy.mockApiResponse('DELETE', '/api/chatbot/history/1', {
        success: true,
        message: 'Chat history cleared successfully'
      });

      cy.visit('/student/chatbot');
      cy.waitForPageLoad();
      
      // Click clear history button
      cy.get('[data-testid="clear-history-button"]').click();
      
      // Confirm clear
      cy.get('[data-testid="confirm-clear"]').click();
      
      cy.waitForApiCall('delete_/api/chatbot/history/1');
      
      cy.shouldShowNotification('Chat history cleared successfully', 'success');
      
      // Chat history should be empty
      cy.get('[data-testid="chat-history"]').should('be.empty');
    });

    it('should rename chat session', () => {
      // Mock rename session API
      cy.mockApiResponse('PUT', '/api/chatbot/sessions/1/name', {
        success: true,
        message: 'Session name updated successfully'
      });

      cy.visit('/student/chatbot');
      cy.waitForPageLoad();
      
      // Click rename button
      cy.get('[data-testid="rename-session-1"]').click();
      
      // Enter new name
      cy.get('[data-testid="session-name-input"]').clear().type('My Custom Session');
      
      // Save
      cy.get('[data-testid="save-session-name"]').click();
      
      cy.waitForApiCall('put_/api/chatbot/sessions/1/name');
      
      cy.shouldShowNotification('Session name updated successfully', 'success');
      
      // Session name should be updated
      cy.get('[data-testid="session-1"]').should('contain.text', 'My Custom Session');
    });
  });

  describe('Professor Chatbot', () => {
    beforeEach(() => {
      cy.login('professor@example.com', 'password123', 'professor');
    });

    it('should display professor chatbot interface', () => {
      cy.visit('/professor/chatbot');
      cy.waitForPageLoad();
      
      // Check professor-specific chatbot features
      cy.get('[data-testid="chatbot-container"]').should('be.visible');
      cy.get('[data-testid="professor-tools"]').should('be.visible');
      cy.get('[data-testid="course-context"]').should('be.visible');
    });

    it('should provide course-specific assistance', () => {
      // Mock course context
      cy.mockApiResponse('GET', '/api/professors/courses', {
        success: true,
        data: [
          {
            id: 1,
            courseName: 'Computer Science 101',
            enrolledStudents: 25
          }
        ]
      });

      cy.visit('/professor/chatbot');
      cy.waitForPageLoad();
      
      // Select course context
      cy.get('[data-testid="course-selector"]').select('Computer Science 101');
      
      // Ask course-specific question
      cy.get('[data-testid="chat-input"]').type('How many students are enrolled in this course?');
      cy.get('[data-testid="send-button"]').click();
      
      // Should provide course-specific response
      cy.get('[data-testid="ai-response"]').should('contain.text', '25 students');
    });

    it('should provide teaching assistance', () => {
      cy.visit('/professor/chatbot');
      cy.waitForPageLoad();
      
      // Ask teaching-related question
      cy.get('[data-testid="chat-input"]').type('How can I improve student engagement in my lectures?');
      cy.get('[data-testid="send-button"]').click();
      
      // Should provide teaching advice
      cy.get('[data-testid="ai-response"]').should('contain.text', 'engagement');
    });
  });

  describe('Chatbot Analytics (Admin)', () => {
    beforeEach(() => {
      cy.login('admin@example.com', 'password123', 'admin');
    });

    it('should display chatbot analytics dashboard', () => {
      // Mock analytics data
      cy.mockApiResponse('GET', '/api/chatbot/stats', {
        success: true,
        data: {
          totalSessions: 150,
          totalMessages: 750,
          averageResponseTime: 1.5,
          userSatisfaction: 4.2,
          popularQuestions: [
            { question: 'How do I submit an assignment?', count: 25 },
            { question: 'When is the next exam?', count: 20 }
          ]
        }
      });

      cy.visit('/admin/chatbot/analytics');
      cy.waitForPageLoad();
      
      // Check analytics sections
      cy.get('[data-testid="chatbot-stats"]').should('be.visible');
      cy.get('[data-testid="popular-questions"]').should('be.visible');
      
      // Check stats
      cy.get('[data-testid="total-sessions"]').should('contain.text', '150');
      cy.get('[data-testid="total-messages"]').should('contain.text', '750');
      cy.get('[data-testid="average-response-time"]').should('contain.text', '1.5s');
      cy.get('[data-testid="user-satisfaction"]').should('contain.text', '4.2');
    });

    it('should refresh knowledge base', () => {
      // Mock refresh API
      cy.mockApiResponse('POST', '/api/chatbot/refresh-knowledge', {
        success: true,
        message: 'Knowledge base refreshed successfully'
      });

      cy.visit('/admin/chatbot/analytics');
      cy.waitForPageLoad();
      
      // Click refresh knowledge base button
      cy.get('[data-testid="refresh-knowledge-base"]').click();
      
      cy.waitForApiCall('post_/api/chatbot/refresh-knowledge');
      
      cy.shouldShowNotification('Knowledge base refreshed successfully', 'success');
    });

    it('should clear chatbot cache', () => {
      // Mock clear cache API
      cy.mockApiResponse('POST', '/api/chatbot/clear-cache', {
        success: true,
        message: 'Cache cleared successfully'
      });

      cy.visit('/admin/chatbot/analytics');
      cy.waitForPageLoad();
      
      // Click clear cache button
      cy.get('[data-testid="clear-cache"]').click();
      
      cy.waitForApiCall('post_/api/chatbot/clear-cache');
      
      cy.shouldShowNotification('Cache cleared successfully', 'success');
    });
  });

  describe('Chatbot Mobile Experience', () => {
    beforeEach(() => {
      cy.login('student@example.com', 'password123', 'student');
    });

    it('should work correctly on mobile devices', () => {
      cy.setViewport('mobile');
      cy.visit('/student/chatbot');
      cy.waitForPageLoad();
      
      // Check mobile layout
      cy.get('[data-testid="chatbot-container"]').should('be.visible');
      cy.get('[data-testid="chat-input"]').should('be.visible');
      cy.get('[data-testid="send-button"]').should('be.visible');
      
      // Test mobile chat functionality
      cy.get('[data-testid="chat-input"]').type('Mobile test message');
      cy.get('[data-testid="send-button"]').click();
    });

    it('should handle mobile keyboard properly', () => {
      cy.setViewport('mobile');
      cy.visit('/student/chatbot');
      cy.waitForPageLoad();
      
      // Focus on chat input
      cy.get('[data-testid="chat-input"]').focus();
      
      // Should show mobile keyboard
      cy.get('[data-testid="chat-input"]').should('be.focused');
      
      // Type message
      cy.get('[data-testid="chat-input"]').type('Mobile keyboard test');
      
      // Send button should be accessible
      cy.get('[data-testid="send-button"]').should('be.visible');
    });
  });

  describe('Chatbot Accessibility', () => {
    beforeEach(() => {
      cy.login('student@example.com', 'password123', 'student');
    });

    it('should be accessible with keyboard navigation', () => {
      cy.visit('/student/chatbot');
      cy.waitForPageLoad();
      
      // Tab through chatbot elements
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-testid', 'chat-input');
      
      cy.focused().tab();
      cy.focused().should('have.attr', 'data-testid', 'send-button');
    });

    it('should have proper ARIA labels and roles', () => {
      cy.visit('/student/chatbot');
      cy.waitForPageLoad();
      
      cy.get('[data-testid="chat-input"]').should('have.attr', 'aria-label');
      cy.get('[data-testid="send-button"]').should('have.attr', 'aria-label');
      cy.get('[data-testid="chat-history"]').should('have.attr', 'role', 'log');
    });

    it('should announce new messages to screen readers', () => {
      cy.visit('/student/chatbot');
      cy.waitForPageLoad();
      
      // Check if chat history has proper ARIA live region
      cy.get('[data-testid="chat-history"]').should('have.attr', 'aria-live', 'polite');
    });
  });

  describe('Chatbot Error Handling', () => {
    beforeEach(() => {
      cy.login('student@example.com', 'password123', 'student');
    });

    it('should handle network errors gracefully', () => {
      // Mock network error
      cy.intercept('POST', '/api/chatbot/message', {
        forceNetworkError: true
      }).as('networkError');

      cy.visit('/student/chatbot');
      cy.waitForPageLoad();
      
      cy.get('[data-testid="chat-input"]').type('Test message');
      cy.get('[data-testid="send-button"]').click();
      
      cy.wait('@networkError');
      
      cy.shouldShowNotification('Network error. Please check your connection.', 'error');
    });

    it('should handle rate limiting', () => {
      // Mock rate limit error
      cy.mockApiResponse('POST', '/api/chatbot/message', {
        success: false,
        message: 'Rate limit exceeded. Please wait before sending another message.',
        code: 'RATE_LIMIT_EXCEEDED'
      }, 429);

      cy.visit('/student/chatbot');
      cy.waitForPageLoad();
      
      cy.get('[data-testid="chat-input"]').type('Test message');
      cy.get('[data-testid="send-button"]').click();
      
      cy.waitForApiCall('post_/api/chatbot/message');
      
      cy.shouldShowNotification('Rate limit exceeded. Please wait before sending another message.', 'error');
      
      // Send button should be disabled
      cy.get('[data-testid="send-button"]').should('be.disabled');
    });

    it('should retry failed requests', () => {
      // Mock initial failure, then success
      cy.intercept('POST', '/api/chatbot/message', (req) => {
        req.reply((res) => {
          if (req.alias === 'firstCall') {
            res.statusCode = 500;
            res.body = { success: false, message: 'Server error' };
          } else {
            res.statusCode = 200;
            res.body = {
              success: true,
              data: {
                message: 'Retry successful',
                session: { id: 1, name: 'Test Session' },
                suggestions: [],
                analytics: { responseTime: 1.0, tokensUsed: 50 }
              }
            };
          }
        });
      }).as('chatbotMessage');

      cy.visit('/student/chatbot');
      cy.waitForPageLoad();
      
      cy.get('[data-testid="chat-input"]').type('Test message');
      cy.get('[data-testid="send-button"]').click();
      
      cy.wait('@chatbotMessage');
      cy.shouldShowNotification('Server error', 'error');
      
      // Click retry
      cy.get('[data-testid="retry-message"]').click();
      
      cy.wait('@chatbotMessage');
      cy.get('[data-testid="ai-response"]').should('contain.text', 'Retry successful');
    });
  });
});
