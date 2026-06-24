'use strict';

const ComparisonTable = (function () {

  function _t(key, fallback) {
    return (window.I18n ? window.I18n.t(key) : null) || fallback;
  }

  function methodLabel(code) {
    const map = {
      'shpitzer':    'sim.shpitzer',
      'keren-shava': 'sim.kerenShava',
      'bullet':      'sim.bullet',
    };
    return map[code] ? _t(map[code], code) : code;
  }

  function trackLabel(code) {
    const map = {
      'prime-linked': 'sim.primeLinked',
      'fixed':        'sim.fixed',
      'cpi-linked':   'sim.cpiLinked',
    };
    return map[code] ? _t(map[code], code) : code;
  }

  function getRows() {
    return [
      [_t('sim.repaymentMethod',    'Repayment Method'), m => methodLabel(m.repaymentMethod)],
      [_t('sim.interestMethod',     'Interest Method'),  m => trackLabel(m.interestMethod)],
      [_t('sim.cmp.annualRate',     'Annual Rate'),      m => window.formatDecimal(m.annualRate) + '%'],
      [_t('sim.fieldLabel.propertyPrice',  'Property Price'),  m => window.formatCurrency(m.propertyPrice)],
      [_t('sim.fieldLabel.equity',         'Equity'),          m => window.formatCurrency(m.equity)],
      [_t('sim.fieldLabel.loanAmount',     'Loan Amount'),     m => window.formatCurrency(m.loan)],
      [_t('sim.fieldLabel.duration',       'Duration'),        m => m.duration + ' ' + _t('sim.cmp.years', 'yrs')],
      [_t('sim.fieldLabel.monthlyPayment', 'Monthly Payment'), m => window.formatCurrency(m.firstMonthlyPayment)],
      [_t('sim.col.totalInterest',  'Total Interest'),   m => window.formatCurrency(m.totalInterest)],
      [_t('sim.col.totalPayment',   'Total Payment'),    m => window.formatCurrency(m.totalPayment)],
    ];
  }

  const MAX_MIXES = 3;

  function bestMixIndex(mixes) {
    let best = 0;
    mixes.forEach((m, i) => { if (m && m.totalInterest < mixes[best].totalInterest) best = i; });
    return best;
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function render(container, mixes, onMixClick) {
    container.innerHTML = '';

    const slots = Array.from({ length: MAX_MIXES }, (_, i) => mixes[i] || null);
    const filledMixes = slots.filter(Boolean);

    if (filledMixes.length === 0) {
      container.textContent = _t('sim.error.noMixes', 'No mixes saved yet.');
      return;
    }

    const best = bestMixIndex(filledMixes);
    let filledCount = 0;
    const bestSlotIndex = slots.findIndex(s => {
      if (s === null) return false;
      if (filledCount === best) return true;
      filledCount++;
      return false;
    });

    const table = el('table', 'comparison-table');

    // ── Header row ──────────────────────────────────────────────────────────
    const thead = el('thead');
    const headerRow = el('tr');
    headerRow.appendChild(el('th', 'comparison-table__label-col', ''));

    const mixWord = _t('sim.mixTab', 'Mix');
    slots.forEach((mix, i) => {
      const th = el('th', 'comparison-table__mix-col');
      th.textContent = mixWord + ' ' + (i + 1);
      if (mix) {
        th.classList.add('comparison-table__mix-col--filled');
        if (i === bestSlotIndex) th.classList.add('comparison-table__mix-col--best');
        th.addEventListener('click', () => { if (typeof onMixClick === 'function') onMixClick(i); });
        th.title = _t('sim.cmp.clickToView', 'Click to view amortization schedule');
        th.style.cursor = 'pointer';
      } else {
        th.classList.add('comparison-table__mix-col--empty');
      }
      headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    // ── Data rows ───────────────────────────────────────────────────────────
    const tbody = el('tbody');
    const ROWS = getRows();

    ROWS.forEach(([label, accessor]) => {
      const tr = el('tr');
      tr.appendChild(el('td', 'comparison-table__label', label));
      slots.forEach((mix, i) => {
        const td = el('td', 'comparison-table__cell');
        if (mix) {
          td.textContent = accessor(mix);
          if (i === bestSlotIndex) td.classList.add('comparison-table__cell--best');
        } else {
          td.textContent = '—';
          td.classList.add('comparison-table__cell--empty');
        }
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);

    // ── Best-mix note ───────────────────────────────────────────────────────
    const note = el('p', 'comparison-table__note',
      '★ ' + mixWord + ' ' + (bestSlotIndex + 1) + ' ' + _t('sim.cmp.lowestInterest', 'has the lowest total interest') + '.');

    container.appendChild(table);
    container.appendChild(note);
  }

  return { render };

})();

window.ComparisonTable = ComparisonTable;
