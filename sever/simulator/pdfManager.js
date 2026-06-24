import PDFDocument from 'pdfkit';

// ── Formatters ─────────────────────────────────────────────────────────────────
// Note: PDFKit built-in fonts use WinAnsi encoding — ₪ (U+20AA) is not
// included, so we use the ISO 4217 code "ILS" for currency in PDFs.
const _currency = v => 'ILS ' + Math.round(v).toLocaleString('en-US');
const _pct      = v => (Math.round(v * 10) / 10).toFixed(1) + '%';
const _genDate  = () => new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

const METHOD_LABELS = {
  'shpitzer':    'Shpitzer (Fixed)',
  'keren-shava': 'Equal Principal',
  'bullet':      'Bullet (Interest Only)',
};
const TRACK_LABELS = {
  'prime-linked': 'Prime-Linked',
  'fixed':        'Fixed',
  'cpi-linked':   'CPI-Linked',
};

// ── Design tokens ──────────────────────────────────────────────────────────────
const C = {
  primary:     '#4d7c7a',
  primaryDark: '#3a5e5c',
  primaryMid:  '#5e9290',
  primaryPale: '#e6f4f3',
  altRow:      '#f4f8f8',
  white:       '#ffffff',
  border:      '#c4d4d3',
  textDark:    '#1a1c1e',
  textMed:     '#404948',
  textLight:   '#707978',
  bestText:    '#0a3b39',
  bestBorder:  '#4d7c7a',
  accent:      '#d4a017',       // gold star accent
  disclaimer:  '#6b7280',
};

// ── Low-level drawing helpers ──────────────────────────────────────────────────

function fillRect(doc, x, y, w, h, color) {
  doc.save().rect(x, y, w, h).fill(color).restore();
}

function strokeRect(doc, x, y, w, h, color, lw = 0.5) {
  doc.save().strokeColor(color).lineWidth(lw).rect(x, y, w, h).stroke().restore();
}

function hLine(doc, x1, x2, y, color = C.border, lw = 0.5) {
  doc.save().strokeColor(color).lineWidth(lw).moveTo(x1, y).lineTo(x2, y).stroke().restore();
}

function cellText(doc, text, x, y, w, h, opts = {}) {
  const fs     = opts.fontSize || 8.5;
  const pad    = opts.padH || 8;
  const bold   = opts.bold ? 'Helvetica-Bold' : 'Helvetica';
  const color  = opts.color || C.textDark;
  const align  = opts.align || 'left';
  const textY  = y + Math.max(2, (h - fs * 1.15) / 2);
  doc.save()
     .fillColor(color)
     .font(bold)
     .fontSize(fs)
     .text(String(text), x + pad, textY, { width: w - pad * 2, align, lineBreak: false })
     .restore();
}

// ── Header banner ──────────────────────────────────────────────────────────────

function drawHeader(doc, date) {
  const W = doc.page.width;
  const bannerH = 80;

  // Background
  fillRect(doc, 0, 0, W, bannerH, C.primary);

  // Decorative accent stripe
  fillRect(doc, 0, bannerH - 4, W, 4, C.primaryDark);

  // Brand name
  doc.save()
     .fillColor(C.white)
     .font('Helvetica-Bold')
     .fontSize(20)
     .text('GUIDED CLARITY', 0, 16, { width: W, align: 'center', lineBreak: false })
     .restore();

  // Report title
  doc.save()
     .fillColor('#cfe9e7')
     .font('Helvetica')
     .fontSize(11)
     .text('Mortgage Investment Route Comparison', 0, 42, { width: W, align: 'center', lineBreak: false })
     .restore();

  // Date
  doc.save()
     .fillColor('#a8d5d3')
     .font('Helvetica')
     .fontSize(8)
     .text('Generated: ' + date, 0, 60, { width: W, align: 'center', lineBreak: false })
     .restore();

  return bannerH + 4; // next y
}

// ── Comparison table ───────────────────────────────────────────────────────────

