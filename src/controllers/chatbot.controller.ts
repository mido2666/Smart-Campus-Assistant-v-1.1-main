import { Request, Response } from 'express';
import { ChatbotService } from '../services/chatbot.service.js';
import { PrismaClient } from '@prisma/client';
import { ChatRequest, ChatbotError } from '../types/chatbot.types.js';

export class ChatbotController {
  private chatbotService: ChatbotService;
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.chatbotService = new ChatbotService(prisma);
  }

  /**
   * Send message and get AI response
   * POST /api/chatbot/message
   */
  async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const { message, sessionId, language, context } = req.body;

      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        res.status(400).json({
          success: false,
          message: 'Message is required and must be a non-empty string'
        });
        return;
      }

      const chatRequest: ChatRequest = {
        message: message.trim(),
        sessionId: sessionId ? parseInt(sessionId) : undefined,
        language: language || 'en',
        context
      };

      const response = await this.chatbotService.processMessage(chatRequest, userId);

      res.json({
        success: true,
        data: {
          message: response.message,
          session: response.session,
          suggestions: response.suggestions,
          analytics: response.analytics
        }
      });
    } catch (error) {
      console.error('Error in sendMessage:', error);

      if (error instanceof ChatbotError) {
        res.status(400).json({
          success: false,
          message: error.message,
          code: error.code,
          details: error.details
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
          details: error.message
        });
      }
    }
  }

  /**
   * Get chat history for a session
   * GET /api/chatbot/history/:sessionId
   */
  async getChatHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const sessionId = parseInt(req.params.sessionId);
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      if (isNaN(sessionId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid session ID'
        });
        return;
      }

      const history = await this.chatbotService.getChatHistory(sessionId, userId, limit, offset);

      res.json({
        success: true,
        data: history
      });
    } catch (error) {
      console.error('Error in getChatHistory:', error);

      if (error instanceof ChatbotError) {
        res.status(400).json({
          success: false,
          message: error.message,
          code: error.code
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
          details: error.message
        });
      }
    }
  }

  /**
   * Get user's chat sessions
   * GET /api/chatbot/sessions
   */
  async getUserSessions(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      const sessions = await this.chatbotService.getUserSessions(userId, limit, offset);

      res.json({
        success: true,
        data: sessions
      });
    } catch (error) {
      console.error('Error in getUserSessions:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        details: error.message
      });
    }
  }

  /**
   * Clear chat history for a session
   * DELETE /api/chatbot/history/:sessionId
   */
  async clearChatHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const sessionId = parseInt(req.params.sessionId);

      if (isNaN(sessionId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid session ID'
        });
        return;
      }

      await this.chatbotService.clearChatHistory(sessionId, userId);

      res.json({
        success: true,
        message: 'Chat history cleared successfully'
      });
    } catch (error) {
      console.error('Error in clearChatHistory:', error);

      if (error instanceof ChatbotError) {
        res.status(400).json({
          success: false,
          message: error.message,
          code: error.code
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
          details: error.message
        });
      }
    }
  }

  /**
   * Clear all chat history for a user
   * DELETE /api/chatbot/history
   */
  async clearAllUserHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      await this.chatbotService.clearAllUserHistory(userId);

      res.json({
        success: true,
        message: 'All chat history cleared successfully'
      });
    } catch (error) {
      console.error('Error in clearAllUserHistory:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        details: error.message
      });
    }
  }

  /**
   * Get quick suggestions
   * GET /api/chatbot/suggestions
   */
  async getSuggestions(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const language = req.query.language as string || 'en';
      const limit = parseInt(req.query.limit as string) || 5;

      const suggestions = await this.chatbotService.getQuickSuggestions(userId, language, limit);

      res.json({
        success: true,
        data: {
          suggestions
        }
      });
    } catch (error) {
      console.error('Error in getSuggestions:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        details: error.message
      });
    }
  }

  /**
   * Get FAQ items
   * GET /api/chatbot/faq
   */
  async getFAQItems(req: Request, res: Response): Promise<void> {
    try {
      const language = req.query.language as string || 'en';
      const limit = parseInt(req.query.limit as string) || 10;

      const faqItems = await this.chatbotService.getFAQItems(language, limit);

      res.json({
        success: true,
        data: {
          faqItems
        }
      });
    } catch (error) {
      console.error('Error in getFAQItems:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        details: error.message
      });
    }
  }

  /**
   * Update session name
   * PUT /api/chatbot/sessions/:sessionId/name
   */
  async updateSessionName(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const sessionId = parseInt(req.params.sessionId);
      const { sessionName } = req.body;

      if (isNaN(sessionId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid session ID'
        });
        return;
      }

      if (!sessionName || typeof sessionName !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Session name is required and must be a string'
        });
        return;
      }

      await this.chatbotService.updateSessionName(sessionId, userId, sessionName.trim());

      res.json({
        success: true,
        message: 'Session name updated successfully'
      });
    } catch (error) {
      console.error('Error in updateSessionName:', error);

      if (error instanceof ChatbotError) {
        res.status(400).json({
          success: false,
          message: error.message,
          code: error.code
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
          details: error.message
        });
      }
    }
  }

  /**
   * Deactivate session
   * DELETE /api/chatbot/sessions/:sessionId
   */
  async deactivateSession(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const sessionId = parseInt(req.params.sessionId);

      if (isNaN(sessionId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid session ID'
        });
        return;
      }

      await this.chatbotService.deactivateSession(sessionId, userId);

      res.json({
        success: true,
        message: 'Session deactivated successfully'
      });
    } catch (error) {
      console.error('Error in deactivateSession:', error);

      if (error instanceof ChatbotError) {
        res.status(400).json({
          success: false,
          message: error.message,
          code: error.code
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
          details: error.message
        });
      }
    }
  }

  /**
   * Get chatbot statistics (Admin only)
   * GET /api/chatbot/stats
   */
  async getChatbotStats(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      if (userRole !== 'ADMIN') {
        res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
        return;
      }

      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const timeRange = startDate && endDate ? { start: startDate, end: endDate } : undefined;

      const stats = await this.chatbotService.getChatbotStats(timeRange);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error in getChatbotStats:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        details: error.message
      });
    }
  }

  /**
   * Get chatbot metrics (Admin only)
   * GET /api/chatbot/metrics
   */
  async getChatbotMetrics(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      if (userRole !== 'ADMIN') {
        res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
        return;
      }

      const metrics = await this.chatbotService.getChatbotMetrics();

      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      console.error('Error in getChatbotMetrics:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        details: error.message
      });
    }
  }

  /**
   * Track user feedback
   * POST /api/chatbot/feedback
   */
  async trackFeedback(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const { sessionId, messageId, satisfaction, comment } = req.body;

      if (!sessionId || !messageId || satisfaction === undefined) {
        res.status(400).json({
          success: false,
          message: 'Session ID, message ID, and satisfaction rating are required'
        });
        return;
      }

      if (typeof satisfaction !== 'number' || satisfaction < 1 || satisfaction > 5) {
        res.status(400).json({
          success: false,
          message: 'Satisfaction rating must be a number between 1 and 5'
        });
        return;
      }

      await this.chatbotService.trackFeedback(
        parseInt(sessionId),
        parseInt(messageId),
        {
          satisfaction,
          comment: comment || undefined
        }
      );

      res.json({
        success: true,
        message: 'Feedback recorded successfully'
      });
    } catch (error) {
      console.error('Error in trackFeedback:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        details: error.message
      });
    }
  }

  /**
   * Refresh knowledge base (Admin only)
   * POST /api/chatbot/refresh-knowledge
   */
  async refreshKnowledgeBase(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      if (userRole !== 'ADMIN') {
        res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
        return;
      }

      await this.chatbotService.refreshKnowledgeBase();

      res.json({
        success: true,
        message: 'Knowledge base refreshed successfully'
      });
    } catch (error) {
      console.error('Error in refreshKnowledgeBase:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        details: error.message
      });
    }
  }

  /**
   * Clear AI cache (Admin only)
   * POST /api/chatbot/clear-cache
   */
  async clearCache(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      if (userRole !== 'ADMIN') {
        res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
        return;
      }

      const { cacheType } = req.body;

      if (cacheType === 'ai') {
        this.chatbotService.clearAICache();
      } else if (cacheType === 'analytics') {
        this.chatbotService.clearAnalyticsCache();
      } else {
        this.chatbotService.clearAICache();
        this.chatbotService.clearAnalyticsCache();
      }

      res.json({
        success: true,
        message: 'Cache cleared successfully'
      });
    } catch (error) {
      console.error('Error in clearCache:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        details: error.message
      });
    }
  }
}
