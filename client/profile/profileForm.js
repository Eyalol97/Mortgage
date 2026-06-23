'use strict';

// ProfileForm — manages field state, real-time validation, tooltip display,
// and profile data loading / saving for the profile page.
//
// Assumes these globals are loaded before this script:
//   window.ValidationService — shared/validationService.js
//   window.ValidationMessage — shared/validationMessage.js
//
// Exposes window.ProfileForm for profile-ui.js to call.

const ProfileForm = (function () {

  // ── Field definitions ─────────────────────────────────────────────────────

  const FIELDS = [
    { id: 'income',        label: 'Monthly Net Income',    type: 'numeric' },
    { id: 'equity',        label: 'Equity / Down Payment', type: 'numeric' },
    { id: 'savings',       label: 'Total Savings',         type: 'numeric' },
    { id: 'householdSize', label: 'Household Size',        type: 'integer' },
  ];

  // ── Internal state ────────────────────────────────────────────────────────

  // valid: null = untouched, true = valid, false = invalid
  const _state = {};
  FIELDS.forEach(f => { _state[f.id] = { value: null, valid: null }; });

  let _onStateChange   = null;
  let _hasExistingData = false;
  const _msgs = {};  // ValidationMessage instances keyed by field id

  // ── Completion ────────────────────────────────────────────────────────────

  function _emitState() {
    if (typeof _onStateChange !== 'function') return;
    const completedCount = FIELDS.filter(f => _state[f.id].valid === true).length;
    _onStateChange({ completedCount, totalCount: FIELDS.length });
  }

  // ── Validation ────────────────────────────────────────────────────────────

  function _validate(field, rawValue) {
    const raw = (rawValue == null ? '' : String(rawValue)).trim();

    if (raw === '') {
      _state[field.id] = { value: null, valid: false };
      return { is_valid: false, reason: `${field.label} is required` };
    }

    const result = window.ValidationService.validate(field.type, field.label, raw);
    _state[field.id] = { value: raw, valid: result.is_valid };
    return result;
  }

  function _applyFeedback(fieldId, result, touched) {
    const msg = _msgs[fieldId];
    if (!msg) return;
    if (!touched) { msg.clear(); return; }
    result.is_valid ? msg.showValid() : msg.showInvalid(result.reason);
  }

  // ── Field listeners ───────────────────────────────────────────────────────

  function _bindField(field) {
    const el = document.getElementById(field.id);
    if (!el) return;

    // Anchor ValidationMessage to the field's .form-group wrapper
    const formGroup = document.getElementById(`field-${field.id}`);
    if (formGroup && window.ValidationMessage) {
      _msgs[field.id] = window.ValidationMessage.create(formGroup);
    }

    el.addEventListener('input', () => {
      const result = _validate(field, el.value);
      // Only show feedback while typing when there is actually a value
      _applyFeedback(field.id, result, el.value.trim() !== '');
      _emitState();
    });

    el.addEventListener('blur', () => {
      const result = _validate(field, el.value);
      _applyFeedback(field.id, result, true);
      _emitState();
    });
  }

  // ── Tooltips ──────────────────────────────────────────────────────────────

  function _initTooltips() {
    document.querySelectorAll('[data-tooltip]').forEach(btn => {
      const tooltip = document.getElementById(btn.dataset.tooltip);
      if (!tooltip) return;

      btn.addEventListener('click', e => {
        e.stopPropagation();
        const alreadyOpen = tooltip.classList.contains('is-visible');
        _closeAllTooltips();
        if (!alreadyOpen) tooltip.classList.add('is-visible');
      });
    });

    // Tap / click anywhere outside closes all tooltips
    document.addEventListener('click', _closeAllTooltips);
  }

  function _closeAllTooltips() {
    document.querySelectorAll('.field-row__tooltip-text.is-visible').forEach(el => {
      el.classList.remove('is-visible');
    });
  }

  // ── Pre-fill ──────────────────────────────────────────────────────────────

  function _prefill(data) {
    FIELDS.forEach(field => {
      const value = data[field.id];
      if (value == null) return;
      const el = document.getElementById(field.id);
      if (el) el.value = value;
      const result = _validate(field, String(value));
      _applyFeedback(field.id, result, true);
    });
    _emitState();
  }

  // ── Data load ─────────────────────────────────────────────────────────────

  async function _loadProfile() {
    try {
      const res = await fetch('/api/profile', {
        headers: window.Auth ? window.Auth.getAuthHeaders() : {},
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data && typeof data === 'object' ? data : null;
    } catch {
      return null;
    }
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Initialises field listeners and tooltips, then loads any existing profile
   * data from the server and pre-fills the form.
   *
   * @param  {function} onStateChange  Called with { completedCount, totalCount }
   *                                   on every field change.
   * @returns {Promise<{ hasExistingData: boolean }>}
   */
  async function init(onStateChange) {
    _onStateChange = onStateChange;

    FIELDS.forEach(_bindField);
    _initTooltips();
    _emitState();

    const existing = await _loadProfile();
    if (existing) { _prefill(existing); _hasExistingData = true; }

    return { hasExistingData: _hasExistingData };
  }

  /**
   * Validates all fields, then POSTs the assembled profile object to
   * /api/profile. Rejects with an Error on validation failure or a bad
   * HTTP response.
   *
   * @returns {Promise<void>}
   */
  async function submit() {
    let allValid = true;

    FIELDS.forEach(field => {
      const el = document.getElementById(field.id);
      const result = _validate(field, el ? el.value : '');
      _applyFeedback(field.id, result, true);
      if (!result.is_valid) allValid = false;
    });
    _emitState();

    if (!allValid) {
      throw new Error('Please fill all required fields correctly.');
    }

    const payload = {};
    FIELDS.forEach(f => { payload[f.id] = _state[f.id].value; });

    const authHeaders = window.Auth ? window.Auth.getAuthHeaders() : {};
    const res = await fetch('/api/profile', {
      method:  _hasExistingData ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body:    JSON.stringify(payload),
    });
    if (res.ok) _hasExistingData = true;

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const msg = (data.errors && data.errors.map(e => e.message || e).join(', '))
               || data.error
               || 'Failed to save profile. Please try again.';
      throw new Error(msg);
    }
  }

  return { init, submit };

})();

window.ProfileForm = ProfileForm;
