// Server-side mirror of shared/validationService.js rules for profile fields.
// Runs in Node — cannot import the browser IIFE, so rules are reimplemented here.

const FIELD_DEFS = [
  { key: 'name',          label: 'Name',                  type: 'name'    },
  { key: 'gender',        label: 'Gender',                type: 'select'  },
  { key: 'age',           label: 'Age',                   type: 'age'     },
  { key: 'income',        label: 'Monthly Net Income',    type: 'numeric' },
  { key: 'equity',        label: 'Equity / Down Payment', type: 'numeric' },
  { key: 'savings',       label: 'Total Savings',         type: 'numeric' },
  { key: 'householdSize', label: 'Household Size',        type: 'integer' },
];

const VALID_GENDERS = new Set(['male', 'female', 'non-binary', 'prefer-not-to-say']);

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

function _checkName(label, raw) {
  if (!/^[֐-׿a-zA-Z\s'\-]+$/.test(raw)) return `${label} must contain only letters, spaces, or hyphens`;
  return null;
}

function _checkAge(label, raw) {
  if (!/^\d+$/.test(raw)) return `${label} must be a whole number`;
  const n = parseInt(raw, 10);
  if (n < 18)  return `${label} must be at least 18`;
  if (n > 120) return `${label} must be 120 or less`;
  return null;
}

function _checkGender(label, raw) {
  if (!VALID_GENDERS.has(raw)) return `${label} is not a recognised option`;
  return null;
}

/**
 * Validates a partial or full profile payload.
 * Omitted fields (null / undefined) are allowed — partial saves are supported.
 * At least one field must be present.
 *
 * @param {{ name?, gender?, age?, income?, equity?, savings?, householdSize? }} fields
 * @returns {{ valid: boolean, errors: Array<{ field: string, reason: string }> }}
 */
function validate({ name, gender, age, income, equity, savings, householdSize } = {}) {
  const errors = [];
  let providedCount = 0;

  const input = { name, gender, age, income, equity, savings, householdSize };

  for (const def of FIELD_DEFS) {
    const raw = input[def.key];

    if (raw === undefined || raw === null) continue;  // field omitted — partial save ok

    const str = String(raw).trim();

    if (str === '') {
      errors.push({ field: def.key, reason: `${def.label} cannot be empty` });
      continue;
    }

    providedCount++;

    let reason;
    if      (def.type === 'integer') reason = _checkInteger(def.label, str);
    else if (def.type === 'name')    reason = _checkName(def.label, str);
    else if (def.type === 'age')     reason = _checkAge(def.label, str);
    else if (def.type === 'select')  reason = _checkGender(def.label, str);
    else                             reason = _checkNumeric(def.label, str);

    if (reason) errors.push({ field: def.key, reason });
  }

  // All fields were omitted — nothing to save
  if (providedCount === 0 && errors.length === 0) {
    errors.push({ field: 'body', reason: 'At least one profile field is required' });
  }

  return { valid: errors.length === 0, errors };
}

export default { validate };
