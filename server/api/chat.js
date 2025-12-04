// 🟢 تحميل متغيرات البيئة من .env
import 'dotenv/config';
import express from 'express';
import OpenAI from 'openai';
import prisma from '../../config/database.js';
import { ChatbotService } from '../../src/services/chatbot.service.js';

const router = express.Router();

// Helper to get OpenAI client with current env vars
const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === 'your-openai-api-key-here') return null;

  return new OpenAI({
    apiKey: apiKey,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'http://localhost:5173',
      'X-Title': process.env.OPENROUTER_SITE_NAME || 'Smart Campus Assistant'
    }
  });
};

// Initialize ChatbotService with singleton prisma
const chatbotService = new ChatbotService(prisma);

// Enhanced chatbot endpoint with proper AI integration
router.get('/chat/ping', (req, res) => res.json({ ok: true, route: '/api/chat/ping' }));
router.get('/ping', (req, res) => res.json({ ok: true, route: '/api/chat/ping' }));

// Main chat handler logic
const handleChatRequest = async (req, res) => {
  const { message, lang, userId } = req.body || {};

  // ✅ Check for valid API key
  const envKey = process.env.OPENAI_API_KEY;
  const openai = getOpenAIClient();
  const hasValidApiKey = !!openai;

  console.log(`🔍 Debug: Checking API Key...`);
  console.log(`- Env Key exists: ${!!envKey}`);
  console.log(`- Env Key length: ${envKey ? envKey.length : 0}`);
  console.log(`- Env Key start: ${envKey ? envKey.substring(0, 5) + '...' : 'N/A'}`);

  if (!hasValidApiKey) {
    console.warn("⚠️ Chatbot Warning: OPENAI_API_KEY is missing or invalid.");
  }

  if (!message) return res.status(400).json({ error: 'Missing message' });

  // Enhanced fallback responses (Offline Mode)
  const generateIntelligentResponse = (message, lang) => {
    const m = (message || '').toLowerCase().trim();
    const isAR = (lang === 'ar');

    const direct = (en, ar) => (isAR ? ar : en);

    // 1. Greetings
    if (['hello', 'hi', 'hey', 'مرحبا', 'السلام', 'اهلاً', 'اهلا'].some(k => m.includes(k))) {
      return direct(
        "Hi there! I'm currently in offline mode, but I can still help you check your schedule, attendance, or course list. What would you like to see?",
        "أهلاً بك! أنا حالياً في وضع عدم الاتصال، لكن لا يزال بإمكاني مساعدتك في معرفة جدولك، حضورك، أو قائمة موادك. ماذا تود أن تعرف؟"
      );
    }

    // 2. Status / How are you
    if (['how are you', 'how r u', 'كيف حالك', 'كيفك', 'اخبارك'].some(k => m.includes(k))) {
      return direct(
        "I'm functioning, but I need my API key to be fully smart! For now, ask me about 'schedule', 'courses', or 'attendance'.",
        "أنا أعمل، لكن أحتاج لمفتاح API لأكون ذكياً بالكامل! حالياً، يمكنك سؤالي عن 'الجدول'، 'المواد'، أو 'الحضور'."
      );
    }

    // 3. Courses
    if (['course', 'subject', 'class', 'مادة', 'كورس', 'مواد'].some(k => m.includes(k))) {
      return direct(
        'I can help with courses. Try asking "What are my courses?" or checking the "My Courses" page.',
        'يمكنني المساعدة في المواد. جرب أن تسأل "ما هي موادي؟" أو تفقد صفحة "مقرراتي".'
      );
    }

    // 4. Schedule
    if (['schedule', 'time', 'when', 'موعد', 'جدول', 'وقت', 'today', 'اليوم'].some(k => m.includes(k))) {
      return direct(
        "For your schedule, please check the Schedule page in the menu. I can't fetch real-time data in offline mode yet.",
        "لمعرفة جدولك، يرجى التحقق من صفحة الجدول في القائمة. لا يمكنني جلب بيانات حية في وضع عدم الاتصال حالياً."
      );
    }

    // 5. Attendance
    if (['attendance', 'present', 'absent', 'حضور', 'غياب', 'نسبة'].some(k => m.includes(k))) {
      return direct(
        'You can view your detailed attendance records on the "Attendance" page.',
        'يمكنك رؤية سجلات حضورك التفصيلية في صفحة "الحضور".'
      );
    }

    // Default Fallback
    return direct(
      "I'm currently offline (API Key missing). Please check the dashboard for Schedules, Courses, and Attendance info.",
      "أنا حالياً غير متصل (مفتاح API مفقود). يرجى التحقق من لوحة التحكم لمعرفة الجداول، المواد، ومعلومات الحضور."
    );
  };

  try {
    // If no valid API key, use intelligent fallback responses
    if (!hasValidApiKey) {
      const reply = generateIntelligentResponse(message, lang || 'en');

      res.json({
        success: true,
        reply,
        suggestions: [
          "What are my classes today?",
          "Show my attendance status",
          "Course information",
          "Help with assignments"
        ],
        isOffline: true // Flag to let frontend know
      });
      return;
    }

    // Use the enhanced chatbot service if userId is provided
    if (userId) {
      const parsedUserId = parseInt(String(userId), 10);

      if (isNaN(parsedUserId)) {
        console.warn(`⚠️ Invalid userId received: ${userId}`);
        // Fallback to anonymous mode if userId is invalid
      } else {
        const chatRequest = {
          message: message.trim(),
          language: lang || 'en',
          context: {}
        };

        // Inject the client into the service if needed, or ensure service uses the same env var
        // Since ChatbotService likely uses OpenAI internally, we should check it too.
        // For now, we assume ChatbotService handles its own OpenAI instance or we might need to pass it.
        // Looking at the imports, ChatbotService is imported. Let's assume it reads process.env too.

        const response = await chatbotService.processMessage(chatRequest, parsedUserId);

        res.json({
          success: true,
          reply: response.message.content,
          suggestions: response.suggestions,
          session: response.session
        });
        return; // Exit here if successful
      }
    }

    // Fallback for anonymous users or invalid userId
    // For anonymous users with valid API key, use AI
    const system = `You are Smart Campus AI Assistant for Smart Campus University. Provide direct, specific answers in ${lang === 'ar' ? 'Arabic' : 'English'} about university life, courses, schedules, and academic matters. Never use generic phrases like "I understand you're asking about..." or "I can help you with...". Start with the direct answer immediately.`;

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "meta-llama/llama-3.3-8b-instruct",
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: message }
      ],
      max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 1000,
      temperature: 0.7
    });

    const reply = completion.choices?.[0]?.message?.content || generateIntelligentResponse(message, lang || 'en');
    res.json({
      success: true,
      reply,
      suggestions: [
        "What are my classes today?",
        "Show my attendance status",
        "Course information",
        "Help with assignments"
      ]
    });
  } catch (err) {
    console.error('❌ Chatbot error:', err?.response?.data || err?.message);

    // Use intelligent fallback response for any error
    const reply = generateIntelligentResponse(message, lang || 'en');

    res.json({
      success: true,
      reply,
      suggestions: [
        "What are my classes today?",
        "Show my attendance status",
        "Course information",
        "Help with assignments"
      ]
    });
  }
};

