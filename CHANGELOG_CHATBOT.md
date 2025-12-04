## Chatbot Improvements Changelog

- feat(chatbot): move predefined responses to `src/data/predefinedResponses.js`
- feat(chatbot): add fuzzy matching and KB lookup via `src/utils/matching.js` and `src/data/knowledgeBase.json`
- feat(chatbot): introduce `ChatContainer` with localStorage persistence, typing indicator, and auto-scroll
- feat(chatbot): framer-motion animations for messages; improved `ChatInput` (enter/shift+enter, disabled state)
- feat(chatbot): backend `/api/chat` proxy to OpenAI via Express (`server/index.js`, `server/api/chat.js`)
- chore: add dependencies `framer-motion`, `string-similarity`, and server middleware

Enable OpenAI:
- Set `OPENAI_API_KEY` in your environment (create `.env` and export) and run `npm run server`.

