import PDFDocument from 'pdfkit';
import path        from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONT_REG  = path.join(__dirname, '..', 'fonts', 'NotoSansHebrew-Regular.ttf');
const FONT_BOLD = path.join(__dirname, '..', 'fonts', 'NotoSansHebrew-Bold.ttf');

// ── Formatters ─────────────────────────────────────────────────────────────────
const _currency = v => 'ILS ' + Math.round(v).toLocaleString('en-US');
const _pct      = v => (Math.round(v * 10) / 10).toFixed(1) + '%';
const _genDate  = () => new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

// ── Hebrew text helper ─────────────────────────────────────────────────────────
// PDFKit renders text LTR. Reverse Hebrew strings so they read correctly RTL.
// Also swap mirror-characters so they visually match their Hebrew context.
function rtl(str) {
  return [...String(str)].reverse().map(c =>
    c === '(' ? ')' : c === ')' ? '(' :
    c === '[' ? ']' : c === ']' ? '[' : c
  ).join('');
}

// ── Static labels ──────────────────────────────────────────────────────────────
// All Hebrew strings are pre-reversed for PDFKit's LTR rendering.
// Dynamic segments (labels concatenated with numbers at runtime) are
// kept in HE_RAW and reversed on the fly with rtl().
const EN = {
  bannerSubtitle:  'Mortgage Investment Route Comparison',
  sectionHeading:  'INVESTMENT ROUTE COMPARISON',
  sectionHeading1: 'INVESTMENT ROUTE ANALYSIS',
  routeCol:        'ROUTE',
  repaymentMethod: 'Repayment Method',
  interestMethod:  'Interest Method',
  annualRate:      'Annual Rate',
  propertyPrice:   'Property Price',
  equity:          'Equity',
  loanAmount:      'Loan Amount',
  duration:        'Duration',
  monthlyPayment:  'Monthly Payment',
  totalInterest:   'Total Interest',
  totalPayment:    'Total Payment',
  methodShpitzer:  'Shpitzer',
  methodKerenShava:'Equal Principal',
  methodBullet:    'Bullet',
  trackPrime:      'Prime-Linked',
  trackFixed:      'Fixed',
  trackCpi:        'CPI-Linked',
  disclaimer1:     'This document is an estimate only and does not constitute an official bank offer or financial advice.',
  disclaimer2:     'Consult a licensed mortgage advisor before making any decisions.',
};

// Standalone Hebrew labels (pre-reversed)
const HE = {
  bannerSubtitle:  rtl('השוואת מסלולי השקעה במשכנתא'),
  sectionHeading:  rtl('השוואת מסלולי השקעה'),
  sectionHeading1: rtl('ניתוח מסלול השקעה'),
  routeCol:        rtl('מסלול'),
  repaymentMethod: rtl('שיטת פירעון'),
  interestMethod:  rtl('שיטת ריבית'),
  annualRate:      rtl('ריבית שנתית'),
  propertyPrice:   rtl('מחיר הנכס'),
  equity:          rtl('הון עצמי'),
  loanAmount:      rtl('סכום הלוואה'),
  duration:        rtl('משך'),
  monthlyPayment:  rtl('תשלום חודשי'),
  totalInterest:   rtl('ריבית כוללת'),
  totalPayment:    rtl('תשלום כולל'),
  methodShpitzer:  rtl('שפיצר'),
  methodKerenShava:rtl('קרן שווה'),
  methodBullet:    rtl('בוליט'),
  trackPrime:      rtl('פריים'),
  trackFixed:      rtl('קבועה'),
  trackCpi:        rtl('מדד'),
  disclaimer1:     rtl('מסמך זה הינו הערכה בלבד ואינו מהווה הצעת הלוואה רשמית מבנק ישראל.'),
  disclaimer2:     rtl('אנא התייעץ עם יועץ משכנתאות מורשה לפני קבלת כל החלטה.'),
};

// Raw Hebrew strings for dynamic concatenation — reversed at render time
const HE_DYN = {
  mix:      'מיקס ',     // "מיקס " + N → rtl("מיקס 2")
  best:     ' מומלץ',    // appended to mix label
  yrs:      " שנ'",      // N + " שנ'" → rtl("25 שנ'")
  bestNote: 'בעל הריבית הכוללת הנמוכה ביותר',
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
  disclaimer:  '#6b7280',
};

// ── Low-level helpers ──────────────────────────────────────────────────────────

