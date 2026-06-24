// chat.js — SmartInvest AI Chatbot widget
// Floating chat button + panel that talks to /api/chat backend.
// Only visible when the user is logged in.

(function () {
  'use strict';

  const STORAGE_KEY = 'smartinvest_chat_history';
  const MAX_STORED = 40;

  // ── State ──────────────────────────────────────────────────────────────────
  let isOpen = false;
  let isTyping = false;
  let history = []; // loaded from localStorage on init
  let suggestionsShown = true; // false after first real message

  // ── Suggested starter questions (bilingual) ────────────────────────────────
  const SUGGESTIONS = {
    en: [
      'Why am I classified as this risk profile?',
      'Is my portfolio well diversified?',
      'What is the Sharpe ratio and why does it matter?',
      'How will my wealth grow over 10 years?',
    ],
    ar: [
      'لماذا تم تصنيفي بهذا الملف الاستثماري؟',
      'هل محفظتي متنوعة بشكل جيد؟',
      'ما هو معامل شارب ولماذا هو مهم؟',
      'كيف ستنمو ثروتي خلال 10 سنوات؟',
    ],
  };

  // ── DOM helpers ────────────────────────────────────────────────────────────
  function $(id) {
    return document.getElementById(id);
  }

  function currentLang() {
    // getLang() is defined in i18n.js  (NOT getCurrentLang)
    return typeof getLang === 'function' ? getLang() : 'en';
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Convert **bold** and newlines to HTML
  function formatMessage(text) {
    return escapeHtml(text)
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
  }

  // ── Message rendering ──────────────────────────────────────────────────────
  function appendMessage(role, content) {
    const messages = $('chat-messages');
    const wrapper = document.createElement('div');
    wrapper.className = `chat-msg chat-msg-${role}`;

    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble';
    bubble.innerHTML = formatMessage(content);

    wrapper.appendChild(bubble);
    messages.appendChild(wrapper);
    messages.scrollTop = messages.scrollHeight;
  }

  function showTypingIndicator() {
    const messages = $('chat-messages');
    const wrapper = document.createElement('div');
    wrapper.className = 'chat-msg chat-msg-assistant';
    wrapper.id = 'chat-typing';

    wrapper.innerHTML = `
      <div class="chat-bubble chat-typing-bubble">
        <span class="chat-dot"></span>
        <span class="chat-dot"></span>
        <span class="chat-dot"></span>
      </div>`;
    messages.appendChild(wrapper);
    messages.scrollTop = messages.scrollHeight;
  }

  function removeTypingIndicator() {
    const el = $('chat-typing');
    if (el) el.remove();
  }

  // ── Suggestions ────────────────────────────────────────────────────────────
  function renderSuggestions() {
    if (!suggestionsShown) return;
    if (history.length > 0) {
      hideSuggestions();
      return;
    }

    const container = $('chat-suggestions');
    if (!container) return;
    const lang = currentLang();
    const list = SUGGESTIONS[lang] || SUGGESTIONS.en;

    container.innerHTML = list
      .map(
        q =>
          `<button class="chat-suggestion-btn" data-suggestion="${escapeHtml(q)}">${escapeHtml(q)}</button>`,
      )
      .join('');

    container.style.display = 'flex';
  }

  function hideSuggestions() {
    const sugg = $('chat-suggestions');
    if (sugg) sugg.style.display = 'none';
    suggestionsShown = false;
  }

  // Called from inline onclick (global)
  window.chatSendSuggestion = function (text) {
    const input = $('chat-input');
    if (input) {
      input.value = text;
      sendMessage();
    }
  };

  // ── Send message ───────────────────────────────────────────────────────────
  async function sendMessage() {
    if (isTyping) return;

    const input = $('chat-input');
    const message = (input.value || '').trim();
    if (!message) return;

    input.value = '';
    autoResize(input);

    if (suggestionsShown) hideSuggestions();

    // Push user message to history + DOM
    history.push({ role: 'user', content: message });
    saveHistory();
    appendMessage('user', message);

    isTyping = true;
    showTypingIndicator();

    try {
      const data = await apiCall('/api/chat', 'POST', {
        message,
        history: history.slice(0, -1),
      });

      removeTypingIndicator();

      const reply =
        data && data.reply ? data.reply : 'Sorry, I could not get a response.';
      history.push({ role: 'assistant', content: reply });
      saveHistory();
      appendMessage('assistant', reply);
    } catch (err) {
      removeTypingIndicator();
      const errMsg =
        err && err.data && err.data.error
          ? err.data.error
          : 'Connection error. Please try again.';
      appendMessage('assistant', `⚠️ ${errMsg}`);
    } finally {
      isTyping = false;
    }
  }

  // ── Auto-resize textarea ───────────────────────────────────────────────────
  function autoResize(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }

  // ── Toggle open / close ────────────────────────────────────────────────────
  function openChat() {
    isOpen = true;
    $('chat-panel').classList.add('chat-panel-open');
    $('chat-fab').style.display = 'none';
    renderSuggestions();
    setTimeout(() => $('chat-input') && $('chat-input').focus(), 200);
  }

  function closeChat() {
    isOpen = false;
    $('chat-panel').classList.remove('chat-panel-open');
    $('chat-fab').style.display = 'flex';
  }

  // ── Persistence helpers ────────────────────────────────────────────────────
  function saveHistory() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(history.slice(-MAX_STORED)),
      );
    } catch (_) {}
  }

  function loadHistory() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) history = JSON.parse(raw);
    } catch (_) {
      history = [];
    }
  }

  function appendMessage(role, content) {
    const container = $('chat-messages');
    if (!container) return;
    const wrapper = document.createElement('div');
    wrapper.className = `chat-msg chat-msg-${role}`;
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble';
    bubble.innerHTML = formatMessage(content);
    wrapper.appendChild(bubble);
    container.appendChild(wrapper);
    container.scrollTop = container.scrollHeight;
  }

  // Replay persisted messages into DOM without re-saving
  function renderHistory() {
    const container = $('chat-messages');
    if (!container || history.length === 0) return;
    // Hide the static welcome bubble
    const welcomeRow = container.querySelector('.chat-msg-assistant');
    if (welcomeRow) welcomeRow.style.display = 'none';
    history.forEach(({ role, content }) => appendMessage(role, content));
    hideSuggestions();
  }

  // ── Init ───────────────────────────────────────────────────────────────────
  function init() {
    if (!isLoggedIn()) return;

    loadHistory();

    // ── FAB ──
    const fab = document.createElement('button');
    fab.id = 'chat-fab';
    fab.className = 'chat-fab';
    fab.title = 'Ask SmartInvest Assistant';
    fab.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="26" height="26"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`;
    fab.addEventListener('click', openChat);
    document.body.appendChild(fab);

    // ── Panel ──
    const panel = document.createElement('div');
    panel.id = 'chat-panel';
    panel.className = 'chat-panel';
    panel.innerHTML = `
      <div class="chat-header">
        <div class="chat-header-info">
          <span class="chat-avatar">🤖</span>
          <div>
            <div class="chat-header-name" data-i18n="chat_title">SmartInvest Assistant</div>
            <div class="chat-header-sub" data-i18n="chat_subtitle">Your personal investment advisor</div>
          </div>
        </div>
        <div style="display:flex;gap:4px;align-items:center;">
          <button class="chat-close-btn" id="chat-clear-btn" title="Clear history">🗑️</button>
          <button class="chat-close-btn" id="chat-close-btn" title="Close">✕</button>
        </div>
      </div>

      <div class="chat-messages" id="chat-messages">
        <div class="chat-msg chat-msg-assistant">
          <div class="chat-bubble" id="chat-welcome"></div>
        </div>
        <div id="chat-suggestions" class="chat-suggestions" style="display:none;flex-direction:column;gap:6px;padding:2px 0 4px;"></div>
      </div>

      <div class="chat-input-row">
        <textarea
          id="chat-input"
          class="chat-input"
          rows="1"
          placeholder="Ask me anything…"
          data-i18n-placeholder="chat_placeholder"
          maxlength="1000"
        ></textarea>
        <button class="chat-send-btn" id="chat-send-btn" title="Send">
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
        </button>
      </div>`;
    document.body.appendChild(panel);

    // ── Wire events ──
    $('chat-send-btn').addEventListener('click', sendMessage);
    $('chat-close-btn').addEventListener('click', closeChat);

    $('chat-clear-btn').addEventListener('click', () => {
      history = [];
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (_) {}
      suggestionsShown = true;
      // Clear all messages except welcome row
      const container = $('chat-messages');
      Array.from(container.children).forEach(child => {
        if (!child.querySelector('#chat-welcome')) child.remove();
      });
      const welcomeRow = container.querySelector('.chat-msg-assistant');
      if (welcomeRow) welcomeRow.style.display = '';
      updateWelcomeMessage();
      renderSuggestions();
    });

    $('chat-input').addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
    $('chat-input').addEventListener('input', function () {
      autoResize(this);
    });

    // ── Suggestion click via event delegation (reliable, no inline onclick) ──
    $('chat-suggestions').addEventListener('click', e => {
      const btn = e.target.closest('.chat-suggestion-btn');
      if (!btn) return;
      const text = btn.dataset.suggestion;
      if (text) {
        $('chat-input').value = text;
        sendMessage();
      }
    });

    document.chatWidget = { close: closeChat, open: openChat };

    // ── Restore or show welcome ──
    updateWelcomeMessage();
    if (history.length > 0) {
      renderHistory();
    }

    // ── Language change ──
    document.addEventListener('langchange', () => {
      updateWelcomeMessage();
      if (isOpen && suggestionsShown) renderSuggestions();
    });
  }

  function updateWelcomeMessage() {
    const el = $('chat-welcome');
    if (!el) return;
    if (history.length > 0) return; // restored history is showing, not the welcome

    const user = typeof getUser === 'function' ? getUser() : null;
    const name = user ? user.name : '';
    const lang = currentLang(); // ← uses getLang() from i18n.js, respects AR/EN

    if (lang === 'ar') {
      el.innerHTML = name
        ? `مرحباً <strong>${escapeHtml(name)}</strong>! أنا مساعدك الاستثماري الشخصي. اسألني عن محفظتك أو ملفك الاستثماري أو أي شيء يتعلق بالاستثمار.`
        : `مرحباً! أنا مساعد SmartInvest. اسألني عن محفظتك أو ملفك الاستثماري أو أي شيء يتعلق بالاستثمار.`;
    } else {
      el.innerHTML = name
        ? `Hi <strong>${escapeHtml(name)}</strong>! I'm your personal investment assistant. Ask me anything about your portfolio, risk profile, or investment strategy.`
        : `Hi! I'm your SmartInvest assistant. Ask me anything about your portfolio, risk profile, or investment strategy.`;
    }
  }

  // ── Bootstrap ──────────────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
