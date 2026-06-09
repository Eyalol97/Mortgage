const ChatInput = (() => {
  const textarea = document.getElementById('chat-input');
  const sendBtn  = document.getElementById('send-btn');

  let _submitCallback = null;

  // --- internal helpers ---

  function _updateSendBtn() {
    sendBtn.disabled = textarea.disabled || textarea.value.trim().length === 0;
  }

  function _autoResize() {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  }

  function _submit() {
    const text = textarea.value.trim();
    if (!text || sendBtn.disabled) return;
    clear();
    if (_submitCallback) _submitCallback(text);
  }

  // --- event wiring ---

  textarea.addEventListener('input', () => {
    _autoResize();
    _updateSendBtn();
  });

  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      _submit();
    }
  });

  sendBtn.addEventListener('click', _submit);

  // --- public API consumed by bot-ui.js ---

  function onSubmit(callback) {
    _submitCallback = callback;
  }

  function lock() {
    textarea.disabled = true;
    sendBtn.disabled  = true;
  }

  function unlock() {
    textarea.disabled = false;
    textarea.focus();
    _updateSendBtn();
  }

  function setValue(text) {
    textarea.value = text;
    _autoResize();
    _updateSendBtn();
  }

  function clear() {
    textarea.value      = '';
    textarea.style.height = 'auto';
    _updateSendBtn();
  }

  return { onSubmit, lock, unlock, setValue, clear };
})();
