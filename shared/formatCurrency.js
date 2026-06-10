'use strict';

/**
 * Formats a number as an Israeli Shekel currency string.
 * @param {number} value
 * @returns {string} e.g. "₪1,200,000"
 */
function formatCurrency(value) {
  return '₪' + Math.round(value).toLocaleString('he-IL');
}

module.exports = formatCurrency;
