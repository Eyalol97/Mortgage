'use strict';

// SimulatorUI — real-time wiring for the simulator page.
// Depends on: window.MortgageCalc, window.SimulatorForm, window.ComparisonTable,
//             window.formatCurrency, window.formatDecimal

(function () {

  const SESSION_KEY = 'simulator_mixes';
  const AMORT_DEFAULT_ROWS = 12;
  const FINANCIAL = ['propertyPrice', 'equity', 'duration', 'monthlyPayment'];

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
  const amortShowAllBtn   = document.getElementById('amort-show-all-btn');
  const mixTabsContainer  = document.getElementById('mix-tabs');
  const comparisonSection = document.getElementById('comparison-section');
  const comparisonContainer = document.getElementById('comparison-table-container');

  // ── State ──────────────────────────────────────────────────────────────────

  let lastResult   = null;
  let lastInput    = null;
  let activeMixIdx = null;
  const rateCache  = {};

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
    if (getMixes().length > 0) show(pdfBtn);
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
      '<td>' + window.formatCurrency(row.payment)           + '</td>' +
      '<td>' + window.formatCurrency(row.principal)         + '</td>' +
      '<td>' + window.formatCurrency(row.interest)          + '</td>' +
      '<td>' + window.formatCurrency(row.remainingBalance)  + '</td>';
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
    if (remaining.length > 0) {
      if (amortShowAllBtn) {
        amortShowAllBtn.textContent = _t('sim.showAll', 'Show all') + ' ' + schedule.length + ' ' + _t('sim.months', 'months');
        const fresh = amortShowAllBtn.cloneNode(true);
        amortShowAllBtn.parentNode.replaceChild(fresh, amortShowAllBtn);
        fresh.addEventListener('click', () => {
          remaining.forEach(row => amortTbody.appendChild(makeAmortRow(row)));
          hide(amortToggleWrap);
        });
      }
      show(amortToggleWrap);
    }

    show(amortSection);
  }

  // ── Real-time calculation ──────────────────────────────────────────────────

  async function onFormChange({ canSolve, solvedField, state, mandatoryComplete }) {
    clearSolvedStyling();

    if (!canSolve) {
      clearResults();
      return;
    }

    if (state.propertyPrice !== null && state.equity !== null && state.equity >= state.propertyPrice) {
      showMessage('error', 'Equity must be less than the property price.');
      clearResults();
      return;
    }
    if (state.duration !== null && (state.duration < 1 || state.duration > 30)) {
      showMessage('error', 'Duration must be between 1 and 30 years.');
      clearResults();
      return;
    }
    if (state.monthlyPayment !== null && state.propertyPrice !== null && state.equity !== null &&
        state.monthlyPayment >= (state.propertyPrice - state.equity)) {
      showMessage('error', 'Monthly payment cannot exceed the loan amount.');
      clearResults();
      return;
    }

    const rate = await resolveRate(state.interestMethod, state.annualRate);
    if (rate === null) {
      showMessage('error', 'Could not load the default rate for this interest method. Please enter a rate manually.');
      clearResults();
      return;
    }

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

      lastInput = {
        ...state,
        annualRate: rate,
      };

      activeMixIdx = null;
      hide(comparisonSection);
      renderResults(result, rate);
      renderMixTabs();

    } catch (err) {
      showMessage('error', err.message);
      clearResults();
    }
  }

  // ── Mix management ─────────────────────────────────────────────────────────

  function renderMixTabs() {
    if (!mixTabsContainer) return;
    const mixes = getMixes();
    mixTabsContainer.innerHTML = '';
    mixes.forEach((mix, i) => {
      const btn = document.createElement('button');
      btn.className   = 'mix-tab' + (i === activeMixIdx ? ' mix-tab--active' : '');
      btn.textContent = _t('sim.mixTab', 'Mix') + ' ' + (i + 1);
      btn.addEventListener('click', () => switchToMix(i));
      mixTabsContainer.appendChild(btn);
    });
    const showCompBtn = document.getElementById('show-comparison-btn');
    if (showCompBtn) showCompBtn.hidden = mixes.length < 2;
  }

  function switchToMix(index) {
    const mixes = getMixes();
    if (!mixes[index]) return;
    activeMixIdx = index;
    lastResult   = mixes[index];

    const mix          = mixes[index];
    const valuesToLoad = { ...mix, [mix.solvedField]: null };
    window.SimulatorForm.loadValues(valuesToLoad);
    formatAllInputFields();

    hide(comparisonSection);
  }

  // ── PDF ────────────────────────────────────────────────────────────────────

  function triggerPdf() {
    const mixes = getMixes();
    if (mixes.length === 0) { showMessage('error', _t('sim.error.noMixes', 'No mixes saved yet.')); return; }
    const encoded = encodeURIComponent(JSON.stringify(mixes));
    const a       = document.createElement('a');
    a.href         = '/api/simulator/pdf?mixes=' + encoded;
    a.download     = 'mortgage-simulation.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // ── Save as Mix (with backend validation) ─────────────────────────────────

  async function handleSaveMix() {
    if (!lastResult || !lastInput) return;

    saveMixBtn.disabled    = true;
    saveMixBtn.textContent = 'Validating…';

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
      show(pdfBtn);
      hide(saveMixBtn);
      hideMessage();

    } catch {
      showMessage('error', _t('sim.error.network', 'Could not validate. Please check your connection.'));
    } finally {
      saveMixBtn.disabled    = false;
      saveMixBtn.textContent = 'Save as Mix';
    }
  }

  // ── Enter key = Tab ────────────────────────────────────────────────────────

  const TAB_ORDER = ['repaymentMethod', 'interestMethod', 'annualRate',
                     'propertyPrice', 'equity', 'duration', 'monthlyPayment'];

  function handleEnterAsTab(e) {
    if (e.key !== 'Enter') return;
    const idx = TAB_ORDER.indexOf(e.target.id);
    if (idx === -1) return;
    e.preventDefault();
    const next = document.getElementById(TAB_ORDER[idx + 1]);
    if (next) next.focus();
  }

  // ── Init ───────────────────────────────────────────────────────────────────

  function init() {
    window.SimulatorForm.init(onFormChange);

    TAB_ORDER.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('keydown', handleEnterAsTab);
    });

    document.addEventListener('i18n:applied', () => {
      if (lastResult) {
        renderAmortization(lastResult, activeMixIdx);
        renderMixTabs();
      }
    });

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

    if (saveMixBtn) saveMixBtn.addEventListener('click', handleSaveMix);
    if (pdfBtn)     pdfBtn.addEventListener('click', triggerPdf);

    const showCompBtn = document.getElementById('show-comparison-btn');
    if (showCompBtn) {
      showCompBtn.addEventListener('click', () => {
        const mixes = getMixes();
        window.ComparisonTable.render(comparisonContainer, mixes, i => {
          switchToMix(i);
        });
        show(comparisonSection);
        comparisonSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }

    renderMixTabs();
    if (getMixes().length > 0) show(pdfBtn);
  }

  document.addEventListener('DOMContentLoaded', init);

})();
