import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Bot, Plus, MessageSquare, Copy, RotateCcw, Trash, Check, Globe, Send, Sparkles, MoreVertical, Edit2, X } from 'lucide-react';
import DashboardLayout from '../components/common/DashboardLayout';
import ChatContainer from '../components/student/ai-assistant/ChatContainer';
import ChatInput from '../components/student/ai-assistant/ChatInput';
import QuickPrompts from '../components/student/ai-assistant/QuickPrompts';
import { useToast } from '../components/common/ToastProvider';
import ErrorBoundary from '../components/ErrorBoundary';
import { ChatMessage } from '../components/student/ai-assistant/ChatMessage';
import { apiClient } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface Session {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

const MAX_SESSIONS = 25;
const MAX_MESSAGES_PER_SESSION = 500;
const SAVE_DEBOUNCE_MS = 300;

export default function StudentAIAssistant() {
  const { user } = useAuth();
  const { success: showSuccess, error: showError, info: showInfo, warning: showWarning } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickPrompts, setShowQuickPrompts] = useState(true);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [language, setLanguage] = useState<'auto' | 'en' | 'ar'>('auto');
  const [showSessionsPanel, setShowSessionsPanel] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
  const DEV = import.meta.env?.DEV;

  // Reset page scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // Debounced save to localStorage
  const debouncedSave = useCallback((sessionId: string, msgs: ChatMessage[]) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      const trimmed = msgs.slice(-MAX_MESSAGES_PER_SESSION);
      localStorage.setItem(`student-ai-session-${sessionId}-messages`, JSON.stringify(trimmed));
      if (DEV) console.log('💾 Saved session messages:', sessionId, trimmed.length);
    }, SAVE_DEBOUNCE_MS);
  }, [DEV]);

  // Load sessions from localStorage
  useEffect(() => {
    const savedSessions = localStorage.getItem('student-ai-sessions');
    const savedActiveId = localStorage.getItem('student-ai-active-session');

    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions);
        setSessions(parsed);

        if (savedActiveId && parsed.find((s: Session) => s.id === savedActiveId)) {
          setActiveSessionId(savedActiveId);
        } else if (parsed.length > 0) {
          setActiveSessionId(parsed[0].id);
        } else {
          // Create initial session
          const initialSession = {
            id: String(Date.now()),
            name: 'New chat',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            messageCount: 0
          };
          setSessions([initialSession]);
          setActiveSessionId(initialSession.id);
          localStorage.setItem('student-ai-sessions', JSON.stringify([initialSession]));
          localStorage.setItem('student-ai-active-session', initialSession.id);
        }
      } catch (error) {
        console.error('Error loading sessions:', error);
        // Create initial session on error
        const initialSession = {
          id: String(Date.now()),
          name: 'New chat',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          messageCount: 0
        };
        setSessions([initialSession]);
        setActiveSessionId(initialSession.id);
      }
    } else {
      // Create initial session
      const initialSession = {
        id: String(Date.now()),
        name: 'New chat',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messageCount: 0
      };
      setSessions([initialSession]);
      setActiveSessionId(initialSession.id);
      localStorage.setItem('student-ai-sessions', JSON.stringify([initialSession]));
      localStorage.setItem('student-ai-active-session', initialSession.id);
    }
  }, []);

  // Load messages for active session
  useEffect(() => {
    if (activeSessionId) {
      const savedMessages = localStorage.getItem(`student-ai-session-${activeSessionId}-messages`);
      if (savedMessages) {
        try {
          const parsedMessages = JSON.parse(savedMessages).map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
          setMessages(parsedMessages);
        } catch (error) {
          console.error('Error loading messages:', error);
          setMessages([]);
        }
      } else {
        setMessages([]);
      }
    }
  }, [activeSessionId]);

  // Save sessions to localStorage
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('student-ai-sessions', JSON.stringify(sessions));
    }
  }, [sessions]);

  // Save active session
  useEffect(() => {
    if (activeSessionId) {
      localStorage.setItem('student-ai-active-session', activeSessionId);
    }
  }, [activeSessionId]);

  const addToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    switch (type) {
      case 'success': showSuccess(message, { showProgress: true }); break;
      case 'error': showError(message, { showProgress: true }); break;
      case 'warning': showWarning(message, { showProgress: true }); break;
      case 'info': showInfo(message, { showProgress: true }); break;
    }
  };

  // Language detection function
  const detectLanguage = (text: string): 'ar' | 'en' => {
    const arabicRegex = /[\u0600-\u06FF]/;
    return arabicRegex.test(text) ? 'ar' : 'en';
  };

  // Create new session
  const newSession = () => {
    const id = String(Date.now());
    const newSess: Session = {
      id,
      name: 'New chat',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messageCount: 0
    };

    const updatedSessions = [newSess, ...sessions].slice(0, MAX_SESSIONS);
    setSessions(updatedSessions);
    setActiveSessionId(id);
    setMessages([]);
    addToast('New chat created', 'success');
  };

  // Delete session
  const deleteSession = (sessionId: string) => {
    if (sessions.length === 1) {
      addToast('Cannot delete the last session', 'warning');
      return;
    }

    if (window.confirm('Delete this chat? This action cannot be undone.')) {
      const filtered = sessions.filter(s => s.id !== sessionId);
      setSessions(filtered);
      localStorage.removeItem(`student-ai-session-${sessionId}-messages`);

      if (activeSessionId === sessionId && filtered.length > 0) {
        setActiveSessionId(filtered[0].id);
      }

      addToast('Chat deleted', 'success');
    }
  };

  // Rename session
  const renameSession = (sessionId: string, newName: string) => {
    if (!newName.trim()) return;

    setSessions(prev => prev.map(s =>
      s.id === sessionId ? { ...s, name: newName.trim(), updatedAt: new Date().toISOString() } : s
    ));
    setEditingSessionId(null);
    addToast('Chat renamed', 'success');
  };

  // Update session metadata
  const updateSessionMetadata = useCallback((sessionId: string, messageCount: number) => {
    setSessions(prev => prev.map(s =>
      s.id === sessionId
        ? { ...s, messageCount, updatedAt: new Date().toISOString() }
        : s
    ));
  }, []);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) {
      addToast('Please enter a message before sending', 'warning');
      return;
    }

    const langToSend = language === 'auto' ? detectLanguage(text) : language;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text,
      sender: 'student',
      timestamp: new Date()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      if (DEV) console.log('Sending chat request with lang:', langToSend);
      const axios = apiClient.getInstance();
      const base = API_BASE.replace(/\/+$/, '');
      const hasApiSuffix = /\/api$/i.test(base);
      const urlPrimary = hasApiSuffix ? `${base}/chat` : `${base}/api/chat`;
      const urlFallback = `${base}/chat`;

      let resp: any;
      try {
        resp = await axios.post(urlPrimary, { message: text, lang: langToSend });
      } catch (e: any) {
        if (e?.response?.status === 404) {
          resp = await axios.post(urlFallback, { message: text, lang: langToSend });
        } else {
          throw e;
        }
      }

      const data = resp?.data;
      if (DEV) console.log('AI Response:', data);

      if (data && (data.success || data.reply)) {
        const aiResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: data.reply || data.data?.message || 'Hello! 👋',
          sender: 'ai',
          timestamp: new Date()
        };

        const finalMessages = [...newMessages, aiResponse];
        setMessages(finalMessages);
        debouncedSave(activeSessionId, finalMessages);
        updateSessionMetadata(activeSessionId, finalMessages.length);
      } else {
        throw new Error(data.error || 'Failed to get AI response');
      }
    } catch (error: any) {
      console.error('Error calling chatbot API:', error);

      const language = detectLanguage(text);

      // Show user-friendly error message in chat
      const errorResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: language === 'ar'
          ? 'عذرًا، لا أستطيع الاتصال بالخادم الآن. تأكد من تشغيل الخادم على المنفذ 3001. إذا كان الخادم يعمل، جرب مرة أخرى بعد قليل.'
          : 'Sorry, I cannot connect to the server right now. Please ensure the backend server is running on port 3001. If the server is running, please try again in a moment.',
        sender: 'ai',
        timestamp: new Date()
      };

      const finalMessages = [...newMessages, errorResponse];
      setMessages(finalMessages);
      debouncedSave(activeSessionId, finalMessages);
      updateSessionMetadata(activeSessionId, finalMessages.length);

      addToast(
        language === 'ar'
          ? 'لا يمكن الاتصال بالخادم. تأكد من تشغيله على المنفذ 3001.'
          : 'Cannot connect to server. Please ensure it\'s running on port 3001.',
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromptSelect = (prompt: string) => {
    handleSendMessage(prompt);
  };

  const handleClearChat = () => {
    if (window.confirm('Clear all messages in this chat? This action cannot be undone.')) {
      setMessages([]);
      localStorage.removeItem(`student-ai-session-${activeSessionId}-messages`);
      updateSessionMetadata(activeSessionId, 0);
      addToast('Chat cleared successfully', 'success');
    }
  };

  const copyMessage = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      addToast('Message copied to clipboard', 'success');
    } catch {
      addToast('Failed to copy message', 'error');
    }
  };

  const deleteMessage = (messageId: string) => {
    if (window.confirm('Delete this message?')) {
      const filtered = messages.filter(m => m.id !== messageId);
      setMessages(filtered);
      debouncedSave(activeSessionId, filtered);
      updateSessionMetadata(activeSessionId, filtered.length);
      addToast('Message deleted', 'success');
    }
  };

  const retryLast = () => {
    const lastUser = [...messages].reverse().find(m => m.sender === 'student');
    if (lastUser?.text) {
      const lastIndex = messages.length - 1;
      if (lastIndex >= 0 && messages[lastIndex].sender === 'ai') {
        setMessages(prev => prev.slice(0, -1));
      }
      handleSendMessage(lastUser.text);
    } else {
      addToast('No message to retry', 'warning');
    }
  };

  const activeSession = sessions.find(s => s.id === activeSessionId);

  return (
    <ErrorBoundary>
      <DashboardLayout
        userName={user ? `${user.firstName} ${user.lastName}` : "Student"}
        userType="student"
      >
        <div className="flex flex-col h-[calc(100vh-8rem)]">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">AI Assistant</h1>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Online • {activeSession?.name || 'New Chat'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSessionsPanel(!showSessionsPanel)}
                className={`p-2.5 rounded-xl transition-all lg:hidden ${showSessionsPanel
                  ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                  : 'bg-white/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 backdrop-blur-xl border border-white/20 dark:border-gray-700/50'
                  }`}
              >
                {showSessionsPanel ? <X className="w-5 h-5" /> : <MoreVertical className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex-1 flex gap-6 min-h-0 relative">
            {/* Mobile Overlay */}
            <AnimatePresence>
              {showSessionsPanel && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowSessionsPanel(false)}
                  className="absolute inset-0 bg-black/20 backdrop-blur-sm z-20 lg:hidden rounded-3xl"
                />
              )}
            </AnimatePresence>

            {/* Sessions Sidebar */}
            <AnimatePresence mode="wait">
              <motion.div
                initial={{ opacity: 0, x: -20, width: 0 }}
                animate={{
                  opacity: 1,
                  x: 0,
                  width: showSessionsPanel || window.innerWidth >= 1024 ? 320 : 0,
                  position: window.innerWidth < 1024 ? 'absolute' : 'relative',
                  zIndex: 30
                }}
                exit={{ opacity: 0, x: -20, width: 0 }}
                className={`${window.innerWidth < 1024 && !showSessionsPanel ? 'hidden' : 'flex'} flex-col bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 dark:border-gray-700/50 overflow-hidden h-full`}
              >
                <div className="p-4 border-b border-gray-100 dark:border-gray-700/50 flex items-center justify-between bg-white/50 dark:bg-gray-800/50">
                  <h3 className="font-bold text-gray-900 dark:text-white">Sessions</h3>
                  <button
                    onClick={() => {
                      newSession();
                      if (window.innerWidth < 1024) setShowSessionsPanel(false);
                    }}
                    className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {sessions.map(session => (
                    <div
                      key={session.id}
                      onClick={() => {
                        setActiveSessionId(session.id);
                        if (window.innerWidth < 1024) setShowSessionsPanel(false);
                      }}
                      className={`group p-3 rounded-xl cursor-pointer transition-all border ${activeSessionId === session.id
                        ? 'bg-indigo-50/80 dark:bg-indigo-900/30 border-indigo-100 dark:border-indigo-900/50 shadow-sm'
                        : 'bg-transparent border-transparent hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                    >
                      {editingSessionId === session.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editingName}
                            onChange={e => setEditingName(e.target.value)}
                            onBlur={() => renameSession(session.id, editingName)}
                            onKeyDown={e => e.key === 'Enter' && renameSession(session.id, editingName)}
                            className="flex-1 bg-white dark:bg-gray-900 border border-indigo-200 dark:border-indigo-800 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            autoFocus
                            onClick={e => e.stopPropagation()}
                          />
                          <button onClick={() => renameSession(session.id, editingName)} className="p-1 text-emerald-600"><Check className="w-4 h-4" /></button>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className={`font-medium text-sm truncate ${activeSessionId === session.id ? 'text-indigo-900 dark:text-indigo-100' : 'text-gray-700 dark:text-gray-300'
                              }`}>
                              {session.name}
                            </h4>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(session.updatedAt).toLocaleDateString()} • {session.messageCount} msgs
                            </p>
                          </div>
                          {activeSessionId === session.id && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingSessionId(session.id);
                                  setEditingName(session.name);
                                }}
                                className="p-1.5 hover:bg-white dark:hover:bg-gray-600 rounded-lg text-gray-500 transition-colors"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteSession(session.id);
                                }}
                                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500 transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 dark:border-gray-700/50 overflow-hidden relative">
              {/* Chat Messages */}
              <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scroll-smooth"
              >
                {messages.length === 0 && !isLoading ? (
                  <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto px-4">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-3xl flex items-center justify-center mb-6 animate-float shadow-inner">
                      <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">
                      How can I help you today?
                    </h2>
                    <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-8 max-w-md">
                      I can help you with your schedule, assignments, attendance tracking, and general academic questions.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full">
                      {[
                        { icon: "📅", text: "What's my schedule today?" },
                        { icon: "📊", text: "Check my attendance" },
                        { icon: "📝", text: "List upcoming exams" },
                        { icon: "💡", text: "Study tips for finals" }
                      ].map((prompt, idx) => (
                        <button
                          key={idx}
                          onClick={() => handlePromptSelect(prompt.text)}
                          className="p-4 bg-white/50 dark:bg-gray-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border border-white/20 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-800 rounded-2xl text-left transition-all group shadow-sm hover:shadow-md backdrop-blur-sm"
                        >
                          <span className="text-xl mb-2 block transform group-hover:scale-110 transition-transform duration-300">{prompt.icon}</span>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                            {prompt.text}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((message, index) => {
                      const isAi = message.sender === 'ai';
                      const isArabic = detectLanguage(message.text) === 'ar';

                      return (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          key={message.id}
                          className={`flex ${isAi ? 'justify-start' : 'justify-end'}`}
                        >
                          <div className={`flex gap-3 sm:gap-4 max-w-[90%] sm:max-w-[85%] ${isAi ? 'flex-row' : 'flex-row-reverse'}`}>
                            {isAi && (
                              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-md mt-1">
                                <Bot className="w-4 h-4 text-white" />
                              </div>
                            )}

                            <div className={`group relative px-5 py-3.5 sm:px-6 sm:py-4 rounded-2xl shadow-sm ${isAi
                              ? 'bg-white/60 dark:bg-gray-700/60 text-gray-800 dark:text-gray-200 rounded-tl-none border border-white/20 dark:border-gray-600/30 backdrop-blur-md'
                              : 'bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-tr-none shadow-indigo-500/20'
                              }`}>
                              <div
                                className={`whitespace-pre-wrap leading-relaxed text-sm sm:text-base ${isArabic ? 'text-right' : 'text-left'}`}
                                dir={isArabic ? 'rtl' : 'ltr'}
                              >
                                {message.text}
                              </div>

                              <div className={`flex items-center gap-2 mt-2 text-[10px] ${isAi ? 'text-gray-400' : 'text-indigo-200'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                                <span>{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                <button onClick={() => copyMessage(message.text)} className="hover:text-white transition-colors"><Copy className="w-3 h-3" /></button>
                                {isAi && <button onClick={() => deleteMessage(message.id)} className="hover:text-red-400 transition-colors"><Trash2 className="w-3 h-3" /></button>}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}

                    {isLoading && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-start"
                      >
                        <div className="flex gap-4 max-w-[85%]">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-md mt-1">
                            <Bot className="w-4 h-4 text-white" />
                          </div>
                          <div className="bg-white/60 dark:bg-gray-700/60 px-6 py-4 rounded-2xl rounded-tl-none flex items-center gap-1 border border-white/20 dark:border-gray-600/30 backdrop-blur-md">
                            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-100"></div>
                            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-200"></div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </>
                )}
              </div>

              {/* Input Area */}
              <div className="p-4 bg-white/80 dark:bg-gray-800/80 border-t border-white/20 dark:border-gray-700/50 backdrop-blur-xl sticky bottom-0 z-10">
                <div className="max-w-4xl mx-auto relative">
                  {messages.length > 0 && (
                    <div className="absolute -top-12 left-0 right-0 flex justify-center gap-2 pointer-events-none">
                      <div className="pointer-events-auto flex gap-2">
                        <button
                          onClick={handleClearChat}
                          className="px-3 py-1.5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md text-xs font-medium text-red-500 shadow-sm border border-red-100 dark:border-red-900/30 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Clear
                        </button>
                        {messages[messages.length - 1]?.sender === 'ai' && (
                          <button
                            onClick={retryLast}
                            className="px-3 py-1.5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md text-xs font-medium text-gray-600 dark:text-gray-300 shadow-sm border border-gray-200 dark:border-gray-700 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-1"
                          >
                            <RotateCcw className="w-3 h-3" /> Regenerate
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  <ChatInput
                    onSendMessage={handleSendMessage}
                    isLoading={isLoading}
                    chromeless
                  />

                  <div className="text-center mt-2">
                    <p className="text-[10px] text-gray-400">
                      AI can make mistakes. Consider checking important information.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ErrorBoundary>
  );
}
