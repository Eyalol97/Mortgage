import { calculate }       from './mortgageCalculator.js';
import * as interestRateService from './interestRateService.js';
import { validateMortgage } from '../../shared/regulationService.js';
import UsageCounter        from '../../shared/models/UsageCounter.js';

const VALID_REPAYMENT = ['shpitzer', 'keren-shava', 'bullet'];
const VALID_INTEREST  = ['prime-linked', 'fixed', 'cpi-linked'];
const FINANCIAL_KEYS  = ['propertyPrice', 'equity', 'duration', 'monthlyPayment'];

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

    // ── Mandatory method fields ──────────────────────────────────────────────
    if (!repaymentMethod || !VALID_REPAYMENT.includes(repaymentMethod)) {
      return res.status(400).json({ error: `repaymentMethod must be one of: ${VALID_REPAYMENT.join(', ')}` });
    }
    if (!interestMethod || !VALID_INTEREST.includes(interestMethod)) {
      return res.status(400).json({ error: `interestMethod must be one of: ${VALID_INTEREST.join(', ')}` });
    }

    // ── Exactly 3-of-4 financial fields ──────────────────────────────────────
    const financial = { propertyPrice, equity, duration, monthlyPayment };
    const missing   = FINANCIAL_KEYS.filter(k => financial[k] == null);
    if (missing.length !== 1) {
      return res.status(400).json({
        error: missing.length === 0
          ? 'All 4 financial fields provided — leave exactly one empty to solve for it'
          : `Provide exactly 3 of the 4 financial fields (missing: ${missing.join(', ')})`,
      });
    }

    // ── Field-level validation (only for provided values) ────────────────────
    if (annualRate != null && annualRate <= 0) {
      return res.status(400).json({ error: 'annualRate must be a positive number' });
    }
    if (duration != null && (duration < 1 || duration > 30)) {
      return res.status(400).json({ error: `duration must be between 1 and 30 years (got ${duration})` });
    }

    // ── Bank of Israel regulation check (on provided fields only) ────────────
    const validation = validateMortgage({ propertyPrice, equity, loanDuration: duration });
    if (!validation.is_valid) {
      return res.status(400).json({ errors: validation.violations });
    }

    // ── Rate resolution ───────────────────────────────────────────────────────
    const resolvedRate = (annualRate != null)
      ? annualRate
      : await interestRateService.getRate(interestMethod);

    // ── Calculate — wrap separately so calc errors become 400 not 500 ────────
    let result;
    try {
      result = calculate({ repaymentMethod, annualRate: resolvedRate, propertyPrice, equity, duration, monthlyPayment });
    } catch (calcErr) {
      return res.status(400).json({ error: calcErr.message });
    }

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
