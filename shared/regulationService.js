import tracks from './models/seed/mortgageTracks.json' with { type: 'json' };

const RULES = {
  MAX_LTV: 0.75,       // Bank of Israel cap for owner-occupied primary residence
  MAX_LOAN_YEARS: 30,
};

/**
 * selectedTracks: [{ id: string, ratio: number }]
 *   ratio = fraction of total loan allocated to this track (0–1, all must sum to 1)
 */
function validateMortgage({ propertyPrice, equity, loanDuration, selectedTracks }) {
  const violations = [];
  const loanAmount = propertyPrice - equity;

  if (equity >= propertyPrice) {
    violations.push({
      rule: 'EQUITY_EXCEEDS_PRICE',
      reason: 'Down payment cannot equal or exceed the property price.',
    });
  }

  const ltv = loanAmount / propertyPrice;
  if (ltv > RULES.MAX_LTV) {
    violations.push({
      rule: 'MAX_LTV',
      reason: `LTV of ${(ltv * 100).toFixed(1)}% exceeds the Bank of Israel maximum of ${RULES.MAX_LTV * 100}% for a primary residence.`,
    });
  }

  if (loanDuration > RULES.MAX_LOAN_YEARS) {
    violations.push({
      rule: 'MAX_LOAN_YEARS',
      reason: `Loan duration of ${loanDuration} years exceeds the maximum allowed ${RULES.MAX_LOAN_YEARS} years.`,
    });
  }

  if (Array.isArray(selectedTracks) && selectedTracks.length > 0) {
    const totalRatio = selectedTracks.reduce((sum, t) => sum + (t.ratio ?? 0), 0);

    for (const selected of selectedTracks) {
      const trackDef = tracks.find((t) => t.id === selected.id);
      if (!trackDef) continue;

      const normalised = totalRatio > 0 ? selected.ratio / totalRatio : selected.ratio;
      if (normalised > trackDef.maxPortfolioRatio) {
        violations.push({
          rule: 'TRACK_RATIO_EXCEEDED',
          reason: `Track "${trackDef.name}" allocation of ${(normalised * 100).toFixed(1)}% exceeds the Bank of Israel cap of ${(trackDef.maxPortfolioRatio * 100).toFixed(1)}%.`,
        });
      }
    }
  }

  return {
    is_valid: violations.length === 0,
    violations,
  };
}

export { validateMortgage, RULES };