function fillRect(doc, x, y, w, h, color) {
  doc.save().rect(x, y, w, h).fill(color).restore();
}

function strokeRect(doc, x, y, w, h, color, lw = 0.5) {
  doc.save().strokeColor(color).lineWidth(lw).rect(x, y, w, h).stroke().restore();
}

function hLine(doc, x1, x2, y, color = C.border, lw = 0.5) {
  doc.save().strokeColor(color).lineWidth(lw).moveTo(x1, y).lineTo(x2, y).stroke().restore();
}

// Render text in a cell. isHe → use NotoSansHebrew font.
function cellText(doc, text, x, y, w, h, opts = {}) {
  const fs    = opts.fontSize || 8.5;
  const pad   = opts.padH || 8;
  const color = opts.color || C.textDark;
  const align = opts.align || 'left';
  const isHe  = opts.isHe || false;
  const bold  = opts.bold || false;
  const textY = y + Math.max(2, (h - fs * 1.15) / 2);

  const font = isHe
    ? (bold ? 'HeBold' : 'HeReg')
    : (bold ? 'Helvetica-Bold' : 'Helvetica');

  doc.save()
     .fillColor(color)
     .font(font)
     .fontSize(fs)
     .text(String(text), x + pad, textY, { width: w - pad * 2, align, lineBreak: false })
     .restore();
}

// ── Header banner ──────────────────────────────────────────────────────────────

function drawHeader(doc, L, date, isHe) {
  const W       = doc.page.width;
  const bannerH = 74;

  fillRect(doc, 0, 0, W, bannerH, C.primary);
  fillRect(doc, 0, bannerH - 4, W, 4, C.primaryDark);

  // Brand — always English
  doc.save().fillColor(C.white).font('Helvetica-Bold').fontSize(20)
     .text('GUIDED CLARITY', 0, 13, { width: W, align: 'center', lineBreak: false })
     .restore();

  // Subtitle (localised Hebrew or English)
  doc.save().fillColor('#cfe9e7')
     .font(isHe ? 'HeReg' : 'Helvetica').fontSize(10)
     .text(L.bannerSubtitle, 0, 37, { width: W, align: 'center', lineBreak: false })
     .restore();

  // Date — always English format to avoid bidi issues
  doc.save().fillColor('#a8d5d3').font('Helvetica').fontSize(8)
     .text('Generated: ' + date, 0, 55, { width: W, align: 'center', lineBreak: false })
     .restore();

  return bannerH + 4;
}

// ── Comparison / Analysis table ────────────────────────────────────────────────

