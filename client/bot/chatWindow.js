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
    // Newlines in bot replies become visual line breaks without XSS risk
    div.innerHTML = _escapeHtml(text).replace(/\n/g, '<br>');
    return div;
  }

  function _escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
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
