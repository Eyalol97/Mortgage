// Server-side mirror of shared/validationService.js rules for profile fields.
// Runs in Node — cannot import the browser IIFE, so rules are reimplemented here.

const FIELD_DEFS = [
  { key: 'income',        label: 'Monthly Net Income',    type: 'numeric' },
  { key: 'equity',        label: 'Equity / Down Payment', type: 'numeric' },
  { key: 'savings',       label: 'Total Savings',         type: 'numeric' },
  { key: 'householdSize', label: 'Household Size',        type: 'integer' },
];

// Returns a reason string on failure, null on success.
function _checkNumeric(label, raw) {
  const n = parseFloat(raw);
  if (isNaN(n) || !isFinite(n)) return `${label} must be a valid number`;
  if (n <= 0)                   return `${label} must be greater than zero`;
  return null;
}

function _checkInteger(label, raw) {
  if (!/^\d+$/.test(raw))    return `${label} must be a whole number with no decimals`;
  if (parseInt(raw, 10) <= 0) return `${label} must be a positive whole number`;
  return null;
}

/**
 * Validates a partial or full profile payload.
 * Omitted fields (null / undefined) are allowed — partial saves are supported.
 * At least one field must be present.
 *
 * @param {{ income?, equity?, savings?, householdSize? }} fields
 * @returns {{ valid: boolean, errors: Array<{ field: string, reason: string }> }}
 */
function validate({ income, equity, savings, householdSize } = {}) {
  const errors = [];
  let providedCount = 0;

  const input = { income, equity, savings, householdSize };

  for (const def of FIELD_DEFS) {
    const raw = input[def.key];

    if (raw === undefined || raw === null) continue;  // field omitted — partial save ok

    const str = String(raw).trim();

    if (str === '') {
      errors.push({ field: def.key, reason: `${def.label} cannot be empty` });
      continue;
    }

    providedCount++;

    const reason = def.type === 'integer'
      ? _checkInteger(def.label, str)
      : _checkNumeric(def.label, str);

    if (reason) errors.push({ field: def.key, reason });
  }

  // All fields were omitted — nothing to save
  if (providedCount === 0 && errors.length === 0) {
    errors.push({ field: 'body', reason: 'At least one profile field is required' });
  }

  return { valid: errors.length === 0, errors };
}

export default { validate };