function drawComparisonTable(doc, mixes, startY) {
  const ML    = 40;
  const W     = doc.page.width - ML * 2;   // 515 for A4
  const LBLW  = 148;
  const mixW  = (W - LBLW) / mixes.length;
  const HDR_H = 30;
  const ROW_H = 20;

  const bestIdx = mixes.reduce(
    (b, m, i) => (m.totalInterest < mixes[b].totalInterest ? i : b), 0
  );

  let y = startY;

  // ── Section heading ──────────────────────────────────────────────────────────
  doc.save()
     .fillColor(C.textMed)
     .font('Helvetica-Bold')
     .fontSize(10)
     .text('INVESTMENT ROUTE COMPARISON', ML, y, { width: W, align: 'left', lineBreak: false })
     .restore();

  hLine(doc, ML, ML + W, y + 14, C.primary, 1.5);
  y += 22;

  // ── Column headers ───────────────────────────────────────────────────────────

  // Label column header
  fillRect(doc, ML, y, LBLW, HDR_H, C.primary);
  cellText(doc, 'ROUTE', ML, y, LBLW, HDR_H, {
    bold: true, fontSize: 8, color: '#cfe9e7', align: 'center',
  });

  // Mix column headers
  mixes.forEach((mix, i) => {
    const x    = ML + LBLW + i * mixW;
    const isBest = i === bestIdx;
    fillRect(doc, x, y, mixW, HDR_H, isBest ? C.primaryDark : C.primaryMid);

    const label = 'MIX ' + (i + 1) + (isBest ? '  [BEST]' : '');
    cellText(doc, label, x, y, mixW, HDR_H, {
      bold: true, fontSize: 10, color: C.white, align: 'center',
    });
  });

  // Header border
  strokeRect(doc, ML, y, W, HDR_H, C.primaryDark, 1);
  y += HDR_H;

  // ── Data rows ────────────────────────────────────────────────────────────────
  const ROWS = [
    { label: 'Repayment Method', fn: m => METHOD_LABELS[m.repaymentMethod] || m.repaymentMethod },
    { label: 'Interest Method',  fn: m => TRACK_LABELS[m.interestMethod]   || m.interestMethod },
    { label: 'Annual Rate',      fn: m => _pct(m.annualRate) },
    null, // divider
    { label: 'Property Price',   fn: m => _currency(m.propertyPrice) },
    { label: 'Equity',           fn: m => _currency(m.equity) },
    { label: 'Loan Amount',      fn: m => _currency(m.loan) },
    { label: 'Duration',         fn: m => m.duration + ' yrs' },
    null, // divider
    { label: 'Monthly Payment',  fn: m => _currency(m.firstMonthlyPayment) },
    { label: 'Total Interest',   fn: m => _currency(m.totalInterest) },
    { label: 'Total Payment',    fn: m => _currency(m.totalPayment) },
  ];

  let dataRowIdx = 0;
  ROWS.forEach((row, ri) => {
    if (row === null) {
      // Thin section separator
      hLine(doc, ML, ML + W, y, C.primary, 0.8);
      y += 4;
      return;
    }

    const isResults = dataRowIdx >= 8; // Monthly Payment + below
    const rowBg     = dataRowIdx % 2 === 0 ? C.white : C.altRow;
    dataRowIdx++;

    // Label cell
    fillRect(doc, ML, y, LBLW, ROW_H, rowBg);
    cellText(doc, row.label, ML, y, LBLW, ROW_H, {
      bold: isResults, fontSize: 8.5, color: isResults ? C.textDark : C.textMed,
    });

    // Mix value cells
    mixes.forEach((mix, i) => {
      const x      = ML + LBLW + i * mixW;
      const isBest = i === bestIdx;
      fillRect(doc, x, y, mixW, ROW_H, isBest ? C.primaryPale : rowBg);

      const val = row.fn(mix);
      cellText(doc, val, x, y, mixW, ROW_H, {
        bold:  isBest && isResults,
        fontSize: 8.5,
        color: isBest ? C.bestText : C.textDark,
        align: 'right',
        padH:  10,
      });
    });

    // Row border
    strokeRect(doc, ML, y, W, ROW_H, C.border, 0.4);
    y += ROW_H;
  });

  // ── Outer table border ────────────────────────────────────────────────────────
  strokeRect(doc, ML, startY + 22 + HDR_H - HDR_H, ML + W - ML, y - (startY + 22), C.primaryDark, 1);

  return y; // next y
}

