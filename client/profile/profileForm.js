'use strict';

// ProfileForm — manages field state, comma formatting, validation, tooltips,
// and profile data loading / saving for the profile page.
//
// Assumes these globals are loaded before this script:
//   window.ValidationService — shared/validationService.js
//   window.ValidationMessage — shared/validationMessage.js
//
// Exposes window.ProfileForm for profile-ui.js to call.

const ProfileForm = (function () {

  // ── Field definitions ─────────────────────────────────────────────────────
  // Order: dry details first, money questions second.
  // currency:true → strip/format commas in the UI; value stored as raw number string.
  // max → soft cap; blocks save with a friendly message if exceeded.

  const FIELDS = [
    { id: 'name',          label: 'Name',                   type: 'name'                              },
    { id: 'gender',        label: 'Gender',                  type: 'select'                            },
    { id: 'age',           label: 'Age',                     type: 'age',     max: 120                 },
    { id: 'householdSize', label: 'Household Size',          type: 'integer', max: 20                  },
    { id: 'income',        label: 'Monthly Net Income',      type: 'numeric', currency: true, max: 10_000_000 },
    { id: 'equity',        label: 'Equity / Down Payment',   type: 'numeric', currency: true, max: 50_000_000 },
    { id: 'savings',       label: 'Total Savings',           type: 'numeric', currency: true, max: 50_000_000 },
  ];

  // ── Internal state ────────────────────────────────────────────────────────

  // valid: null = empty/optional, true = valid, false = invalid
  const _state = {};
  FIELDS.forEach(f => { _state[f.id] = { value: null, valid: null }; });

  let _onStateChange   = null;
  let _hasExistingData = false;
  const _msgs = {};

  // ── Comma formatting ──────────────────────────────────────────────────────

  function _formatComma(val) {
    const n = parseFloat(String(val).replace(/,/g, ''));
    if (isNaN(n)) return String(val);
    return n.toLocaleString('en-US');
  }

  function _stripComma(str) {
    return str.replace(/,/g, '');
  }

  // Reformat el.value with commas in real-time, preserving cursor position.
  function _applyCommaFormatting(el) {
    const cursorPos = el.selectionStart;
    const oldVal    = el.value;
    const digitsBeforeCursor = oldVal.slice(0, cursorPos).replace(/\D/g, '').length;

    const digits = oldVal.replace(/\D/g, '');
    if (!digits) { el.value = ''; return; }

    const formatted = Number(digits).toLocaleString('en-US');
    el.value = formatted;

    let count  = 0;
    let newPos = formatted.length;
    for (let i = 0; i < formatted.length; i++) {
      if (/\d/.test(formatted[i])) count++;
      if (count === digitsBeforeCursor) { newPos = i + 1; break; }
    }
    if (digitsBeforeCursor === 0) newPos = 0;
    el.setSelectionRange(newPos, newPos);
  }

  // ── Completion (drives strength bar) ─────────────────────────────────────

  function _emitState() {
    if (typeof _onStateChange !== 'function') return;
    const completedCount = FIELDS.filter(f => _state[f.id].valid === true).length;
    _onStateChange({ completedCount, totalCount: FIELDS.length });
  }

  // ── Validation ────────────────────────────────────────────────────────────

  function _validate(field, rawValue) {
    let raw = (rawValue == null ? '' : String(rawValue)).trim();
    if (field.currency) raw = _stripComma(raw);

    // Empty = optional — not an error
    if (raw === '') {
      _state[field.id] = { value: null, valid: null };
      return { is_valid: null };
    }

    let result;
    if (field.type === 'select') {
      result = { is_valid: true };
    } else {
      result = window.ValidationService.validate(field.type, field.label, raw);
    }

    // Soft upper-bound cap
    if (result.is_valid && field.max != null) {
      const n = (field.type === 'integer' || field.type === 'age')
        ? parseInt(raw, 10)
        : parseFloat(raw);
      if (n > field.max) {
        result = {
          is_valid: false,
          reason: `${field.label} seems too high (max: ${field.max.toLocaleString()})`
        };
      }
    }

    _state[field.id] = { value: raw, valid: result.is_valid };
    return result;
  }

  function _applyFeedback(fieldId, result, touched) {
    const msg = _msgs[fieldId];
    if (!msg) return;
    // null = empty optional field → clear, no feedback
    if (!touched || result.is_valid === null) { msg.clear(); return; }
    result.is_valid ? msg.showValid() : msg.showInvalid(result.reason);
  }

  // ── Field listeners ───────────────────────────────────────────────────────

  function _bindField(field) {
    const el = document.getElementById(field.id);
    if (!el) return;

    const formGroup = document.getElementById(`field-${field.id}`);
    if (formGroup && window.ValidationMessage) {
      _msgs[field.id] = window.ValidationMessage.create(formGroup);
    }

    if (el.tagName === 'SELECT') {
      el.addEventListener('change', () => {
        const result = _validate(field, el.value);
        _applyFeedback(field.id, result, el.value !== '');
        _emitState();
      });
      return;
    }

    // Enter key blurs the field (value stays)
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); el.blur(); }
    });

    if (field.currency) {
      el.addEventListener('input', () => {
        _applyCommaFormatting(el);
        const result = _validate(field, el.value);
        _applyFeedback(field.id, result, el.value.trim() !== '');
        _emitState();
      });
      el.addEventListener('blur', () => {
        const result = _validate(field, el.value);
        _applyFeedback(field.id, result, el.value.trim() !== '');
        _emitState();
      });
      return;
    }

    el.addEventListener('input', () => {
      const result = _validate(field, el.value);
      _applyFeedback(field.id, result, el.value.trim() !== '');
      _emitState();
    });
    el.addEventListener('blur', () => {
      const result = _validate(field, el.value);
      _applyFeedback(field.id, result, el.value.trim() !== '');
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
      if (el) el.value = field.currency ? _formatComma(value) : value;
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

  async function init(onStateChange) {
    _onStateChange = onStateChange;
    FIELDS.forEach(_bindField);
    _initTooltips();
    _emitState();

    const existing = await _loadProfile();
    if (existing) { _prefill(existing); _hasExistingData = true; }

    return { hasExistingData: _hasExistingData };
  }

  async function submit() {
    let anyInvalid = false;

    FIELDS.forEach(field => {
      const el = document.getElementById(field.id);
      const result = _validate(field, el ? el.value : '');
      if (result.is_valid === false) {
        _applyFeedback(field.id, result, true);
        anyInvalid = true;
      }
    });
    _emitState();

    if (anyInvalid) {
      throw new Error('Please correct the highlighted fields.');
    }

    // Only include fields the user actually filled in
    const payload = {};
    FIELDS.forEach(f => { if (_state[f.id].value != null) payload[f.id] = _state[f.id].value; });

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
