function formatCurrency(value) {
  return '₪' + Math.round(value).toLocaleString('he-IL');
}

window.formatCurrency = formatCurrency;
