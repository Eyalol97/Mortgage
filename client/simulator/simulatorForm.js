'use strict';

// SimulatorForm — manages field state, real-time validation, and request assembly.
// Exposes itself on window.SimulatorForm so simulator-ui.js can call it.
//
// Assumes the following globals are loaded before this script:
//   window.validationService  — shared/validationService.js  (Eyal)
//   window.validationMessage  — shared/validationMessage.js  (Eyal)

const SimulatorForm = (function () {

  // ── Internal state ────────────────────────────────────────────────────────

  const state = {
    repaymentMethod: null,
    interestMethod:  null,
    annualRate:      null,  // null = user left empty → backend uses market default
    propertyPrice:   null,
    equity:          null,
    duration:        null,
    monthlyPayment:  null,
  };

  const MANDATORY_SELECTS   = ['repaymentMethod', 'interestMethod'];
  const FINANCIAL_FIELDS    = ['propertyPrice', 'equity', 'duration', 'monthlyPayment'];
  const ALL_NUMBER_FIELDS   = ['annualRate', ...FINANCIAL_FIELDS];

  let _onStateChange = null;

  // ── Helpers ───────────────────────────────────────────────────────────────

  function filledFinancialCount() {
    return FINANCIAL_FIELDS.filter(f => state[f] !== null).length;
  }

  function mandatoryComplete() {
    return MANDATORY_SELECTS.every(f => state[f] !== null);
  }

  function emitState() {
    if (typeof _onStateChange === 'function') {
      _onStateChange({
        filledFinancialCount: filledFinancialCount(),
        mandatoryComplete:    mandatoryComplete(),
        canSolve:             mandatoryComplete() && filledFinancialCount() === 3,
      });
    }
  }

  function showValidation(el, valid, message) {
    if (window.validationMessage && typeof window.validationMessage.show === 'function') {
      window.validationMessage.show(el, valid ? 'success' : 'error', message);
    }
  }

  function runValidation(name, value) {
    if (window.validationService && typeof window.validationService.validate === 'function') {
      return window.validationService.validate(name, value);
    }
    // Basic fallback
    if (value === null || value === undefined) return { valid: false, message: 'Required' };
    if (value <= 0) return { valid: false, message: 'Must be a positive number' };
    return { valid: true, message: '' };
  }

  // ── Field change handlers ─────────────────────────────────────────────────

  function handleSelectChange(name, el) {
    const value = el.value || null;
    state[name] = value;
    const valid = value !== null;
    showValidation(el, valid, valid ? '' : 'Please select an option');
    emitState();
  }

  function handleNumberChange(name, el) {
    const raw = el.value.trim();

    if (raw === '') {
      state[name] = null;
      // Empty rate field is intentional — show a soft hint, not an error
      if (name === 'annualRate') {
        showValidation(el, true, 'Market default rate will be used');
      } else {
        showValidation(el, true, '');
      }
      emitState();
      return;
    }

    const parsed = parseFloat(raw);

    if (isNaN(parsed) || parsed <= 0) {
      state[name] = null;
      showValidation(el, false, 'Must be a positive number');
      emitState();
      return;
    }

    state[name] = parsed;
    const result = runValidation(name, parsed);
    showValidation(el, result.valid, result.message);
    emitState();
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Initialises the form. Must be called once the DOM is ready.
   * @param {function} onStateChange  Called whenever field state changes.
   *                                  Receives { filledFinancialCount, mandatoryComplete, canSolve }.
   */
  function init(onStateChange) {
    _onStateChange = onStateChange;

    MANDATORY_SELECTS.forEach(name => {
      const el = document.getElementById(name);
      if (!el) return;
      el.addEventListener('change', () => handleSelectChange(name, el));
    });

    ALL_NUMBER_FIELDS.forEach(name => {
      const el = document.getElementById(name);
      if (!el) return;
      el.addEventListener('input', () => handleNumberChange(name, el));
      el.addEventListener('blur',  () => handleNumberChange(name, el));
    });

    emitState();
  }

  /**
   * Returns the assembled request object ready to POST to /api/simulator.
   * Throws if the form is not in a solvable state.
   */
  function getRequestData() {
    if (!mandatoryComplete()) {
      throw new Error('Please select a repayment method and interest method.');
    }
    if (filledFinancialCount() !== 3) {
      throw new Error('Please fill exactly 3 of the 4 financial fields.');
    }

    return {
      repaymentMethod: state.repaymentMethod,
      interestMethod:  state.interestMethod,
      annualRate:      state.annualRate,      // null → server fetches market default
      propertyPrice:   state.propertyPrice,
      equity:          state.equity,
      duration:        state.duration,
      monthlyPayment:  state.monthlyPayment,
    };
  }

  /** Resets all field state (does not clear DOM values — caller handles that). */
  function reset() {
    Object.keys(state).forEach(k => { state[k] = null; });
    emitState();
  }

  return { init, getRequestData, reset };

})();

window.SimulatorForm = SimulatorForm;