// ── Best-mix callout ───────────────────────────────────────────────────────────

function drawBestNote(doc, mixes, y) {
  const ML = 40;
  const W  = doc.page.width - ML * 2;

  const bestIdx = mixes.reduce(
    (b, m, i) => (m.totalInterest < mixes[b].totalInterest ? i : b), 0
  );
  const best  = mixes[bestIdx];
  const worst = mixes.reduce((w, m) => (m.totalInterest > w.totalInterest ? m : w), mixes[0]);
  const saved = worst.totalInterest - best.totalInterest;

  const boxH = 30;
  y += 10;

  fillRect(doc, ML, y, W, boxH, C.primaryPale);
  strokeRect(doc, ML, y, W, boxH, C.bestBorder, 1);

  const savings = saved > 0
    ? '  —  saves ' + _currency(saved) + ' vs. most expensive option'
    : '';
  const note = '>>  Mix ' + (bestIdx + 1) + ' has the lowest total interest' + savings;

  doc.save()
     .fillColor(C.bestText)
     .font('Helvetica-Bold')
     .fontSize(9)
     .text(note, ML + 12, y + (boxH - 9) / 2 - 1, { width: W - 24, lineBreak: false })
     .restore();

  return y + boxH;
}

// ── Footer ─────────────────────────────────────────────────────────────────────

function drawFooter(doc) {
  const W    = doc.page.width;
  const ML   = 40;
  // Keep footer well inside the page content area (A4 = 841.89pt, margin 40pt → area ends at 801.89)
  // Three items (line + 2 text lines + brand) need ~40pt total so start at height-68
  const footY = doc.page.height - 68;

  hLine(doc, ML, W - ML, footY, C.primary, 1);

  doc.save()
     .fillColor(C.disclaimer)
     .font('Helvetica')
     .fontSize(7)
     .text('This document is an estimate only and does not constitute an official bank offer or financial advice.',
           ML, footY + 8, { width: W - ML * 2, align: 'center', lineBreak: false })
     .restore();

  doc.save()
     .fillColor(C.disclaimer)
     .font('Helvetica')
     .fontSize(7)
     .text('Consult a licensed mortgage advisor before making any decisions.',
           ML, footY + 18, { width: W - ML * 2, align: 'center', lineBreak: false })
     .restore();

  doc.save()
     .fillColor(C.textLight)
     .font('Helvetica')
     .fontSize(7)
     .text('Guided Clarity  |  mortgage-comparison.pdf',
           ML, footY + 32, { width: W - ML * 2, align: 'center', lineBreak: false })
     .restore();
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function generatePdf(req, res, next) {
  try {
    let mixes;
    try {
      mixes = req.body && Array.isArray(req.body.mixes) ? req.body.mixes : null;
      if (!mixes) throw new Error('missing');
    } catch {
      return res.status(400).json({ error: 'Request body must include a "mixes" array.' });
    }

    if (mixes.length < 2 || mixes.length > 3) {
      return res.status(400).json({ error: 'Provide 2 or 3 mixes to generate a comparison PDF.' });
    }

    const REQUIRED = ['repaymentMethod','interestMethod','annualRate','propertyPrice','equity','loan','duration','firstMonthlyPayment','totalInterest','totalPayment'];
    for (let i = 0; i < mixes.length; i++) {
      const missing = REQUIRED.filter(k => mixes[i][k] == null);
      if (missing.length) {
        return res.status(400).json({ error: `Mix ${i + 1} is missing fields: ${missing.join(', ')}` });
      }
    }

    const doc = new PDFDocument({ size: 'A4', margin: 40, autoFirstPage: true });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="mortgage-comparison.pdf"');
    doc.pipe(res);

    const date = _genDate();

    // Header (drawn at page top, ignoring margin)
    let y = drawHeader(doc, date);
    y += 18; // gap after banner

    // Comparison table
    doc.y = y;
    y = drawComparisonTable(doc, mixes, y);

    // Best-mix callout
    y = drawBestNote(doc, mixes, y);

    // Footer pinned to bottom
    drawFooter(doc);

    doc.end();
  } catch (err) {
    next(err);
  }
}