function drawTable(doc, mixes, startY, L, isHe) {
  const ML    = 36;
  const W     = doc.page.width - ML * 2;
  const LBLW  = mixes.length === 1 ? 200 : 152;
  const mixW  = (W - LBLW) / mixes.length;
  const HDR_H = 28;
  const ROW_H = 19;

  const bestIdx = mixes.length > 1
    ? mixes.reduce((b, m, i) => (m.totalInterest < mixes[b].totalInterest ? i : b), 0)
    : 0;

  let y = startY;

  // ── Section heading ──────────────────────────────────────────────────────────
  const heading = mixes.length === 1 ? L.sectionHeading1 : L.sectionHeading;
  doc.save()
     .fillColor(C.textMed)
     .font(isHe ? 'HeBold' : 'Helvetica-Bold')
     .fontSize(9.5)
     .text(heading, ML, y, { width: W, align: isHe ? 'right' : 'left', lineBreak: false })
     .restore();
  hLine(doc, ML, ML + W, y + 13, C.primary, 1.5);
  y += 20;

  // ── Column headers ───────────────────────────────────────────────────────────

  fillRect(doc, ML, y, LBLW, HDR_H, C.primary);
  cellText(doc, L.routeCol, ML, y, LBLW, HDR_H, {
    bold: true, fontSize: 7.5, color: '#cfe9e7', align: 'center', isHe,
  });

  mixes.forEach((mix, i) => {
    const x      = ML + LBLW + i * mixW;
    const isBest = mixes.length > 1 && i === bestIdx;
    fillRect(doc, x, y, mixW, HDR_H, isBest ? C.primaryDark : C.primaryMid);

    // Build Hebrew column header correctly (construct raw, then reverse once)
    let colLabel;
    if (isHe) {
      colLabel = rtl(HE_DYN.mix + (i + 1) + (isBest ? HE_DYN.best : ''));
    } else {
      colLabel = 'MIX ' + (i + 1) + (isBest ? '  [BEST]' : '');
    }

    cellText(doc, colLabel, x, y, mixW, HDR_H, {
      bold: true, fontSize: 9.5, color: C.white, align: 'center', isHe,
    });
  });

  strokeRect(doc, ML, y, W, HDR_H, C.primaryDark, 1);
  y += HDR_H;

  // ── Data rows ────────────────────────────────────────────────────────────────

  const getMethod = m => {
    const map = { 'shpitzer': L.methodShpitzer, 'keren-shava': L.methodKerenShava, 'bullet': L.methodBullet };
    return map[m.repaymentMethod] || m.repaymentMethod;
  };
  const getTrack = m => {
    const map = { 'prime-linked': L.trackPrime, 'fixed': L.trackFixed, 'cpi-linked': L.trackCpi };
    return map[m.interestMethod] || m.interestMethod;
  };

  // For Hebrew, duration value must also be reversed (Hebrew suffix + number)
  const getDuration = m => isHe
    ? rtl(String(m.duration) + HE_DYN.yrs)
    : m.duration + ' yrs';

  const ROWS = [
    { label: L.repaymentMethod, fn: getMethod,                              textVal: true },
    { label: L.interestMethod,  fn: getTrack,                               textVal: true },
    { label: L.annualRate,      fn: m => _pct(m.annualRate),                textVal: false },
    null,
    { label: L.propertyPrice,   fn: m => _currency(m.propertyPrice),        textVal: false },
    { label: L.equity,          fn: m => _currency(m.equity),               textVal: false },
    { label: L.loanAmount,      fn: m => _currency(m.loan),                 textVal: false },
    { label: L.duration,        fn: getDuration,                            textVal: isHe },
    null,
    { label: L.monthlyPayment,  fn: m => _currency(m.firstMonthlyPayment),  textVal: false },
    { label: L.totalInterest,   fn: m => _currency(m.totalInterest),        textVal: false },
    { label: L.totalPayment,    fn: m => _currency(m.totalPayment),         textVal: false },
  ];

  let dataRowIdx = 0;
  ROWS.forEach(row => {
    if (row === null) {
      hLine(doc, ML, ML + W, y, C.primary, 0.7);
      y += 3;
      return;
    }

    const isResults = dataRowIdx >= 8;
    const rowBg     = dataRowIdx % 2 === 0 ? C.white : C.altRow;
    dataRowIdx++;

    // Label cell
    fillRect(doc, ML, y, LBLW, ROW_H, rowBg);
    cellText(doc, row.label, ML, y, LBLW, ROW_H, {
      bold:    isResults,
      fontSize: 8,
      color:   isResults ? C.textDark : C.textMed,
      align:   isHe ? 'right' : 'left',
      isHe,
    });

    // Value cells
    mixes.forEach((mix, i) => {
      const x      = ML + LBLW + i * mixW;
      const isBest = mixes.length > 1 && i === bestIdx;
      fillRect(doc, x, y, mixW, ROW_H, isBest ? C.primaryPale : rowBg);

      const val = row.fn(mix);
      cellText(doc, val, x, y, mixW, ROW_H, {
        bold:     isBest && isResults,
        fontSize: 8,
        color:    isBest ? C.bestText : C.textDark,
        align:    'right',
        padH:     9,
        // Use Hebrew font for text values (method/track names) and duration suffix
        // Use Helvetica for pure LTR currency/percentages — cleaner rendering
        isHe:     isHe && row.textVal,
      });
    });

    strokeRect(doc, ML, y, W, ROW_H, C.border, 0.35);
    y += ROW_H;
  });

  strokeRect(doc, ML, startY + 20, W, y - (startY + 20), C.primaryDark, 1);
  return y;
}

// ── Best-mix callout ───────────────────────────────────────────────────────────

