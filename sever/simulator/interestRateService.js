'use strict';

const https        = require('https');
const cron         = require('node-cron');
const InterestRate = require('../../shared/models/InterestRate');
const env          = require('../../shared/env');

// Hardcoded fallback rates (percent) used when the DB has no record for a track
// and the Bank of Israel API is unreachable.
const FALLBACK_RATES = {
  'prime-linked': 5.5,
  'fixed':        4.5,
  'cpi-linked':   3.5,
};

const VALID_TRACKS = Object.keys(FALLBACK_RATES);

// ── Bank of Israel API sync ───────────────────────────────────────────────────

function fetchBoIRates() {
  return new Promise((resolve, reject) => {
    const url = env.BOI_API_URL;
    if (!url) return reject(new Error('BOI_API_URL not configured'));

    https.get(url, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          reject(new Error('Failed to parse Bank of Israel API response'));
        }
      });
    }).on('error', reject);
  });
}

// Maps the raw BoI API response to our track keys.
// Adjust field names here when the actual BoI API schema is known.
function parseBoIResponse(raw) {
  return {
    'prime-linked': raw.primeMortgageRate ?? null,
    'fixed':        raw.fixedMortgageRate ?? null,
    'cpi-linked':   raw.cpiLinkedRate     ?? null,
  };
}

async function syncRates() {
  try {
    const raw    = await fetchBoIRates();
    const parsed = parseBoIResponse(raw);

    await Promise.all(
      VALID_TRACKS.map(track => {
        const rate = parsed[track];
        if (rate === null || rate === undefined) return Promise.resolve();
        return InterestRate.findOneAndUpdate(
          { track },
          { rate, updatedAt: new Date(), source: 'Bank of Israel' },
          { upsert: true, new: true }
        );
      })
    );

    console.log('[interestRateService] Rates synced from Bank of Israel');
  } catch (err) {
    console.error('[interestRateService] Sync failed — keeping existing DB rates:', err.message);
  }
}

// Run on the 1st of every month at 03:00
cron.schedule('0 3 1 * *', syncRates);

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Returns the current market-average rate for a given track.
 * Falls back to hardcoded defaults if the DB has no record.
 *
 * @param {'prime-linked'|'fixed'|'cpi-linked'} track
 * @returns {Promise<number>} annual rate in percent
 */
async function getRate(track) {
  if (!VALID_TRACKS.includes(track)) {
    throw new Error(`Unknown interest track: ${track}`);
  }

  const record = await InterestRate.findOne({ track });
  return record ? record.rate : FALLBACK_RATES[track];
}

/**
 * Returns all current market-average rates, one per track.
 * Falls back to hardcoded defaults for any track missing from the DB.
 *
 * @returns {Promise<Array<{track, rate, updatedAt, source}>>}
 */
async function getAllRates() {
  const records = await InterestRate.find();
  const inDB = new Map(records.map(r => [r.track, r]));

  return VALID_TRACKS.map(track => {
    const record = inDB.get(track);
    return record
      ? { track, rate: record.rate, updatedAt: record.updatedAt, source: record.source }
      : { track, rate: FALLBACK_RATES[track], updatedAt: null, source: 'fallback' };
  });
}

module.exports = { getRate, getAllRates, syncRates };
