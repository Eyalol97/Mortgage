'use strict';

/**
 * Formats a number to exactly one decimal place.
 * @param {number} value
 * @returns {number} e.g. 4500.3
 */
function formatDecimal(value) {
  return Math.round(value * 10) / 10;
}

module.exports = formatDecimal;
