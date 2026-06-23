const ChatWindow = (() => {
  const chatWindowEl = document.getElementById('chat-window');
  const container    = chatWindowEl.querySelector('.chat-container');
  const typingEl     = document.getElementById('typing-indicator');

  // ── internal helpers ────────────────────────────────────────────────────────

  function _scrollToBottom() {
    chatWindowEl.scrollTop = chatWindowEl.scrollHeight;
  }

  function _makeBubble(text, side) {
    const div = document.createElement('div');
    div.className = `bubble bubble-${side}`;
    div.innerHTML = side === 'bot' ? _renderMarkdown(text) : _escapeHtml(text);
    return div;
  }

  function _escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function _renderMarkdown(raw) {
    // 1. Escape HTML first to prevent XSS
    let s = _escapeHtml(raw);

    // 2. Bold: **text**
    s = s.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');

    // 3. Bullet lists: group consecutive lines starting with "- " or "• "
    s = s.replace(/((?:(?:^|\n)[-•] [^\n]+)+)/g, (block) => {
      const items = block.trim().split('\n')
        .map(l => `<li>${l.replace(/^[-•] /, '')}</li>`)
        .join('');
      return `<ul>${items}</ul>`;
    });

    // 4. Remaining newlines → <br>
    s = s.replace(/\n/g, '<br>');

    // 5. Remove <br> immediately adjacent to list tags for clean spacing
    s = s.replace(/<br>(<\/?ul>)/g, '$1').replace(/(<\/?ul>)<br>/g, '$1');

    return s;
  }

  function _insert(el) {
    // Always insert before the typing indicator so it stays at the bottom
    container.insertBefore(el, typingEl);
    _scrollToBottom();
  }

  // ── public API consumed by bot-ui.js ────────────────────────────────────────

  function appendUserMessage(text) {
    _insert(_makeBubble(text, 'user'));
  }

  function appendBotMessage(text) {
    _insert(_makeBubble(text, 'bot'));
  }

  function showTyping() {
    typingEl.style.display = 'flex';
    _scrollToBottom();
  }

  function hideTyping() {
    typingEl.style.display = 'none';
  }

  function clear() {
    container.querySelectorAll('.bubble').forEach((b) => b.remove());
    hideTyping();
  }

  return { appendUserMessage, appendBotMessage, showTyping, hideTyping, clear };
})();