// Main chat endpoint - handles POST /api/chat
router.post('/', handleChatRequest);

// Alternative endpoint path - POST /api/chat/chat (for backward compatibility)
router.post('/chat', handleChatRequest);

// Enhanced chatbot endpoint with database integration
router.post('/enhanced', async (req, res) => {
  res.json({
    success: true,
    message: 'Enhanced chatbot endpoint - coming soon',
    data: {
      reply: 'Enhanced chatbot functionality will be implemented soon',
      session: null,
      suggestions: [],
      analytics: {}
    }
  });
});

// Get chat history endpoint
router.get('/history/:sessionId', async (req, res) => {
  res.json({
    success: true,
    message: 'Get chat history endpoint - coming soon',
    data: { history: [] }
  });
});

// Get user sessions endpoint
router.get('/sessions', async (req, res) => {
  res.json({
    success: true,
    message: 'Get user sessions endpoint - coming soon',
    data: { sessions: [] }
  });
});

// Get suggestions endpoint
router.get('/suggestions', async (req, res) => {
  res.json({
    success: true,
    message: 'Get suggestions endpoint - coming soon',
    data: { suggestions: [] }
  });
});

// Get FAQ endpoint
router.get('/faq', async (req, res) => {
  res.json({
    success: true,
    message: 'Get FAQ endpoint - coming soon',
    data: { faqItems: [] }
  });
});

// Clear chat history endpoint
router.delete('/history/:sessionId', async (req, res) => {
  res.json({
    success: true,
    message: 'Clear chat history endpoint - coming soon'
  });
});

// Track feedback endpoint
router.post('/feedback', async (req, res) => {
  res.json({
    success: true,
    message: 'Track feedback endpoint - coming soon'
  });
});

export default router;
