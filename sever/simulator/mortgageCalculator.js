'use strict';

// duration is in years externally; converted to months internally.
// annualRate is in percent (e.g. 4.5 means 4.5%).
// All monetary values are in ILS.

function _r(annualRatePercent) {
  return annualRatePercent / 100 / 12;
}

// ── Shpitzer (fixed monthly payment) ─────────────────────────────────────────

function _shpitzerPayment(loan, n, r) {
  if (r === 0) return loan / n;
  return (loan * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

function _shpitzerLoan(payment, n, r) {
  if (r === 0) return payment * n;
  return (payment * (Math.pow(1 + r, n) - 1)) / (r * Math.pow(1 + r, n));
}

function _shpitzerMonths(loan, payment, r) {
  if (r === 0) return Math.ceil(loan / payment);
  if (payment <= loan * r) throw new Error('Monthly payment is too low to cover interest');
  return Math.ceil(-Math.log(1 - (loan * r) / payment) / Math.log(1 + r));
}

function _buildShpitzerSchedule(loan, n, r) {
  const M = _shpitzerPayment(loan, n, r);
  const schedule = [];
  let balance = loan;
  for (let m = 1; m <= n; m++) {
    const interest = balance * r;
    const principal = m === n ? balance : M - interest;
    balance = Math.max(0, balance - principal);
    schedule.push({ month: m, payment: principal + interest, principal, interest, remainingBalance: balance });
  }
  return schedule;
}

// ── Equal Principal / Keren Shava (fixed principal, decreasing payment) ───────

function _kerenShavaFirstPayment(loan, n, r) {
  return loan / n + loan * r;
}

function _kerenShavaLoan(firstPayment, n, r) {
  const divisor = 1 / n + r;
  if (divisor <= 0) throw new Error('Invalid inputs for Equal Principal calculation');
  return firstPayment / divisor;
}

function _kerenShavaMonths(loan, firstPayment, r) {
  const monthlyPrincipal = firstPayment - loan * r;
  if (monthlyPrincipal <= 0) throw new Error('Monthly payment is too low to cover interest');
  return Math.ceil(loan / monthlyPrincipal);
}

function _buildKerenShavaSchedule(loan, n, r) {
  const monthlyPrincipal = loan / n;
  const schedule = [];
  let balance = loan;
  for (let m = 1; m <= n; m++) {
    const interest = balance * r;
    const principal = m === n ? balance : monthlyPrincipal;
    balance = Math.max(0, balance - principal);
    schedule.push({ month: m, payment: principal + interest, principal, interest, remainingBalance: balance });
  }
  return schedule;
}

// ── Bullet (interest-only, full principal at end) ─────────────────────────────

function _bulletMonthlyPayment(loan, r) {
  return loan * r;
}

function _bulletLoan(payment, r) {
  if (r === 0) throw new Error('Cannot calculate loan from monthly payment with 0% rate in Bullet method');
  return payment / r;
}

function _buildBulletSchedule(loan, n, r) {
  const interest = loan * r;
  const schedule = [];
  for (let m = 1; m <= n; m++) {
    const isLast = m === n;
    const principal = isLast ? loan : 0;
    const payment = isLast ? loan + interest : interest;
    schedule.push({ month: m, payment, principal, interest, remainingBalance: isLast ? 0 : loan });
  }
  return schedule;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Solves the missing 4th financial variable and returns full amortization data.
 *
 * Exactly one of { propertyPrice, equity, duration, monthlyPayment } must be null/undefined.
 *
 * @param {object} params
 * @param {'shpitzer'|'keren-shava'|'bullet'} params.repaymentMethod
 * @param {number}      params.annualRate      - Annual rate in percent
 * @param {number|null} params.propertyPrice   - ILS
 * @param {number|null} params.equity          - ILS
 * @param {number|null} params.duration        - Years
 * @param {number|null} params.monthlyPayment  - ILS
 *
 * @returns {{
 *   solvedField: string,
 *   solvedValue: number,
 *   loan: number,
 *   firstMonthlyPayment: number,
 *   totalInterest: number,
 *   totalPayment: number,
 *   schedule: Array<{month, payment, principal, interest, remainingBalance}>
 * }}
 */
function calculate({ repaymentMethod, annualRate, propertyPrice, equity, duration, monthlyPayment }) {
  const VALID_METHODS = ['shpitzer', 'keren-shava', 'bullet'];
  if (!VALID_METHODS.includes(repaymentMethod)) {
    throw new Error(`Unknown repayment method: ${repaymentMethod}`);
  }

  const method = repaymentMethod;
  const r = _r(annualRate);

  const fields = { propertyPrice, equity, duration, monthlyPayment };
  const missingFields = Object.keys(fields).filter(k => fields[k] === null || fields[k] === undefined);
  if (missingFields.length !== 1) {
    throw new Error('Exactly one of propertyPrice, equity, duration, monthlyPayment must be null');
  }

  const missing = missingFields[0];
  let loan, n, solvedValue;

  if (missing === 'monthlyPayment') {
    loan = propertyPrice - equity;
    n = duration * 12;
    if (method === 'shpitzer')         solvedValue = _shpitzerPayment(loan, n, r);
    else if (method === 'keren-shava') solvedValue = _kerenShavaFirstPayment(loan, n, r);
    else                               solvedValue = _bulletMonthlyPayment(loan, r);
    monthlyPayment = solvedValue;

  } else if (missing === 'duration') {
    loan = propertyPrice - equity;
    if (method === 'bullet') throw new Error('Duration cannot be solved for Bullet repayment method');
    const months = method === 'shpitzer'
      ? _shpitzerMonths(loan, monthlyPayment, r)
      : _kerenShavaMonths(loan, monthlyPayment, r);
    n = months;
    solvedValue = Math.ceil(months / 12);
    duration = solvedValue;

  } else if (missing === 'equity') {
    n = duration * 12;
    let derivedLoan;
    if (method === 'shpitzer')         derivedLoan = _shpitzerLoan(monthlyPayment, n, r);
    else if (method === 'keren-shava') derivedLoan = _kerenShavaLoan(monthlyPayment, n, r);
    else                               derivedLoan = _bulletLoan(monthlyPayment, r);
    loan = derivedLoan;
    solvedValue = propertyPrice - derivedLoan;
    equity = solvedValue;

  } else {
    // missing === 'propertyPrice'
    n = duration * 12;
    let derivedLoan;
    if (method === 'shpitzer')         derivedLoan = _shpitzerLoan(monthlyPayment, n, r);
    else if (method === 'keren-shava') derivedLoan = _kerenShavaLoan(monthlyPayment, n, r);
    else                               derivedLoan = _bulletLoan(monthlyPayment, r);
    loan = derivedLoan;
    solvedValue = equity + derivedLoan;
    propertyPrice = solvedValue;
  }

  if (!loan || loan <= 0) throw new Error('Loan amount must be positive');
  if (!n || n <= 0)       throw new Error('Duration must be positive');

  let schedule;
  if (method === 'shpitzer')         schedule = _buildShpitzerSchedule(loan, n, r);
  else if (method === 'keren-shava') schedule = _buildKerenShavaSchedule(loan, n, r);
  else                               schedule = _buildBulletSchedule(loan, n, r);

  const totalPayment  = schedule.reduce((sum, row) => sum + row.payment, 0);
  const totalInterest = totalPayment - loan;

  return {
    solvedField: missing,
    solvedValue,
    loan,
    firstMonthlyPayment: schedule[0].payment,
    totalInterest,
    totalPayment,
    schedule,
  };
}

module.exports = { calculate };
