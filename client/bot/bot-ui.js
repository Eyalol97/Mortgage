(() => {
  // Session ID lives only in memory — gone on page exit/refresh, never persisted
  const sessionId = crypto.randomUUID();

  const chipsContainer    = document.getElementById('chips-container');
  const followUpContainer = document.getElementById('follow-up-buttons');
  const followUpsLabel    = document.getElementById('follow-ups-label');

  function _outOfDomainMsg() {
    return window.I18n ? window.I18n.t('bot.outOfDomain')
      : "I can only help with mortgage-related questions — concepts, interest rate tracks, loan types, or Bank of Israel regulations. Please try a different question.";
  }

  function _networkErrMsg() {
    return window.I18n ? window.I18n.t('bot.networkError')
      : 'Sorry, something went wrong reaching the server. Please try again.';
  }

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
    if (chip) handleQuery(chip.dataset.query, true, chip.textContent.trim());
  });

  // ── follow-up button clicks (delegated — buttons are added dynamically) ─────
  followUpContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (btn) handleQuery(btn.dataset.query, false);
  });

  // ── free-text submit ────────────────────────────────────────────────────────
  ChatInput.onSubmit((text) => handleQuery(text, false));

  // ── core query handler ──────────────────────────────────────────────────────
  async function handleQuery(query, isChip, displayLabel) {
    if (!query) return;

    DisclaimerBox.hide();
    clearFollowUps();
    ChatInput.lock();
    ChatWindow.appendUserMessage(displayLabel || query);
    ChatWindow.showTyping();

    try {
      const res  = await fetch('/api/bot/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ query, sessionId, isChip, lang: window.I18n ? window.I18n.current() : 'en' }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      ChatWindow.hideTyping();
      _handleDecision(data);
    } catch {
      ChatWindow.hideTyping();
      ChatWindow.appendBotMessage(_networkErrMsg());
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
        ChatWindow.appendBotMessage(_outOfDomainMsg());
        break;

      default:
        ChatWindow.appendBotMessage(reply || _outOfDomainMsg());
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
    if (followUpsLabel) followUpsLabel.style.display = 'block';
  }

  function clearFollowUps() {
    followUpContainer.innerHTML     = '';
    followUpContainer.style.display = 'none';
    if (followUpsLabel) followUpsLabel.style.display = 'none';
  }
})();
