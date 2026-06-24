'use strict';

// Client-side mortgage calculator — same formulas as sever/simulator/mortgageCalculator.js
// Exposed as window.MortgageCalc so simulator-ui.js can call it without a backend round-trip.

(function () {

  function _r(annualRatePercent) {
    return annualRatePercent / 100 / 12;
  }

  // ── Shpitzer ────────────────────────────────────────────────────────────────

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
    const rows = [];
    let balance = loan;
    for (let m = 1; m <= n; m++) {
      const interest  = balance * r;
      const principal = m === n ? balance : M - interest;
      balance = Math.max(0, balance - principal);
      rows.push({ month: m, payment: principal + interest, principal, interest, remainingBalance: balance });
    }
    return rows;
  }

  // ── Keren Shava ─────────────────────────────────────────────────────────────

  function _kerenShavaFirstPayment(loan, n, r) {
    return loan / n + loan * r;
  }

  function _kerenShavaLoan(firstPayment, n, r) {
    const d = 1 / n + r;
    if (d <= 0) throw new Error('Invalid inputs for Equal Principal calculation');
    return firstPayment / d;
  }

  function _kerenShavaMonths(loan, firstPayment, r) {
    const monthlyPrincipal = firstPayment - loan * r;
    if (monthlyPrincipal <= 0) throw new Error('Monthly payment is too low to cover interest');
    return Math.ceil(loan / monthlyPrincipal);
  }

  function _buildKerenShavaSchedule(loan, n, r) {
    const monthlyPrincipal = loan / n;
    const rows = [];
    let balance = loan;
    for (let m = 1; m <= n; m++) {
      const interest  = balance * r;
      const principal = m === n ? balance : monthlyPrincipal;
      balance = Math.max(0, balance - principal);
      rows.push({ month: m, payment: principal + interest, principal, interest, remainingBalance: balance });
    }
    return rows;
  }

  // ── Bullet ──────────────────────────────────────────────────────────────────

  function _bulletPayment(loan, r) {
    return loan * r;
  }

  function _bulletLoan(payment, r) {
    if (r === 0) throw new Error('Cannot derive loan from payment with 0% rate in Bullet method');
    return payment / r;
  }

  function _buildBulletSchedule(loan, n, r) {
    const interest = loan * r;
    const rows = [];
    for (let m = 1; m <= n; m++) {
      const isLast    = m === n;
      const principal = isLast ? loan : 0;
      const payment   = isLast ? loan + interest : interest;
      rows.push({ month: m, payment, principal, interest, remainingBalance: isLast ? 0 : loan });
    }
    return rows;
  }

  // ── Public API ───────────────────────────────────────────────────────────────

  function calculate({ repaymentMethod, annualRate, propertyPrice, equity, duration, monthlyPayment }) {
    const METHODS = ['shpitzer', 'keren-shava', 'bullet'];
    if (!METHODS.includes(repaymentMethod)) throw new Error('Unknown repayment method: ' + repaymentMethod);

    const r      = _r(annualRate);
    const fields = { propertyPrice, equity, duration, monthlyPayment };
    const nulls  = Object.keys(fields).filter(k => fields[k] === null || fields[k] === undefined);

    if (nulls.length !== 1) throw new Error('Exactly one of propertyPrice, equity, duration, monthlyPayment must be empty');

    const missing = nulls[0];
    let loan, n, solvedValue;

    if (missing === 'monthlyPayment') {
      loan  = propertyPrice - equity;
      n     = duration * 12;
      if (repaymentMethod === 'shpitzer')    solvedValue = _shpitzerPayment(loan, n, r);
      else if (repaymentMethod === 'keren-shava') solvedValue = _kerenShavaFirstPayment(loan, n, r);
      else                                   solvedValue = _bulletPayment(loan, r);
      monthlyPayment = solvedValue;

    } else if (missing === 'duration') {
      loan = propertyPrice - equity;
      if (repaymentMethod === 'bullet') throw new Error('Duration cannot be solved for Bullet method');
      const months = repaymentMethod === 'shpitzer'
        ? _shpitzerMonths(loan, monthlyPayment, r)
        : _kerenShavaMonths(loan, monthlyPayment, r);
      n           = months;
      solvedValue = Math.ceil(months / 12);
      duration    = solvedValue;

    } else if (missing === 'equity') {
      n = duration * 12;
      let derivedLoan;
      if (repaymentMethod === 'shpitzer')    derivedLoan = _shpitzerLoan(monthlyPayment, n, r);
      else if (repaymentMethod === 'keren-shava') derivedLoan = _kerenShavaLoan(monthlyPayment, n, r);
      else                                   derivedLoan = _bulletLoan(monthlyPayment, r);
      loan        = derivedLoan;
      solvedValue = propertyPrice - derivedLoan;
      equity      = solvedValue;

    } else {
      // missing === 'propertyPrice'
      n = duration * 12;
      let derivedLoan;
      if (repaymentMethod === 'shpitzer')    derivedLoan = _shpitzerLoan(monthlyPayment, n, r);
      else if (repaymentMethod === 'keren-shava') derivedLoan = _kerenShavaLoan(monthlyPayment, n, r);
      else                                   derivedLoan = _bulletLoan(monthlyPayment, r);
      loan        = derivedLoan;
      solvedValue = equity + derivedLoan;
      propertyPrice = solvedValue;
    }

    if (!loan || loan <= 0) throw new Error('Loan amount must be positive');
    if (!n    || n    <= 0) throw new Error('Duration must be positive');

    let schedule;
    if (repaymentMethod === 'shpitzer')    schedule = _buildShpitzerSchedule(loan, n, r);
    else if (repaymentMethod === 'keren-shava') schedule = _buildKerenShavaSchedule(loan, n, r);
    else                                   schedule = _buildBulletSchedule(loan, n, r);

    const totalPayment  = schedule.reduce((s, row) => s + row.payment, 0);
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

  window.MortgageCalc = { calculate };

})();