function drawBestNote(doc, mixes, y, isHe) {
  if (mixes.length < 2) return y;

  const ML = 36;
  const W  = doc.page.width - ML * 2;

  const bestIdx = mixes.reduce((b, m, i) => (m.totalInterest < mixes[b].totalInterest ? i : b), 0);
  const best    = mixes[bestIdx];
  const worst   = mixes.reduce((w, m) => (m.totalInterest > w.totalInterest ? m : w), mixes[0]);
  const saved   = worst.totalInterest - best.totalInterest;

  const boxH = 28;
  y += 8;

  fillRect(doc, ML, y, W, boxH, C.primaryPale);
  strokeRect(doc, ML, y, W, boxH, C.bestBorder, 1);

  let note;
  if (isHe) {
    // Build the full Hebrew sentence, reverse as one unit for PDFKit LTR rendering.
    // Savings in LTR placed *before* the reversed Hebrew so it lands on the left
    // of the right-aligned callout — natural for a Hebrew reader scanning right-to-left.
    const hePart  = rtl(HE_DYN.mix + (bestIdx + 1) + ' — ' + HE_DYN.bestNote);
    const savePart = saved > 0 ? 'saves ' + _currency(saved) + '  |  ' : '';
    note = savePart + hePart;
  } else {
    const savings = saved > 0 ? '  --  saves ' + _currency(saved) + ' vs. most expensive option' : '';
    note = 'MIX ' + (bestIdx + 1) + ' has the lowest total interest' + savings;
  }

  doc.save()
     .fillColor(C.bestText)
     .font(isHe ? 'HeBold' : 'Helvetica-Bold')
     .fontSize(8.5)
     .text(note, ML + 10, y + (boxH - 8.5) / 2 - 1, {
       width: W - 20,
       align: isHe ? 'right' : 'left',
       lineBreak: false,
     })
     .restore();

  return y + boxH;
}

// ── Footer ─────────────────────────────────────────────────────────────────────
// footY + 32 must stay below the page content area.
// A4 height = 841.89pt, margin = 36pt → safe area ends at 805.89pt.
// footY = height - 92 → 749.89; brand at +32 = 781.89 ✓

function drawFooter(doc, L, isHe) {
  const W     = doc.page.width;
  const ML    = 36;
  const footY = doc.page.height - 92;

  hLine(doc, ML, W - ML, footY, C.primary, 1);

  doc.save().fillColor(C.disclaimer)
     .font(isHe ? 'HeReg' : 'Helvetica').fontSize(6.5)
     .text(L.disclaimer1, ML, footY + 8, { width: W - ML * 2, align: 'center', lineBreak: false })
     .restore();

  doc.save().fillColor(C.disclaimer)
     .font(isHe ? 'HeReg' : 'Helvetica').fontSize(6.5)
     .text(L.disclaimer2, ML, footY + 18, { width: W - ML * 2, align: 'center', lineBreak: false })
     .restore();

  doc.save().fillColor(C.textLight)
     .font('Helvetica').fontSize(6.5)
     .text('Guided Clarity  |  mortgage-comparison.pdf', ML, footY + 30,
           { width: W - ML * 2, align: 'center', lineBreak: false })
     .restore();
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function generatePdf(req, res, next) {
  try {
    let mixes, lang;
    try {
      mixes = req.body && Array.isArray(req.body.mixes) ? req.body.mixes : null;
      lang  = req.body?.lang === 'he' ? 'he' : 'en';
      if (!mixes) throw new Error('missing');
    } catch {
      return res.status(400).json({ error: 'Request body must include a "mixes" array.' });
    }

    if (mixes.length < 1 || mixes.length > 3) {
      return res.status(400).json({ error: 'Provide 1-3 mixes to generate a PDF.' });
    }

    const REQUIRED = ['repaymentMethod','interestMethod','annualRate','propertyPrice','equity','loan','duration','firstMonthlyPayment','totalInterest','totalPayment'];
    for (let i = 0; i < mixes.length; i++) {
      const missing = REQUIRED.filter(k => mixes[i][k] == null);
      if (missing.length) {
        return res.status(400).json({ error: `Mix ${i + 1} is missing fields: ${missing.join(', ')}` });
      }
    }

    const isHe = lang === 'he';
    const L    = isHe ? HE : EN;

    const doc = new PDFDocument({ size: 'A4', margin: 36, autoFirstPage: true });
    doc.registerFont('HeReg',  FONT_REG);
    doc.registerFont('HeBold', FONT_BOLD);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="mortgage-comparison.pdf"');
    doc.pipe(res);

    let y = drawHeader(doc, L, _genDate(), isHe);
    y += 14;
    y  = drawTable(doc, mixes, y, L, isHe);
    y  = drawBestNote(doc, mixes, y, isHe);
    drawFooter(doc, L, isHe);

    doc.end();
  } catch (err) {
    next(err);
  }
}
