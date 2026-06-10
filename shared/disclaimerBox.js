(function () {
  const TEXTS = {
    advisory:
      'This response is for educational purposes only and does not constitute ' +
      'financial advice. Please consult a licensed mortgage advisor ' +
      '(יועץ משכנתאות מורשה) before making any decisions.',

    simulator:
      'These calculations are estimates only and do not constitute financial ' +
      'advice. Actual mortgage terms, rates, and costs may vary. Please consult ' +
      'a licensed mortgage advisor (יועץ משכנתאות מורשה) before making any decisions.',
  };

  // Inject a style block for the simulator's permanent-banner variant
  const _style = document.createElement('style');
  _style.textContent = `
    .disclaimer-banner {
      background-color: var(--secondary-container, #d4e8e6);
      color: var(--on-secondary-container, #0e1f1e);
      padding: 0.5rem 1rem;
      font-size: 0.75rem;
      font-family: 'Nunito Sans', sans-serif;
      border-radius: 8px;
      text-align: center;
      border: 1px solid var(--outline-variant, #bfc9c7);
      margin: 0.5rem 0;
    }
    .disclaimer-banner__icon {
      margin-right: 0.25rem;
    }
  `;
  document.head.appendChild(_style);

  // ── Element resolution ─────────────────────────────────────────────────────
  // Use the static #disclaimer-box if it exists (home.html injects it).
  // Otherwise create and mount one — used by simulator and any future page.
  function _getOrCreate() {
    let el = document.getElementById('disclaimer-box');
    if (el) return el;

    el = document.createElement('div');
    el.id = 'disclaimer-box';
    el.className = 'disclaimer disclaimer-banner';
    el.style.display = 'none';

    // Mount just before the first <main> or at the end of <body>
    const main = document.querySelector('main') || document.body;
    main.insertAdjacentElement('afterbegin', el);
    return el;
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  //
  // DisclaimerBox.show()              — shows with advisory text (bot default)
  // DisclaimerBox.show('advisory')    — explicit advisory variant
  // DisclaimerBox.show('simulator')   — estimation disclaimer for simulator
  // DisclaimerBox.hide()              — hides the box

  function show(variant) {
    const el = _getOrCreate();
    const text = TEXTS[variant] || TEXTS.advisory;
    el.innerHTML = `<span class="disclaimer-banner__icon" aria-hidden="true">ℹ️</span>${text}`;
    el.style.display = '';  // revert to CSS default (block / whatever the page sets)
    el.removeAttribute('hidden');
  }

  function hide() {
    const el = document.getElementById('disclaimer-box');
    if (!el) return;
    el.style.display = 'none';
  }

  window.DisclaimerBox = { show, hide };
})();
