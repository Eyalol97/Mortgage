(function () {
  // Inject styles once
  const _style = document.createElement('style');
  _style.textContent = `
    .validation-msg {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-family: 'Nunito Sans', sans-serif;
      font-size: 0.75rem;
      font-weight: 600;
      margin-top: 0.25rem;
      min-height: 1rem;
    }
    .validation-msg--valid   { color: #4d7c7a; }
    .validation-msg--invalid { color: #b91c1c; }
    .validation-msg__icon {
      flex-shrink: 0;
      font-style: normal;
    }
  `;
  document.head.appendChild(_style);

  // ── Factory ────────────────────────────────────────────────────────────────
  // ValidationMessage.create(anchorEl) → { showValid, showInvalid, clear }
  //
  // anchorEl — DOM element after which the message is inserted (typically
  //            an InputField's .form-group element or any block container).
  //
  // The message element is created lazily on first show() call and reused
  // on subsequent calls, so repeated state changes are cheap.

  function create(anchorEl) {
    let _el = null;

    function _ensureEl() {
      if (_el) return;
      _el = document.createElement('p');
      _el.className  = 'validation-msg';
      _el.setAttribute('aria-live', 'polite');
      anchorEl.insertAdjacentElement('afterend', _el);
    }

    function _render(state, text) {
      _ensureEl();
      _el.className   = `validation-msg validation-msg--${state}`;
      _el.innerHTML   = `<i class="validation-msg__icon">${state === 'valid' ? '✓' : '✕'}</i>${_escape(text)}`;
      _el.hidden      = false;
    }

    function _escape(str) {
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }

    return {
      showValid(text = 'Looks good') {
        _render('valid', text);
      },

      showInvalid(reason = 'Invalid value') {
        _render('invalid', reason);
      },

      clear() {
        if (_el) {
          _el.hidden     = true;
          _el.textContent = '';
          _el.className   = 'validation-msg';
        }
      },
    };
  }

  window.ValidationMessage = { create };
})();
