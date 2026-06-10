'use strict';

// SimulatorUI — orchestrates all interactive behavior on the simulator page.
//
// Assumes these globals are loaded before this script:
//   window.SimulatorForm     — simulatorForm.js
//   window.ComparisonTable   — comparisonTable.js
//   window.formatCurrency    — shared/formatCurrency.js
//   window.formatDecimal     — shared/formatDecimal.js
//   window.validationMessage — shared/validationMessage.js  (Eyal)

(function () {

  // ── Session mix store (max 3, cleared on tab/window close) ────────────────

  const SESSION_KEY = 'simulator_mixes';

  function getMixes() {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)) || []; }
    catch { return []; }
  }

  function saveMix(mix) {
    const mixes = getMixes();
    if (mixes.length >= 3) mixes.shift();   // drop oldest when full
    mixes.push(mix);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(mixes));
    return mixes;
  }

  function clearMixes() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  // ── DOM refs ──────────────────────────────────────────────────────────────

  const solveBtn        = document.getElementById('solve-btn');
  const saveMixBtn      = document.getElementById('save-mix-btn');
  const pdfBtn          = document.getElementById('pdf-btn');

  const resultsSection  = document.getElementById('results-section');
  const solvedLabel     = document.getElementById('results-solved-label');
  const solvedValue     = document.getElementById('results-solved-value');
  const totalInterest   = document.getElementById('results-total-interest');
  const totalPayment    = document.getElementById('results-total-payment');
  const monthlyPayment  = document.getElementById('results-monthly-payment');

  const mixTabsContainer    = document.getElementById('mix-tabs');
  const comparisonSection   = document.getElementById('comparison-section');
  const comparisonContainer = document.getElementById('comparison-table-container');
  const amortSection        = document.getElementById('amortization-section');
  const amortContainer      = document.getElementById('amortization-table-container');
  const amortTitle          = document.getElementById('amortization-title');

  // ── State ─────────────────────────────────────────────────────────────────

  let lastResult   = null;   // most recent calculation result from backend
  let activeMixIdx = null;   // index into getMixes() currently shown in results

  // ── Helpers ───────────────────────────────────────────────────────────────

  function showError(message) {
    if (window.validationMessage && typeof window.validationMessage.showGlobal === 'function') {
      window.validationMessage.showGlobal('error', message);
    } else {
      alert(message);
    }
  }

  function setLoading(isLoading) {
    solveBtn.disabled = isLoading;
    solveBtn.textContent = isLoading ? 'Calculating…' : 'Solve';
  }

  function show(el) { if (el) el.hidden = false; }
  function hide(el) { if (el) el.hidden = true; }

  // ── Results display ───────────────────────────────────────────────────────

  const FIELD_LABELS = {
    propertyPrice:  'Property Price',
    equity:         'Equity',
    duration:       'Duration (years)',
    monthlyPayment: 'Monthly Payment',
  };

  function renderResults(result) {
    if (solvedLabel) solvedLabel.textContent = FIELD_LABELS[result.solvedField] || result.solvedField;
    if (solvedValue) solvedValue.textContent = window.formatCurrency(result.solvedValue);
    if (monthlyPayment) monthlyPayment.textContent = window.formatCurrency(result.firstMonthlyPayment);
    if (totalInterest)  totalInterest.textContent  = window.formatCurrency(result.totalInterest);
    if (totalPayment)   totalPayment.textContent   = window.formatCurrency(result.totalPayment);
    show(resultsSection);
    show(saveMixBtn);
  }

  // ── Mix tabs ──────────────────────────────────────────────────────────────

  function renderMixTabs() {
    if (!mixTabsContainer) return;
    const mixes = getMixes();
    mixTabsContainer.innerHTML = '';

    mixes.forEach((mix, i) => {
      const btn = document.createElement('button');
      btn.className = 'mix-tab' + (i === activeMixIdx ? ' mix-tab--active' : '');
      btn.textContent = `Mix ${i + 1}`;
      btn.addEventListener('click', () => switchToMix(i));
      mixTabsContainer.appendChild(btn);
    });

    // Show comparison button only when there are multiple mixes
    const showCompBtn = document.getElementById('show-comparison-btn');
    if (showCompBtn) showCompBtn.hidden = mixes.length < 2;
  }

  function switchToMix(index) {
    const mixes = getMixes();
    if (!mixes[index]) return;
    activeMixIdx = index;
    lastResult = mixes[index];
    renderResults(mixes[index]);
    renderMixTabs();
    hide(amortSection);
  }

  // ── Amortization schedule ─────────────────────────────────────────────────

  function renderAmortization(mix) {
    if (!amortContainer) return;
    if (amortTitle) amortTitle.textContent = `Amortization Schedule — Mix ${activeMixIdx + 1}`;

    const schedule = mix.schedule || [];
    const table = document.createElement('table');
    table.className = 'amort-table';

    // Header
    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr>
        <th>Month</th>
        <th>Payment</th>
        <th>Principal</th>
        <th>Interest</th>
        <th>Balance</th>
      </tr>`;
    table.appendChild(thead);

    // Rows
    const tbody = document.createElement('tbody');
    schedule.forEach(row => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${row.month}</td>
        <td>${window.formatCurrency(row.payment)}</td>
        <td>${window.formatCurrency(row.principal)}</td>
        <td>${window.formatCurrency(row.interest)}</td>
        <td>${window.formatCurrency(row.remainingBalance)}</td>`;
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    amortContainer.innerHTML = '';
    amortContainer.appendChild(table);
    show(amortSection);
    amortSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ── PDF download ──────────────────────────────────────────────────────────

  function triggerPdfDownload() {
    const mixes = getMixes();
    if (mixes.length === 0) { showError('No mixes saved yet.'); return; }
    const encoded = encodeURIComponent(JSON.stringify(mixes));
    const link = document.createElement('a');
    link.href = `/api/simulator/pdf?mixes=${encoded}`;
    link.download = 'mortgage-simulation.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // ── Solve button ──────────────────────────────────────────────────────────

  async function handleSolve() {
    let requestData;
    try {
      requestData = window.SimulatorForm.getRequestData();
    } catch (err) {
      showError(err.message);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/simulator', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(requestData),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = (data.errors && data.errors.map(e => e.message || e).join(', ')) || data.error || 'Calculation failed.';
        showError(msg);
        return;
      }

      lastResult   = { ...requestData, ...data };
      activeMixIdx = null;
      renderResults(lastResult);
      hide(comparisonSection);
      hide(amortSection);

    } catch (err) {
      showError('Network error — please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── Init ──────────────────────────────────────────────────────────────────

  function init() {
    // Form state → enable/disable Solve button
    window.SimulatorForm.init(({ canSolve }) => {
      solveBtn.disabled = !canSolve;
    });

    // Solve
    solveBtn.addEventListener('click', handleSolve);

    // Save as Mix
    if (saveMixBtn) {
      saveMixBtn.addEventListener('click', () => {
        if (!lastResult) return;
        const mixes = saveMix(lastResult);
        activeMixIdx = mixes.length - 1;
        renderMixTabs();
        hide(saveMixBtn);
      });
    }

    // Show comparison
    const showCompBtn = document.getElementById('show-comparison-btn');
    if (showCompBtn) {
      showCompBtn.addEventListener('click', () => {
        const mixes = getMixes();
        window.ComparisonTable.render(comparisonContainer, mixes, i => {
          switchToMix(i);
          renderAmortization(getMixes()[i]);
        });
        show(comparisonSection);
        comparisonSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }

    // Amortization (from results section)
    const showAmortBtn = document.getElementById('show-amort-btn');
    if (showAmortBtn) {
      showAmortBtn.addEventListener('click', () => {
        if (lastResult) renderAmortization(lastResult);
      });
    }

    // PDF download
    if (pdfBtn) pdfBtn.addEventListener('click', triggerPdfDownload);

    // Render any mixes left in session (e.g. page refresh within session)
    renderMixTabs();
    if (getMixes().length > 0) show(pdfBtn);
  }

  document.addEventListener('DOMContentLoaded', init);

})();
