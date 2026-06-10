'use strict';

// ComparisonTable — renders the side-by-side mix comparison table.
// Exposes itself on window.ComparisonTable so simulator-ui.js can call it.
//
// Assumes the following globals are loaded before this script:
//   window.formatCurrency — shared/formatCurrency.js (Simha)
//   window.formatDecimal  — shared/formatDecimal.js  (Simha)

const ComparisonTable = (function () {

  const METHOD_LABELS = {
    'shpitzer':    'Shpitzer',
    'keren-shava': 'Equal Principal',
    'bullet':      'Bullet',
  };

  const TRACK_LABELS = {
    'prime-linked': 'Prime-Linked',
    'fixed':        'Fixed',
    'cpi-linked':   'CPI-Linked',
  };

  // Rows: [label, accessor function]
  const ROWS = [
    ['Repayment Method', m => METHOD_LABELS[m.repaymentMethod] || m.repaymentMethod],
    ['Interest Method',  m => TRACK_LABELS[m.interestMethod]   || m.interestMethod],
    ['Annual Rate',      m => window.formatDecimal(m.annualRate) + '%'],
    ['Property Price',   m => window.formatCurrency(m.propertyPrice)],
    ['Equity',           m => window.formatCurrency(m.equity)],
    ['Loan Amount',      m => window.formatCurrency(m.loan)],
    ['Duration',         m => m.duration + ' years'],
    ['Monthly Payment',  m => window.formatCurrency(m.firstMonthlyPayment)],
    ['Total Interest',   m => window.formatCurrency(m.totalInterest)],
    ['Total Payment',    m => window.formatCurrency(m.totalPayment)],
  ];

  const MAX_MIXES = 3;

  // ── Helpers ───────────────────────────────────────────────────────────────

  function bestMixIndex(mixes) {
    let best = 0;
    mixes.forEach((m, i) => {
      if (m && m.totalInterest < mixes[best].totalInterest) best = i;
    });
    return best;
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  // ── Render ────────────────────────────────────────────────────────────────

  /**
   * Renders the comparison table into the given container element.
   *
   * @param {HTMLElement}  container   Target DOM element (cleared before render).
   * @param {Array}        mixes       Array of 1–3 mix result objects. Null slots = empty column.
   * @param {function}     onMixClick  Called with the mix index when a column header is clicked.
   */
  function render(container, mixes, onMixClick) {
    container.innerHTML = '';

    // Pad to MAX_MIXES slots
    const slots = Array.from({ length: MAX_MIXES }, (_, i) => mixes[i] || null);
    const filledMixes = slots.filter(Boolean);

    if (filledMixes.length === 0) {
      container.textContent = 'No mixes saved yet.';
      return;
    }

    const best = bestMixIndex(filledMixes);
    // Map best index back into the slots array
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

    slots.forEach((mix, i) => {
      const th = el('th', 'comparison-table__mix-col');

      if (mix) {
        th.textContent = `Mix ${i + 1}`;
        th.classList.add('comparison-table__mix-col--filled');
        if (i === bestSlotIndex) th.classList.add('comparison-table__mix-col--best');

        th.addEventListener('click', () => {
          if (typeof onMixClick === 'function') onMixClick(i);
        });
        th.title = 'Click to view amortization schedule';
        th.style.cursor = 'pointer';
      } else {
        th.textContent = `Mix ${i + 1}`;
        th.classList.add('comparison-table__mix-col--empty');
      }

      headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    // ── Data rows ───────────────────────────────────────────────────────────
    const tbody = el('tbody');

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
      `★ Mix ${bestSlotIndex + 1} has the lowest total interest.`);

    container.appendChild(table);
    container.appendChild(note);
  }

  return { render };

})();

window.ComparisonTable = ComparisonTable;
