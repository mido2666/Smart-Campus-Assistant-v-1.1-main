import { Request, Response } from 'express';
import { ChatbotController } from '../src/controllers/chatbot.controller';
import { ChatbotService } from '../src/services/chatbot.service';
import { PrismaClient } from '../src/generated/prisma';
import { ChatbotError } from '../src/types/chatbot.types';

// Mock the services
jest.mock('../src/services/chatbot.service');
jest.mock('../src/generated/prisma');

const MockedChatbotService = ChatbotService as jest.Mocked<typeof ChatbotService>;
const MockedPrismaClient = PrismaClient as jest.Mocked<typeof PrismaClient>;

describe('ChatbotController', () => {
  let controller: ChatbotController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;
  let mockPrisma: jest.Mocked<PrismaClient>;

  beforeEach(() => {
    mockPrisma = new MockedPrismaClient() as jest.Mocked<PrismaClient>;
    controller = new ChatbotController(mockPrisma);
    
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('sendMessage', () => {
    it('should send message and get AI response successfully', async () => {
      const messageData = {
        message: 'What is the assignment due date?',
        sessionId: 1,
        language: 'en',
        context: { courseId: 1 }
      };

      const mockResponse = {
        message: 'The assignment is due on January 15th, 2024.',
        session: {
          id: 1,
          name: 'Chat Session 1',
          userId: '1'
        },
        suggestions: [
          'What are the requirements?',
          'Can I get an extension?'
        ],
        analytics: {
          responseTime: 1.2,
          tokensUsed: 150
        }
      };

      mockRequest.body = messageData;
      mockRequest.user = { id: '1', role: 'STUDENT' };
      MockedChatbotService.prototype.processMessage.mockResolvedValue(mockResponse);

      await controller.sendMessage(mockRequest as any, mockResponse as Response);

      expect(MockedChatbotService.prototype.processMessage).toHaveBeenCalledWith(
        {
          message: messageData.message,
          sessionId: messageData.sessionId,
          language: messageData.language,
          context: messageData.context
        },
        '1'
      );
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          message: mockResponse.message,
          session: mockResponse.session,
          suggestions: mockResponse.suggestions,
          analytics: mockResponse.analytics
        }
      });
    });

    it('should handle missing authentication', async () => {
      mockRequest.body = { message: 'Hello' };
      mockRequest.user = undefined;

      await controller.sendMessage(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required'
      });
    });

    it('should handle empty message', async () => {
      mockRequest.body = { message: '' };
      mockRequest.user = { id: '1', role: 'STUDENT' };

      await controller.sendMessage(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Message is required and must be a non-empty string'
      });
    });

    it('should handle ChatbotError', async () => {
      const error = new ChatbotError('Invalid session', 'INVALID_SESSION', { sessionId: 999 });
      
      mockRequest.body = { message: 'Hello', sessionId: 999 };
      mockRequest.user = { id: '1', role: 'STUDENT' };
      MockedChatbotService.prototype.processMessage.mockRejectedValue(error);

      await controller.sendMessage(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid session',
        code: 'INVALID_SESSION',
        details: { sessionId: 999 }
      });
    });

    it('should handle general errors', async () => {
      const error = new Error('Database connection failed');
      
      mockRequest.body = { message: 'Hello' };
      mockRequest.user = { id: '1', role: 'STUDENT' };
      MockedChatbotService.prototype.processMessage.mockRejectedValue(error);

      await controller.sendMessage(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error',
        details: 'Database connection failed'
      });
    });
  });

  describe('getChatHistory', () => {
    it('should get chat history successfully', async () => {
      const mockHistory = {
        messages: [
          {
            id: 1,
            message: 'What is the assignment due date?',
            response: 'The assignment is due on January 15th, 2024.',
            timestamp: new Date(),
            isUser: true
          }
        ],
        pagination: {
          limit: 50,
          offset: 0,
          total: 1
        }
      };

      mockRequest.params = { sessionId: '1' };
      mockRequest.query = { limit: '50', offset: '0' };
      mockRequest.user = { id: '1', role: 'STUDENT' };
      MockedChatbotService.prototype.getChatHistory.mockResolvedValue(mockHistory);

      await controller.getChatHistory(mockRequest as any, mockResponse as Response);

      expect(MockedChatbotService.prototype.getChatHistory).toHaveBeenCalledWith(1, '1', 50, 0);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockHistory
      });
    });

    it('should handle invalid session ID', async () => {
      mockRequest.params = { sessionId: 'invalid' };
      mockRequest.user = { id: '1', role: 'STUDENT' };

      await controller.getChatHistory(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid session ID'
      });
    });

    it('should handle missing authentication', async () => {
      mockRequest.params = { sessionId: '1' };
      mockRequest.user = undefined;

      await controller.getChatHistory(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required'
      });
    });
  });

  describe('getUserSessions', () => {
    it('should get user sessions successfully', async () => {
      const mockSessions = [
        {
          id: 1,
          name: 'Chat Session 1',
          userId: '1',
          createdAt: new Date(),
          lastMessageAt: new Date(),
          messageCount: 5
        }
      ];

      mockRequest.query = { limit: '20', offset: '0' };
      mockRequest.user = { id: '1', role: 'STUDENT' };
      MockedChatbotService.prototype.getUserSessions.mockResolvedValue(mockSessions);

      await controller.getUserSessions(mockRequest as any, mockResponse as Response);

      expect(MockedChatbotService.prototype.getUserSessions).toHaveBeenCalledWith('1', 20, 0);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockSessions
      });
    });

    it('should handle missing authentication', async () => {
      mockRequest.user = undefined;

      await controller.getUserSessions(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required'
      });
    });
  });

  describe('clearChatHistory', () => {
    it('should clear chat history successfully', async () => {
      mockRequest.params = { sessionId: '1' };
      mockRequest.user = { id: '1', role: 'STUDENT' };
      MockedChatbotService.prototype.clearChatHistory.mockResolvedValue(undefined);

      await controller.clearChatHistory(mockRequest as any, mockResponse as Response);

      expect(MockedChatbotService.prototype.clearChatHistory).toHaveBeenCalledWith(1, '1');
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Chat history cleared successfully'
      });
    });

    it('should handle invalid session ID', async () => {
      mockRequest.params = { sessionId: 'invalid' };
      mockRequest.user = { id: '1', role: 'STUDENT' };

      await controller.clearChatHistory(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid session ID'
      });
    });
  });

  describe('clearAllUserHistory', () => {
    it('should clear all user history successfully', async () => {
      mockRequest.user = { id: '1', role: 'STUDENT' };
      MockedChatbotService.prototype.clearAllUserHistory.mockResolvedValue(undefined);

      await controller.clearAllUserHistory(mockRequest as any, mockResponse as Response);

      expect(MockedChatbotService.prototype.clearAllUserHistory).toHaveBeenCalledWith('1');
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'All chat history cleared successfully'
      });
    });
  });

  describe('getSuggestions', () => {
    it('should get quick suggestions successfully', async () => {
      const mockSuggestions = [
        'What is my schedule?',
        'When is the next exam?',
        'How do I submit an assignment?'
      ];

      mockRequest.query = { language: 'en', limit: '5' };
      mockRequest.user = { id: '1', role: 'STUDENT' };
      MockedChatbotService.prototype.getQuickSuggestions.mockResolvedValue(mockSuggestions);

      await controller.getSuggestions(mockRequest as any, mockResponse as Response);

      expect(MockedChatbotService.prototype.getQuickSuggestions).toHaveBeenCalledWith('1', 'en', 5);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: { suggestions: mockSuggestions }
      });
    });
  });

  describe('getFAQItems', () => {
    it('should get FAQ items successfully', async () => {
      const mockFAQItems = [
        {
          id: 1,
          question: 'How do I reset my password?',
          answer: 'You can reset your password by clicking the forgot password link on the login page.',
          category: 'ACCOUNT'
        }
      ];

      mockRequest.query = { language: 'en', limit: '10' };
      MockedChatbotService.prototype.getFAQItems.mockResolvedValue(mockFAQItems);

      await controller.getFAQItems(mockRequest as any, mockResponse as Response);

      expect(MockedChatbotService.prototype.getFAQItems).toHaveBeenCalledWith('en', 10);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: { faqItems: mockFAQItems }
      });
    });
  });

  describe('updateSessionName', () => {
    it('should update session name successfully', async () => {
      mockRequest.params = { sessionId: '1' };
      mockRequest.body = { sessionName: 'New Session Name' };
      mockRequest.user = { id: '1', role: 'STUDENT' };
      MockedChatbotService.prototype.updateSessionName.mockResolvedValue(undefined);

      await controller.updateSessionName(mockRequest as any, mockResponse as Response);

      expect(MockedChatbotService.prototype.updateSessionName).toHaveBeenCalledWith(1, '1', 'New Session Name');
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Session name updated successfully'
      });
    });

    it('should handle invalid session ID', async () => {
      mockRequest.params = { sessionId: 'invalid' };
      mockRequest.body = { sessionName: 'New Session Name' };
      mockRequest.user = { id: '1', role: 'STUDENT' };

      await controller.updateSessionName(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid session ID'
      });
    });

    it('should handle invalid session name', async () => {
      mockRequest.params = { sessionId: '1' };
      mockRequest.body = { sessionName: '' };
      mockRequest.user = { id: '1', role: 'STUDENT' };

      await controller.updateSessionName(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Session name is required and must be a string'
      });
    });
  });

  describe('deactivateSession', () => {
    it('should deactivate session successfully', async () => {
      mockRequest.params = { sessionId: '1' };
      mockRequest.user = { id: '1', role: 'STUDENT' };
      MockedChatbotService.prototype.deactivateSession.mockResolvedValue(undefined);

      await controller.deactivateSession(mockRequest as any, mockResponse as Response);

      expect(MockedChatbotService.prototype.deactivateSession).toHaveBeenCalledWith(1, '1');
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Session deactivated successfully'
      });
    });
  });

  describe('getChatbotStats', () => {
    it('should get chatbot statistics successfully (admin)', async () => {
      const mockStats = {
        totalSessions: 100,
        totalMessages: 500,
        averageResponseTime: 1.5,
        userSatisfaction: 4.2
      };

      mockRequest.query = { startDate: '2024-01-01', endDate: '2024-01-31' };
      mockRequest.user = { id: '1', role: 'ADMIN' };
      MockedChatbotService.prototype.getChatbotStats.mockResolvedValue(mockStats);

      await controller.getChatbotStats(mockRequest as any, mockResponse as Response);

      expect(MockedChatbotService.prototype.getChatbotStats).toHaveBeenCalledWith({
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31')
      });
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockStats
      });
    });

    it('should deny access to non-admin users', async () => {
      mockRequest.user = { id: '1', role: 'STUDENT' };

      await controller.getChatbotStats(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Admin access required'
      });
    });
  });

  describe('getChatbotMetrics', () => {
    it('should get chatbot metrics successfully (admin)', async () => {
      const mockMetrics = {
        dailyActiveUsers: 50,
        weeklyActiveUsers: 200,
        monthlyActiveUsers: 800,
        averageSessionLength: 5.5
      };

      mockRequest.user = { id: '1', role: 'ADMIN' };
      MockedChatbotService.prototype.getChatbotMetrics.mockResolvedValue(mockMetrics);

      await controller.getChatbotMetrics(mockRequest as any, mockResponse as Response);

      expect(MockedChatbotService.prototype.getChatbotMetrics).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockMetrics
      });
    });
  });

  describe('trackFeedback', () => {
    it('should track feedback successfully', async () => {
      const feedbackData = {
        sessionId: 1,
        messageId: 1,
        satisfaction: 4,
        comment: 'Very helpful response!'
      };

      mockRequest.body = feedbackData;
      mockRequest.user = { id: '1', role: 'STUDENT' };
      MockedChatbotService.prototype.trackFeedback.mockResolvedValue(undefined);

      await controller.trackFeedback(mockRequest as any, mockResponse as Response);

      expect(MockedChatbotService.prototype.trackFeedback).toHaveBeenCalledWith(1, 1, {
        satisfaction: 4,
        comment: 'Very helpful response!'
      });
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Feedback recorded successfully'
      });
    });

    it('should handle missing required fields', async () => {
      mockRequest.body = { sessionId: 1 };
      mockRequest.user = { id: '1', role: 'STUDENT' };

      await controller.trackFeedback(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Session ID, message ID, and satisfaction rating are required'
      });
    });

    it('should handle invalid satisfaction rating', async () => {
      mockRequest.body = {
        sessionId: 1,
        messageId: 1,
        satisfaction: 6
      };
      mockRequest.user = { id: '1', role: 'STUDENT' };

      await controller.trackFeedback(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Satisfaction rating must be a number between 1 and 5'
      });
    });
  });

  describe('refreshKnowledgeBase', () => {
    it('should refresh knowledge base successfully (admin)', async () => {
      mockRequest.user = { id: '1', role: 'ADMIN' };
      MockedChatbotService.prototype.refreshKnowledgeBase.mockResolvedValue(undefined);

      await controller.refreshKnowledgeBase(mockRequest as any, mockResponse as Response);

      expect(MockedChatbotService.prototype.refreshKnowledgeBase).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Knowledge base refreshed successfully'
      });
    });
  });

  describe('clearCache', () => {
    it('should clear AI cache successfully (admin)', async () => {
      mockRequest.body = { cacheType: 'ai' };
      mockRequest.user = { id: '1', role: 'ADMIN' };
      MockedChatbotService.prototype.clearAICache.mockImplementation(() => {});

      await controller.clearCache(mockRequest as any, mockResponse as Response);

      expect(MockedChatbotService.prototype.clearAICache).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Cache cleared successfully'
      });
    });

    it('should clear analytics cache successfully (admin)', async () => {
      mockRequest.body = { cacheType: 'analytics' };
      mockRequest.user = { id: '1', role: 'ADMIN' };
      MockedChatbotService.prototype.clearAnalyticsCache.mockImplementation(() => {});

      await controller.clearCache(mockRequest as any, mockResponse as Response);

      expect(MockedChatbotService.prototype.clearAnalyticsCache).toHaveBeenCalled();
    });

    it('should clear all cache when no type specified (admin)', async () => {
      mockRequest.body = {};
      mockRequest.user = { id: '1', role: 'ADMIN' };
      MockedChatbotService.prototype.clearAICache.mockImplementation(() => {});
      MockedChatbotService.prototype.clearAnalyticsCache.mockImplementation(() => {});

      await controller.clearCache(mockRequest as any, mockResponse as Response);

      expect(MockedChatbotService.prototype.clearAICache).toHaveBeenCalled();
      expect(MockedChatbotService.prototype.clearAnalyticsCache).toHaveBeenCalled();
    });
  });
});
