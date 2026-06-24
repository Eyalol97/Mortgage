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
        el.type = 'number';
      }
    });
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
      if (result.solvedField === 'duration') {
        solvedEl.type  = 'number';
        solvedEl.value = String(result.solvedValue);
      } else {
        solvedEl.type  = 'text';
        solvedEl.value = Math.round(result.solvedValue).toLocaleString('he-IL');
      }
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

    const label = mixIdx !== null ? 'Amortization Schedule — Mix ' + (mixIdx + 1) : 'Amortization Schedule';
    if (amortTitle) amortTitle.textContent = label;

    amortTbody.innerHTML = '';
    hide(amortToggleWrap);

    const schedule   = result.schedule;
    const firstBatch = schedule.slice(0, AMORT_DEFAULT_ROWS);
    firstBatch.forEach(row => amortTbody.appendChild(makeAmortRow(row)));

    const remaining = schedule.slice(AMORT_DEFAULT_ROWS);
    if (remaining.length > 0) {
      if (amortShowAllBtn) {
        amortShowAllBtn.textContent = 'Show all ' + schedule.length + ' months';
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

  // ── Init ───────────────────────────────────────────────────────────────────

  function init() {
    window.SimulatorForm.init(onFormChange);

    FINANCIAL.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('focus', () => {
        if (el.classList.contains('sim-table__input--solved')) {
          el.type  = 'number';
          el.value = '';
          el.classList.remove('sim-table__input--solved');
          el.removeAttribute('readonly');
          el.dispatchEvent(new Event('input'));
        }
      });
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
