'use strict';

// SimulatorForm — tracks field state, emits change events for real-time calculation.
// Exposed on window.SimulatorForm so simulator-ui.js can call it.

const SimulatorForm = (function () {

  // ── State ──────────────────────────────────────────────────────────────────

  const state = {
    repaymentMethod: null,
    interestMethod:  null,
    annualRate:      null,
    propertyPrice:   null,
    equity:          null,
    duration:        null,
    monthlyPayment:  null,
  };

  const MANDATORY = ['repaymentMethod', 'interestMethod'];
  const FINANCIAL = ['propertyPrice', 'equity', 'duration', 'monthlyPayment'];

  let _onChange = null;

  // ── Helpers ────────────────────────────────────────────────────────────────

  function mandatoryComplete() {
    return MANDATORY.every(f => state[f] !== null);
  }

  function userFilledCount() {
    return FINANCIAL.filter(f => state[f] !== null).length;
  }

  function solvedField() {
    if (userFilledCount() !== 3) return null;
    return FINANCIAL.find(f => state[f] === null) || null;
  }

  function emit() {
    if (typeof _onChange !== 'function') return;
    _onChange({
      mandatoryComplete: mandatoryComplete(),
      canSolve:    mandatoryComplete() && userFilledCount() === 3,
      solvedField: solvedField(),
      state:       { ...state },
    });
  }

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleSelect(name, el) {
    state[name] = el.value || null;
    emit();
  }

  function handleNumber(name, el) {
    const raw = el.value.trim();
    if (raw === '') {
      state[name] = null;
    } else {
      const v = parseFloat(raw);
      state[name] = (isNaN(v) || v <= 0) ? null : v;
    }
    emit();
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  function init(onChange) {
    _onChange = onChange;

    MANDATORY.forEach(name => {
      const el = document.getElementById(name);
      if (el) el.addEventListener('change', () => handleSelect(name, el));
    });

    const rateEl = document.getElementById('annualRate');
    if (rateEl) {
      rateEl.addEventListener('input', () => {
        const v = parseFloat(rateEl.value);
        state.annualRate = (rateEl.value.trim() === '' || isNaN(v) || v <= 0) ? null : v;
        emit();
      });
    }

    FINANCIAL.forEach(name => {
      const el = document.getElementById(name);
      if (!el) return;
      el.addEventListener('input', () => handleNumber(name, el));
    });

    emit();
  }

  // Programmatically load a set of values (e.g. when restoring a saved mix).
  // Pass null for the field that should remain solved/empty.
  function loadValues(values) {
    MANDATORY.forEach(name => {
      const el = document.getElementById(name);
      if (!el) return;
      el.value  = values[name] || '';
      state[name] = el.value || null;
    });

    const rateEl = document.getElementById('annualRate');
    if (rateEl) {
      const rv = values.annualRate;
      rateEl.value = (rv !== null && rv !== undefined) ? rv : '';
      const v = parseFloat(rateEl.value);
      state.annualRate = (rateEl.value.trim() === '' || isNaN(v) || v <= 0) ? null : v;
    }

    FINANCIAL.forEach(name => {
      const el = document.getElementById(name);
      if (!el) return;
      const v = values[name];
      el.value    = (v !== null && v !== undefined) ? v : '';
      const parsed = parseFloat(el.value);
      state[name] = (el.value.trim() === '' || isNaN(parsed) || parsed <= 0) ? null : parsed;
    });

    emit();
  }

  function getRequestData() {
    return { ...state };
  }

  function reset() {
    Object.keys(state).forEach(k => { state[k] = null; });
    emit();
  }

  return { init, loadValues, getRequestData, reset };

})();

window.SimulatorForm = SimulatorForm;
