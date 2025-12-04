# Student Chatbot - Smart Campus Assistant

## 🎯 Overview

A full-featured Student Chatbot page for the Smart Campus Assistant web app built with React + TypeScript + TailwindCSS + Framer Motion. The chatbot provides intelligent responses using a layered approach: local knowledge base, predefined responses, and OpenAI API fallback.

## 🚀 Features

### Core Functionality
- **Layered Reply Strategy**: Knowledge Base → Predefined Responses → OpenAI API
- **Multilingual Support**: Automatic Arabic/English detection and responses
- **Persistent Chat History**: localStorage with 200 message limit
- **Real-time Typing Indicators**: 1-second simulated delay with animated dots
- **Quick Prompts**: Pre-built suggestions for common queries

### UI/UX Features
- **Responsive Design**: Two-column desktop, single-column mobile
- **Modern Animations**: Framer Motion with staggered entrances
- **Dark Mode Support**: Consistent with existing dashboard theme
- **Accessibility**: Keyboard navigation, ARIA labels, focus management
- **Export/Clear**: Download chat history or clear with confirmation

## 📁 File Structure

```
src/
├── components/student/chatbot/
│   ├── ChatContainer.tsx          # Main chat interface
│   ├── ChatMessage.tsx            # Individual message bubbles
│   ├── ChatInput.tsx              # Input with quick prompts
│   ├── TypingDots.tsx             # Animated typing indicator
│   ├── QuickPrompts.tsx           # Sidebar with suggestions
│   ├── hooks/
│   │   └── useChat.ts             # Chat logic and state management
│   └── index.ts                   # Component exports
├── data/
│   ├── studentKB.json             # Knowledge base entries
│   └── predefinedStudentResponses.js  # Common Q/A pairs
└── pages/
    └── StudentChatbot.tsx         # Main page component
```

## 🔧 Backend Configuration

### Environment Variables

Create a `.env` file in your project root:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

### API Endpoint

The chatbot expects a backend endpoint at `/api/chat` that accepts:

**Request:**
```json
{
  "message": "user's question",
  "lang": "en" | "ar"
}
```

**Response:**
```json
{
  "reply": "AI response text"
}
```

### Backend Implementation Example

```javascript
// server/api/chat.js
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message, lang } = req.body;
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a helpful university assistant. Respond in ${lang === 'ar' ? 'Arabic' : 'English'}.`
        },
        {
          role: "user",
          content: message
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    res.json({
      reply: completion.choices[0].message.content
    });
  } catch (error) {
    console.error('OpenAI API error:', error);
    res.status(500).json({
      error: 'Failed to process request'
    });
  }
});
```

## 🧪 Testing Checklist

### Manual Testing

1. **Predefined Reply Test**
   - Send "hello" → Should get local reply after 1s delay
   - Send "hi" → Should get greeting response

2. **Knowledge Base Test**
   - Ask "Where is Room 203?" → Should get KB answer
   - Ask "Library hours" → Should get predefined response

3. **Language Detection Test**
   - Send Arabic message → Should get Arabic reply
   - Send English message → Should get English reply

4. **OpenAI Fallback Test**
   - Ask complex question → Should call backend API
   - Test with invalid API key → Should get fallback message

5. **UI/UX Tests**
   - Test responsive design on mobile/tablet/desktop
   - Test typing indicators and animations
   - Test copy message functionality
   - Test export chat feature
   - Test clear chat with confirmation

6. **Accessibility Tests**
   - Test keyboard navigation (Enter to send, Shift+Enter for newline)
   - Test screen reader compatibility
   - Test focus management

## 🎨 Design Features

### Visual Consistency
- Matches Professor Dashboard and Student Dashboard design language
- Uses same color scheme, rounded cards, and shadows
- Consistent dark mode implementation
- Professional spacing and typography

### Animations
- Staggered page load animations
- Smooth message entrance effects
- Hover and tap interactions
- Typing indicator with spring physics

### Responsive Layout
- Desktop: Two-column (chat + quick prompts)
- Mobile: Single column with toggleable quick prompts
- Auto-scroll to new messages
- Optimized touch interactions

## 🔒 Security Notes

- **No API keys in frontend**: All OpenAI calls go through backend
- **Input validation**: Messages are sanitized before processing
- **Rate limiting**: Consider implementing on backend
- **Error handling**: Graceful fallbacks for API failures

## 🚀 Getting Started

1. **Install dependencies** (already included):
   ```bash
   npm install framer-motion string-similarity
   ```

2. **Set up backend**:
   - Create `/api/chat` endpoint
   - Add `OPENAI_API_KEY` to environment variables
   - Test API connectivity

3. **Access the chatbot**:
   - Navigate to `/student-chatbot` in your app
   - Or use the "Chatbot" link in the student sidebar

4. **Test functionality**:
   - Try quick prompts
   - Test different message types
   - Verify language detection
   - Check responsive design

## 📝 Customization

### Adding New Knowledge Base Entries

Edit `src/data/studentKB.json`:

```json
{
  "id": "new-entry",
  "intent": "custom_intent",
  "keywords": ["keyword1", "keyword2"],
  "reply_en": "English response",
  "reply_ar": "Arabic response"
}
```

### Adding New Predefined Responses

Edit `src/data/predefinedStudentResponses.js`:

```javascript
{
  id: "new-response",
  patterns: ["pattern1", "pattern2"],
  reply_en: "English response",
  reply_ar: "Arabic response"
}
```

### Customizing Quick Prompts

Edit `src/components/student/chatbot/QuickPrompts.tsx`:

```javascript
const quickPrompts = [
  {
    id: 'custom-prompt',
    title: 'Custom Title',
    description: 'Custom description',
    prompt: 'Custom prompt text',
    icon: CustomIcon,
    color: 'from-custom-500 to-custom-600',
    // ... other properties
  }
];
```

## 🎉 Success!

The Student Chatbot is now fully integrated and ready to use. It provides a comprehensive, accessible, and visually appealing chat interface that matches your existing dashboard design while offering intelligent responses through multiple fallback layers.
