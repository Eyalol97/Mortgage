'use strict';

const { calculate }        = require('./mortgageCalculator');
const interestRateService  = require('./interestRateService');
const regulationService    = require('../../shared/regulationService');
const UsageCounter         = require('../../shared/models/UsageCounter');

// POST /api/simulator
async function runSimulation(req, res, next) {
  try {
    const {
      repaymentMethod,
      interestMethod,
      annualRate,
      propertyPrice,
      equity,
      duration,
      monthlyPayment,
    } = req.body;

    // Regulatory validation (LTV limits, max duration, equity vs price, etc.)
    const validation = regulationService.validate({
      propertyPrice,
      equity,
      duration,
      monthlyPayment,
    });

    if (!validation.valid) {
      return res.status(400).json({ errors: validation.errors });
    }

    // If user left the rate field empty, fetch the current market average
    const resolvedRate = (annualRate !== null && annualRate !== undefined)
      ? annualRate
      : await interestRateService.getRate(interestMethod);

    // Run the core calculation
    const result = calculate({
      repaymentMethod,
      annualRate: resolvedRate,
      propertyPrice,
      equity,
      duration,
      monthlyPayment,
    });

    // Track usage (fire-and-forget — don't block the response)
    UsageCounter.increment('simulator').catch(() => {});

    return res.status(200).json({
      solvedField:        result.solvedField,
      solvedValue:        result.solvedValue,
      loan:               result.loan,
      annualRate:         resolvedRate,
      firstMonthlyPayment: result.firstMonthlyPayment,
      totalInterest:      result.totalInterest,
      totalPayment:       result.totalPayment,
      schedule:           result.schedule,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/simulator/rates
async function getRates(req, res, next) {
  try {
    const rates = await interestRateService.getAllRates();
    return res.status(200).json({ rates });
  } catch (err) {
    next(err);
  }
}

module.exports = { runSimulation, getRates };
