(() => {
  // Session ID lives only in memory — gone on page exit/refresh, never persisted
  const sessionId = crypto.randomUUID();

  const chipsContainer    = document.getElementById('chips-container');
  const followUpContainer = document.getElementById('follow-up-buttons');

  const OUT_OF_DOMAIN_MSG =
    "I can only help with mortgage-related questions — concepts, interest rate tracks, " +
    "loan types, or Bank of Israel regulations. Please try a different question.";

  // ── session clear on page exit ──────────────────────────────────────────────
  window.addEventListener('beforeunload', () => {
    navigator.sendBeacon(
      '/api/bot/session/clear',
      JSON.stringify({ sessionId })
    );
  });

  // ── chip row clicks (delegated) ─────────────────────────────────────────────
  chipsContainer.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (chip) handleQuery(chip.dataset.query);
  });

  // ── follow-up button clicks (delegated — buttons are added dynamically) ─────
  followUpContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (btn) handleQuery(btn.dataset.query);
  });

  // ── free-text submit ────────────────────────────────────────────────────────
  ChatInput.onSubmit((text) => handleQuery(text));

  // ── core query handler ──────────────────────────────────────────────────────
  async function handleQuery(query) {
    if (!query) return;

    DisclaimerBox.hide();
    clearFollowUps();
    ChatInput.lock();
    ChatWindow.appendUserMessage(query);
    ChatWindow.showTyping();

    try {
      const res  = await fetch('/api/bot/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ query, sessionId }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      ChatWindow.hideTyping();
      _handleDecision(data);
    } catch {
      ChatWindow.hideTyping();
      ChatWindow.appendBotMessage(
        'Sorry, something went wrong reaching the server. Please try again.'
      );
    } finally {
      ChatInput.unlock();
    }
  }

  function _handleDecision({ decision, reply, followUps }) {
    switch (decision) {
      case 'EDUCATION':
      case 'AMBIGUOUS':
        ChatWindow.appendBotMessage(reply);
        renderFollowUps(followUps);
        break;

      case 'ADVISORY':
        ChatWindow.appendBotMessage(reply);
        DisclaimerBox.show();
        renderFollowUps(followUps);
        break;

      case 'OUT_OF_DOMAIN':
        ChatWindow.appendBotMessage(OUT_OF_DOMAIN_MSG);
        break;

      default:
        ChatWindow.appendBotMessage(reply || OUT_OF_DOMAIN_MSG);
    }
  }

  // ── follow-up helpers ───────────────────────────────────────────────────────
  function renderFollowUps(followUps) {
    if (!Array.isArray(followUps) || followUps.length === 0) return;
    followUps.forEach((label) => {
      const btn = document.createElement('button');
      btn.className      = 'chip';
      btn.dataset.query  = label;
      btn.textContent    = label;
      followUpContainer.appendChild(btn);
    });
    followUpContainer.style.display = 'flex';
  }

  function clearFollowUps() {
    followUpContainer.innerHTML    = '';
    followUpContainer.style.display = 'none';
  }
})();
