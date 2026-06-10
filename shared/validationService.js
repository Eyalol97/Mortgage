(function () {
  // ── Internal helpers ───────────────────────────────────────────────────────

  function _ok(field) {
    return { is_valid: true, field, reason: '' };
  }

  function _fail(field, reason) {
    return { is_valid: false, field, reason };
  }

  // ── Rule implementations ───────────────────────────────────────────────────

  const _rules = {
    // Any positive finite number (integers and decimals allowed)
    numeric(field, raw) {
      const n = parseFloat(raw);
      if (isNaN(n) || !isFinite(n)) return _fail(field, 'Must be a valid number');
      if (n <= 0)                    return _fail(field, 'Must be greater than zero');
      return _ok(field);
    },

    // Letters, Hebrew characters, spaces, hyphens, apostrophes — no digits or symbols
    name(field, raw) {
      if (!/^[֐-׿a-zA-Z\s'\-]+$/.test(raw)) {
        return _fail(field, 'Must contain only letters, spaces, or hyphens — no numbers or symbols');
      }
      return _ok(field);
    },

    // 0–100 inclusive (allows decimals — e.g. 3.5%)
    percentage(field, raw) {
      const p = parseFloat(raw);
      if (isNaN(p) || !isFinite(p)) return _fail(field, 'Must be a valid number');
      if (p < 0)    return _fail(field, 'Cannot be negative');
      if (p > 100)  return _fail(field, 'Cannot exceed 100');
      return _ok(field);
    },

    // Positive whole numbers only (e.g. household size, loan term in years/months)
    integer(field, raw) {
      if (!/^\d+$/.test(raw)) return _fail(field, 'Must be a whole number with no decimals');
      const i = parseInt(raw, 10);
      if (i <= 0)             return _fail(field, 'Must be a positive whole number');
      return _ok(field);
    },
  };

  // ── Public API ─────────────────────────────────────────────────────────────
  //
  // ValidationService.validate(type, fieldName, value)
  //   → { is_valid: boolean, field: string, reason: string }
  //
  // type       — 'numeric' | 'name' | 'percentage' | 'integer'
  // fieldName  — human-readable label shown in error reason (e.g. 'Loan Amount')
  // value      — raw string from the input; trimmed internally
  //
  // Usage:
  //   const r = ValidationService.validate('numeric', 'Loan Amount', inputEl.value);
  //   if (!r.is_valid) ValidationMessage.showInvalid(r.reason);

  function validate(type, fieldName, value) {
    const raw = (value == null ? '' : String(value)).trim();

    if (raw === '') {
      return _fail(fieldName, `${fieldName} is required`);
    }

    const rule = _rules[type];
    if (!rule) {
      return raw.length > 0 ? _ok(fieldName) : _fail(fieldName, `${fieldName} is required`);
    }

    return rule(fieldName, raw);
  }

  window.ValidationService = { validate };
})();
