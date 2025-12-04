import { Router } from 'express';
import { ChatbotController } from '../controllers/chatbot.controller.js';
import prisma from '../../config/database.js';
import { AuthMiddleware } from '../middleware/auth.middleware.js';

const router = Router();
const chatbotController = new ChatbotController(prisma);

// Apply authentication middleware to all routes
router.use(AuthMiddleware.authenticate());

/**
 * @route POST /api/chatbot/message
 * @desc Send message and get AI response
 * @access Private
 */
router.post('/message', (req, res) => {
  chatbotController.sendMessage(req, res);
});

/**
 * @route GET /api/chatbot/sessions
 * @desc Get user's chat sessions
 * @access Private
 */
router.get('/sessions', (req, res) => {
  chatbotController.getUserSessions(req, res);
});

/**
 * @route GET /api/chatbot/history/:sessionId
 * @desc Get chat history for a specific session
 * @access Private
 */
router.get('/history/:sessionId', (req, res) => {
  chatbotController.getChatHistory(req, res);
});

/**
 * @route DELETE /api/chatbot/history/:sessionId
 * @desc Clear chat history for a specific session
 * @access Private
 */
router.delete('/history/:sessionId', (req, res) => {
  chatbotController.clearChatHistory(req, res);
});

/**
 * @route DELETE /api/chatbot/history
 * @desc Clear all chat history for the user
 * @access Private
 */
router.delete('/history', (req, res) => {
  chatbotController.clearAllUserHistory(req, res);
});

/**
 * @route GET /api/chatbot/suggestions
 * @desc Get quick suggestions based on user context
 * @access Private
 */
router.get('/suggestions', (req, res) => {
  chatbotController.getSuggestions(req, res);
});

/**
 * @route GET /api/chatbot/faq
 * @desc Get FAQ items
 * @access Public (no authentication required for FAQ)
 */
router.get('/faq', (req, res) => {
  chatbotController.getFAQItems(req, res);
});

/**
 * @route PUT /api/chatbot/sessions/:sessionId/name
 * @desc Update session name
 * @access Private
 */
router.put('/sessions/:sessionId/name', (req, res) => {
  chatbotController.updateSessionName(req, res);
});

/**
 * @route DELETE /api/chatbot/sessions/:sessionId
 * @desc Deactivate a chat session
 * @access Private
 */
router.delete('/sessions/:sessionId', (req, res) => {
  chatbotController.deactivateSession(req, res);
});

/**
 * @route POST /api/chatbot/feedback
 * @desc Track user feedback for a message
 * @access Private
 */
router.post('/feedback', (req, res) => {
  chatbotController.trackFeedback(req, res);
});

// Admin-only routes
/**
 * @route GET /api/chatbot/stats
 * @desc Get chatbot statistics (Admin only)
 * @access Private (Admin)
 */
router.get('/stats', (req, res) => {
  chatbotController.getChatbotStats(req, res);
});

/**
 * @route GET /api/chatbot/metrics
 * @desc Get chatbot metrics (Admin only)
 * @access Private (Admin)
 */
router.get('/metrics', (req, res) => {
  chatbotController.getChatbotMetrics(req, res);
});

/**
 * @route POST /api/chatbot/refresh-knowledge
 * @desc Refresh knowledge base (Admin only)
 * @access Private (Admin)
 */
router.post('/refresh-knowledge', (req, res) => {
  chatbotController.refreshKnowledgeBase(req, res);
});

/**
 * @route POST /api/chatbot/clear-cache
 * @desc Clear AI and analytics cache (Admin only)
 * @access Private (Admin)
 */
router.post('/clear-cache', (req, res) => {
  chatbotController.clearCache(req, res);
});

export default router;
