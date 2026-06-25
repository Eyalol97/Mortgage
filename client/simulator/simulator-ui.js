'use strict';

(function () {

  const SESSION_KEY      = 'simulator_mixes';
  const AMORT_DEFAULT_ROWS = 12;
  const FINANCIAL        = ['propertyPrice', 'equity', 'duration', 'monthlyPayment'];
  const TAB_ORDER        = ['repaymentMethod', 'interestMethod', 'annualRate',
                            'propertyPrice', 'equity', 'duration', 'monthlyPayment'];

  // ── Mix store ──────────────────────────────────────────────────────────────

  function getMixes() {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)) || []; }
    catch { return []; }
  }

  function storeMix(mix) {
    const mixes = getMixes();
    if (mixes.length >= 3) mixes.shift();
    mixes.push(mix);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(mixes));
    return mixes;
  }

  // ── DOM refs ───────────────────────────────────────────────────────────────

  const solveBtn          = document.getElementById('solve-btn');
  const saveMixBtn        = document.getElementById('save-mix-btn');
  const pdfBtn            = document.getElementById('pdf-btn');
  const simMessage        = document.getElementById('sim-message');
  const resLoan           = document.getElementById('res-loan');
  const resTotalInterest  = document.getElementById('res-total-interest');
  const resTotalPayment   = document.getElementById('res-total-payment');
  const amortSection      = document.getElementById('amortization-section');
  const amortTitle        = document.getElementById('amortization-title');
  const amortTbody        = document.getElementById('amort-tbody');
  const amortToggleWrap   = document.getElementById('amort-toggle-wrap');
  const mixTabsContainer  = document.getElementById('mix-tabs');
  const comparisonSection = document.getElementById('comparison-section');
  const comparisonContainer = document.getElementById('comparison-table-container');

  // ── State ──────────────────────────────────────────────────────────────────

  let lastFormState = null;
  let lastResult    = null;
  let lastInput     = null;
  let activeMixIdx  = null;
  const rateCache   = {};

  // ── Helpers ────────────────────────────────────────────────────────────────

  function _t(key, fallback) {
    return (window.I18n ? window.I18n.t(key) : null) || fallback;
  }

  function show(el) { if (el) el.hidden = false; }
  function hide(el) { if (el) el.hidden = true; }

  function showMessage(type, text) {
    if (!simMessage) return;
    simMessage.textContent = text;
    simMessage.className   = 'sim-message sim-message--' + type;
    show(simMessage);
  }

  function hideMessage() { hide(simMessage); }

  function clearSolvedStyling() {
    FINANCIAL.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.classList.remove('sim-table__input--solved');
        el.removeAttribute('readonly');
      }
    });
  }

  function formatAsYouType(el) {
    if (!el || el.id === 'duration') return;
    if (el.classList.contains('sim-table__input--solved')) return;

    const cursorPos  = el.selectionStart || 0;
    const oldVal     = el.value;
    const digitsOnly = oldVal.replace(/[^0-9]/g, '');

    if (digitsOnly === '') { el.value = ''; return; }

    const formatted = parseInt(digitsOnly, 10).toLocaleString('he-IL');
    if (formatted === oldVal) return;

    const digitsBeforeCursor = oldVal.slice(0, cursorPos).replace(/[^0-9]/g, '').length;
    el.value = formatted;

    let newPos = 0, seen = 0;
    for (let i = 0; i < formatted.length; i++) {
      if (/[0-9]/.test(formatted[i])) { seen++; if (seen === digitsBeforeCursor) { newPos = i + 1; break; } }
    }
    if (digitsBeforeCursor === 0) newPos = 0;
    try { el.setSelectionRange(newPos, newPos); } catch (_) {}
  }

  function formatAllInputFields() {
    FINANCIAL.forEach(id => formatAsYouType(document.getElementById(id)));
  }

  // ── Rate fetching ──────────────────────────────────────────────────────────

  async function resolveRate(interestMethod, userRate) {
    if (userRate !== null) return userRate;
    if (rateCache[interestMethod] !== undefined) return rateCache[interestMethod];

    try {
      const res  = await fetch('/api/simulator/rates');
      if (!res.ok) return null;
      const data = await res.json();
      if (Array.isArray(data.rates)) {
        data.rates.forEach(({ track, rate }) => { rateCache[track] = rate; });
      }
      return rateCache[interestMethod] ?? null;
    } catch {
      return null;
    }
  }

  // ── Results rendering ──────────────────────────────────────────────────────

  function renderResults(result, resolvedRate) {
    clearSolvedStyling();
    const solvedEl = document.getElementById(result.solvedField);
    if (solvedEl) {
      solvedEl.value = result.solvedField === 'duration'
        ? String(Math.round(result.solvedValue))
        : Math.round(result.solvedValue).toLocaleString('he-IL');
      solvedEl.classList.add('sim-table__input--solved');
      solvedEl.setAttribute('readonly', true);
    }

    if (resLoan)          resLoan.textContent          = window.formatCurrency(result.loan);
    if (resTotalInterest) resTotalInterest.textContent = window.formatCurrency(result.totalInterest);
    if (resTotalPayment)  resTotalPayment.textContent  = window.formatCurrency(result.totalPayment);

    show(saveMixBtn);
    if (getMixes().length > 0) { if (pdfBtn) pdfBtn.hidden = false; }
    hideMessage();

    renderAmortization(result, activeMixIdx);
  }

  function clearResults() {
    clearSolvedStyling();
    if (resLoan)          resLoan.textContent          = '—';
    if (resTotalInterest) resTotalInterest.textContent = '—';
    if (resTotalPayment)  resTotalPayment.textContent  = '—';
    hide(saveMixBtn);
    hide(amortSection);
    lastResult = null;
    lastInput  = null;
  }

  // ── Amortization ───────────────────────────────────────────────────────────

  function makeAmortRow(row) {
    const tr = document.createElement('tr');
    tr.innerHTML =
      '<td>' + row.month + '</td>' +
      '<td>' + window.formatCurrency(row.payment)          + '</td>' +
      '<td>' + window.formatCurrency(row.principal)        + '</td>' +
      '<td>' + window.formatCurrency(row.interest)         + '</td>' +
      '<td>' + window.formatCurrency(row.remainingBalance) + '</td>';
    return tr;
  }

  function renderAmortization(result, mixIdx) {
    if (!amortTbody || !result || !result.schedule) return;

    const baseLabel = _t('sim.amortSchedule', 'Amortization Schedule');
    const label = mixIdx !== null
      ? baseLabel + ' — ' + _t('sim.mixTab', 'Mix') + ' ' + (mixIdx + 1)
      : baseLabel;
    if (amortTitle) amortTitle.textContent = label;

    amortTbody.innerHTML = '';
    hide(amortToggleWrap);

    const schedule   = result.schedule;
    const firstBatch = schedule.slice(0, AMORT_DEFAULT_ROWS);
    firstBatch.forEach(row => amortTbody.appendChild(makeAmortRow(row)));

    const remaining = schedule.slice(AMORT_DEFAULT_ROWS);
    if (remaining.length > 0 && amortToggleWrap) {
      const btnLabel = _t('sim.showAll', 'Show all') + ' ' + schedule.length + ' ' + _t('sim.months', 'months');
      amortToggleWrap.innerHTML = '<button class="btn btn--secondary">' + btnLabel + '</button>';
      amortToggleWrap.querySelector('button').addEventListener('click', () => {
        remaining.forEach(row => amortTbody.appendChild(makeAmortRow(row)));
        hide(amortToggleWrap);
      });
      show(amortToggleWrap);
    }

    show(amortSection);
  }

  // ── Form state tracking (no auto-calculation) ──────────────────────────────

  function onFormChange(formState) {
    lastFormState = formState;
    clearResults();
    hideMessage();
  }

  // ── Solve button ───────────────────────────────────────────────────────────

  async function handleSolve() {
    if (!lastFormState) return;

    const { state } = lastFormState;

    // ── Mandatory fields ───────────────────────────────────────────────────
    if (!state.repaymentMethod) {
      showMessage('error', _t('sim.solve.needRepayment',
        'Select a Repayment Method first (Shpitzer, Equal Principal, or Bullet).'));
      return;
    }
    if (!state.interestMethod) {
      showMessage('error', _t('sim.solve.needInterest',
        'Select an Interest Method first (Prime-Linked, Fixed, or CPI-Linked).'));
      return;
    }

    // ── 3-of-4 check ──────────────────────────────────────────────────────
    const filled = FINANCIAL.filter(f => state[f] !== null).length;
    if (filled < 3) {
      const missing = 3 - filled;
      showMessage('error', _t('sim.solve.needMore',
        'Fill in ' + missing + ' more field' + (missing > 1 ? 's' : '') +
        ' — exactly 3 of the 4 amount fields must be filled.'));
      return;
    }
    if (filled === 4) {
      showMessage('error', _t('sim.solve.tooMany',
        'All 4 fields are filled. Leave exactly one empty — that value will be solved for you.'));
      return;
    }

    // ── Field-level validation ─────────────────────────────────────────────
    if (state.duration !== null && (state.duration < 1 || state.duration > 30)) {
      showMessage('error', _t('sim.solve.durationRange',
        'Loan duration must be between 1 and 30 years.'));
      return;
    }
    if (state.propertyPrice !== null && state.equity !== null && state.equity >= state.propertyPrice) {
      showMessage('error', _t('sim.solve.equityGtPrice',
        'Equity cannot be equal to or greater than the property price.'));
      return;
    }
    if (state.annualRate !== null && state.annualRate <= 0) {
      showMessage('error', _t('sim.solve.ratePositive',
        'Annual interest rate must be a positive number. Leave it empty to use the market default.'));
      return;
    }

    // ── Rate resolution ────────────────────────────────────────────────────
    const rate = await resolveRate(state.interestMethod, state.annualRate);
    if (rate === null) {
      showMessage('error', _t('sim.solve.noRate',
        'Could not load the market rate. Please enter the Annual Interest Rate (%) manually.'));
      return;
    }

    // ── Calculate ──────────────────────────────────────────────────────────
    if (solveBtn) { solveBtn.disabled = true; solveBtn.textContent = _t('sim.calculating', 'Calculating…'); }

    try {
      const result = window.MortgageCalc.calculate({
        repaymentMethod: state.repaymentMethod,
        annualRate:      rate,
        propertyPrice:   state.propertyPrice,
        equity:          state.equity,
        duration:        state.duration,
        monthlyPayment:  state.monthlyPayment,
      });

      lastResult = {
        ...state,
        annualRate:           rate,
        [result.solvedField]: result.solvedValue,
        loan:                 result.loan,
        firstMonthlyPayment:  result.firstMonthlyPayment,
        totalInterest:        result.totalInterest,
        totalPayment:         result.totalPayment,
        schedule:             result.schedule,
        solvedField:          result.solvedField,
      };
      lastInput = { ...state, annualRate: rate };

      activeMixIdx = null;
      hide(comparisonSection);
      renderResults(result, rate);
      renderMixTabs();

    } catch (err) {
      // Calculator errors: "payment too low", "duration cannot be solved for Bullet", etc.
      showMessage('error', err.message + ' Please adjust your inputs and press Solve again.');
    } finally {
      if (solveBtn) { solveBtn.disabled = false; solveBtn.textContent = _t('sim.solve', 'Solve'); }
    }
  }

  // ── Mix management ─────────────────────────────────────────────────────────

  function deleteMix(index) {
    const wrap = mixTabsContainer
      ? mixTabsContainer.querySelectorAll('.mix-tab-wrap')[index]
      : null;

    if (wrap) {
      wrap.classList.add('mix-tab-wrap--removing');
      setTimeout(() => _applyMixDeletion(index), 200);
    } else {
      _applyMixDeletion(index);
    }
  }

  function _applyMixDeletion(index) {
    const mixes = getMixes();
    mixes.splice(index, 1);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(mixes));

    if (activeMixIdx === index) {
      activeMixIdx = null;
      clearResults();
    } else if (activeMixIdx !== null && activeMixIdx > index) {
      activeMixIdx--;
    }

    if (comparisonSection && !comparisonSection.hidden) {
      if (mixes.length >= 2) {
        window.ComparisonTable.render(comparisonContainer, mixes, i => switchToMix(i));
      } else {
        hide(comparisonSection);
      }
    }

    renderMixTabs();
    if (pdfBtn) pdfBtn.hidden = mixes.length === 0;
  }

  function renderMixTabs() {
    if (!mixTabsContainer) return;
    const mixes = getMixes();
    mixTabsContainer.innerHTML = '';

    mixes.forEach((mix, i) => {
      const wrap = document.createElement('div');
      wrap.className = 'mix-tab-wrap';

      const btn = document.createElement('button');
      btn.className   = 'mix-tab' + (i === activeMixIdx ? ' mix-tab--active' : '');
      btn.textContent = _t('sim.mixTab', 'Mix') + ' ' + (i + 1);
      btn.setAttribute('aria-label', _t('sim.mixTab', 'Mix') + ' ' + (i + 1));
      btn.addEventListener('click', () => switchToMix(i));

      const del = document.createElement('button');
      del.className = 'mix-tab__delete';
      del.innerHTML = '&#x2715;'; // ✕  heavy multiplication x — cleaner than ×
      del.title     = _t('sim.mix.deleteHint', 'Remove Mix') + ' ' + (i + 1);
      del.setAttribute('aria-label', _t('sim.mix.deleteHint', 'Remove Mix') + ' ' + (i + 1));
      del.addEventListener('click', e => { e.stopPropagation(); deleteMix(i); });

      wrap.appendChild(btn);
      wrap.appendChild(del);
      mixTabsContainer.appendChild(wrap);
    });

    const showCompBtn = document.getElementById('show-comparison-btn');
    if (showCompBtn) showCompBtn.hidden = mixes.length < 2;

    const hintEl = document.getElementById('mix-hint');
    if (hintEl) {
      if (mixes.length > 0) {
        hintEl.textContent = _t('sim.mix.hint', 'Click to load a mix · ✕ to remove and try different settings');
        hintEl.hidden = false;
      } else {
        hintEl.hidden = true;
      }
    }
  }

  function switchToMix(index) {
    const mixes = getMixes();
    if (!mixes[index]) return;
    activeMixIdx = index;
    const mix = mixes[index];

    const valuesToLoad = { ...mix, [mix.solvedField]: null };
    window.SimulatorForm.loadValues(valuesToLoad); // triggers onFormChange → clearResults
    formatAllInputFields();

    // Restore stored result directly — no re-calculation needed
    lastResult = mix;
    lastInput  = { ...mix, [mix.solvedField]: null };
    renderResults({
      solvedField:   mix.solvedField,
      solvedValue:   mix[mix.solvedField],
      loan:          mix.loan,
      totalInterest: mix.totalInterest,
      totalPayment:  mix.totalPayment,
      schedule:      mix.schedule,
    }, mix.annualRate);

    hide(comparisonSection);
  }

  // ── PDF ────────────────────────────────────────────────────────────────────

  async function triggerPdf() {
    const mixes = getMixes();

    if (mixes.length === 0) {
      showMessage('info', _t('sim.pdf.noMixes',
        'Solve and save at least one investment route as Mix first to download a PDF.'));
      return;
    }

    if (pdfBtn) { pdfBtn.disabled = true; pdfBtn.textContent = _t('sim.pdf.generating', 'Generating PDF…'); }

    try {
      const lean = mixes.map(({ schedule, ...rest }) => rest);
      const lang = window.I18n ? window.I18n.current() : 'en';

      const res = await fetch('/api/simulator/pdf', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ mixes: lean, lang }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        showMessage('error', d.error || _t('sim.pdf.error', 'Could not generate PDF. Please try again.'));
        return;
      }

      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = 'mortgage-comparison.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      hideMessage();

    } catch {
      showMessage('error', _t('sim.pdf.error', 'Could not generate PDF. Please check your connection.'));
    } finally {
      if (pdfBtn) { pdfBtn.disabled = false; pdfBtn.textContent = _t('sim.downloadPdf', 'Download PDF Summary'); }
    }
  }

  // ── Save as Mix ────────────────────────────────────────────────────────────

  async function handleSaveMix() {
    if (!lastResult || !lastInput) return;

    saveMixBtn.disabled    = true;
    saveMixBtn.textContent = _t('sim.calculating', 'Validating…');

    try {
      const authHeaders = (window.Auth && window.Auth.getAuthHeaders) ? window.Auth.getAuthHeaders() : {};
      const res = await fetch('/api/simulator', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body:    JSON.stringify(lastInput),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = (data.errors && data.errors.map(e => e.message || e).join(', '))
          || data.error
          || _t('sim.error.calcFailed', 'Validation failed.');
        showMessage('error', msg);
        return;
      }

      const mixes  = storeMix({ ...lastResult, ...data });
      activeMixIdx = mixes.length - 1;
      renderMixTabs();
      if (pdfBtn) pdfBtn.hidden = false;
      hide(saveMixBtn);
      hideMessage();

    } catch {
      showMessage('error', _t('sim.error.network', 'Could not validate. Please check your connection.'));
    } finally {
      saveMixBtn.disabled    = false;
      saveMixBtn.textContent = _t('sim.saveAsMix', 'Save as Mix');
    }
  }

  // ── Enter key = Tab ────────────────────────────────────────────────────────

  function handleEnterAsTab(e) {
    if (e.key !== 'Enter') return;
    const idx = TAB_ORDER.indexOf(e.target.id);
    if (idx === -1) return;

    const next = document.getElementById(TAB_ORDER[idx + 1]);
    if (!next) return;

    if (e.target.tagName === 'SELECT') {
      // Let the browser handle select first (close dropdown, fire change), then move
      setTimeout(() => next.focus(), 0);
    } else {
      e.preventDefault();
      e.target.blur(); // commit value + trigger any blur formatting
      next.focus();
    }
  }

  // ── Init ───────────────────────────────────────────────────────────────────

  function init() {
    window.SimulatorForm.init(onFormChange);

    // Enter = Tab on all form fields
    TAB_ORDER.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('keydown', handleEnterAsTab);
    });

    document.addEventListener('i18n:applied', () => {
      if (lastResult) renderAmortization(lastResult, activeMixIdx);
      renderMixTabs();
      if (comparisonSection && !comparisonSection.hidden) {
        const mixes = getMixes();
        if (mixes.length >= 2) {
          window.ComparisonTable.render(comparisonContainer, mixes, i => switchToMix(i));
        }
      }
    });

    // Financial inputs: comma formatting + clear solved field on focus
    FINANCIAL.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;

      el.addEventListener('focus', () => {
        if (el.classList.contains('sim-table__input--solved')) {
          el.value = '';
          el.classList.remove('sim-table__input--solved');
          el.removeAttribute('readonly');
          el.dispatchEvent(new Event('input'));
        }
      });

      if (id !== 'duration') {
        el.addEventListener('input', () => formatAsYouType(el));
      }
    });

    // Button wiring
    if (solveBtn)   solveBtn.addEventListener('click', handleSolve);
    if (saveMixBtn) saveMixBtn.addEventListener('click', handleSaveMix);
    if (pdfBtn)     pdfBtn.addEventListener('click', triggerPdf);

    const showCompBtn = document.getElementById('show-comparison-btn');
    if (showCompBtn) {
      showCompBtn.addEventListener('click', () => {
        const mixes = getMixes();
        window.ComparisonTable.render(comparisonContainer, mixes, i => switchToMix(i));
        show(comparisonSection);
        comparisonSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }

    renderMixTabs();
    if (getMixes().length > 0 && pdfBtn) pdfBtn.hidden = false;
  }

  document.addEventListener('DOMContentLoaded', init);

})();
