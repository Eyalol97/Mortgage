import { calculate }       from './mortgageCalculator.js';
import * as interestRateService from './interestRateService.js';
import { validateMortgage } from '../../shared/regulationService.js';
import UsageCounter        from '../../shared/models/UsageCounter.js';

// POST /api/simulator
export async function runSimulation(req, res, next) {
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

    const validation = validateMortgage({
      propertyPrice,
      equity,
      loanDuration: duration,
    });

    if (!validation.is_valid) {
      return res.status(400).json({ errors: validation.violations });
    }

    const resolvedRate = (annualRate !== null && annualRate !== undefined)
      ? annualRate
      : await interestRateService.getRate(interestMethod);

    const result = calculate({
      repaymentMethod,
      annualRate: resolvedRate,
      propertyPrice,
      equity,
      duration,
      monthlyPayment,
    });

    // Fire-and-forget — don't block the response
    UsageCounter.increment('simulator').catch(() => {});

    return res.status(200).json({
      solvedField:         result.solvedField,
      solvedValue:         result.solvedValue,
      loan:                result.loan,
      annualRate:          resolvedRate,
      firstMonthlyPayment: result.firstMonthlyPayment,
      totalInterest:       result.totalInterest,
      totalPayment:        result.totalPayment,
      schedule:            result.schedule,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/simulator/rates
export async function getRates(req, res, next) {
  try {
    const rates = await interestRateService.getAllRates();
    return res.status(200).json({ rates });
  } catch (err) {
    next(err);
  }
}
