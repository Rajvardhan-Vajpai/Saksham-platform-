/**
 * Saksham Platform — Chatbot Integration (chat.js)
 * Independent JavaScript module for loading and configuring the n8n chat widget
 */

import { createChat } from 'https://cdn.jsdelivr.net/npm/@n8n/chat/dist/chat.bundle.es.js';

function initSakshamChat() {
  try {
    createChat({
      webhookUrl: 'https://wnyraj.app.n8n.cloud/webhook/3dd76b11-b8b6-40e3-a926-76040b0887f4/chat',
      mode: 'window',
      showWelcomeScreen: false,
      defaultLanguage: 'en',
      initialMessages: [
        'Namaste! 🙏 Welcome to Saksham Platform.',
        'How can I help you today with your courses, assessments, or training?'
      ],
      i18n: {
        en: {
          title: 'Saksham Assistant',
          subtitle: 'National Training & Competency Support',
          footer: 'Digital India Training Initiative',
          getStarted: 'Start New Chat',
          inputPlaceholder: 'Type your query here...',
          closeButtonTooltip: 'Close Assistant'
        }
      }
    });
    console.info('Saksham AI Chatbot initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize Saksham Chatbot:', error);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSakshamChat);
} else {
  initSakshamChat();
}
