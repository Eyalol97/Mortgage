'use strict';

const PDFDocument     = require('pdfkit');
const formatCurrency  = require('../../shared/formatCurrency');
const formatDecimal   = require('../../shared/formatDecimal');

// Maximum schedule rows printed per mix before the table is truncated.
// Keeps PDF size predictable regardless of loan duration.
const MAX_SCHEDULE_ROWS = 60;

const METHOD_LABELS = {
  shpitzer:     'Shpitzer (Fixed Payment)',
  'keren-shava': 'Equal Principal (Keren Shava)',
  bullet:       'Bullet (Interest Only)',
};

const TRACK_LABELS = {
  'prime-linked': 'Prime-Linked',
  fixed:          'Fixed',
  'cpi-linked':   'CPI-Linked',
};

// ── helpers ───────────────────────────────────────────────────────────────────

function drawHLine(doc) {
  doc.moveTo(doc.page.margins.left, doc.y)
     .lineTo(doc.page.width - doc.page.margins.right, doc.y)
     .stroke('#cccccc');
  doc.moveDown(0.3);
}

function sectionTitle(doc, text) {
  doc.moveDown(0.5)
     .fontSize(12)
     .fillColor('#1a3c5e')
     .font('Helvetica-Bold')
     .text(text);
  drawHLine(doc);
  doc.fontSize(9).fillColor('#333333').font('Helvetica');
}

function labelValue(doc, label, value, x, y) {
  doc.font('Helvetica-Bold').text(label + ':', x, y, { continued: true, width: 160 })
     .font('Helvetica').text('  ' + value);
}

function buildSummaryBlock(doc, mix, mixLabel) {
  sectionTitle(doc, mixLabel + ' — Summary');

  const left = doc.page.margins.left;
  const col2 = left + 230;
  const startY = doc.y;

  // Left column
  doc.text(''); // advance cursor
  labelValue(doc, 'Repayment Method', METHOD_LABELS[mix.repaymentMethod] || mix.repaymentMethod, left, startY);
  labelValue(doc, 'Interest Method',  TRACK_LABELS[mix.interestMethod]   || mix.interestMethod,  left, doc.y);
  labelValue(doc, 'Annual Rate',      formatDecimal(mix.annualRate) + '%',                        left, doc.y);
  labelValue(doc, 'Property Price',   formatCurrency(mix.propertyPrice),                         left, doc.y);
  labelValue(doc, 'Equity',           formatCurrency(mix.equity),                                left, doc.y);
  labelValue(doc, 'Loan Amount',      formatCurrency(mix.loan),                                  left, doc.y);
  labelValue(doc, 'Duration',         mix.duration + ' years',                                   left, doc.y);

  doc.moveDown(0.5);
  sectionTitle(doc, mixLabel + ' — Key Results');

  labelValue(doc, 'Monthly Payment',  formatCurrency(mix.firstMonthlyPayment), left, doc.y);
  labelValue(doc, 'Total Interest',   formatCurrency(mix.totalInterest),       left, doc.y);
  labelValue(doc, 'Total Payment',    formatCurrency(mix.totalPayment),        left, doc.y);
}

function buildScheduleTable(doc, mix, mixLabel) {
  sectionTitle(doc, mixLabel + ' — Amortization Schedule');

  const schedule = mix.schedule || [];
  const truncated = schedule.length > MAX_SCHEDULE_ROWS;
  const rows = truncated ? schedule.slice(0, MAX_SCHEDULE_ROWS) : schedule;

  const COL = {
    month:   doc.page.margins.left,
    payment: doc.page.margins.left + 60,
    principal: doc.page.margins.left + 160,
    interest:  doc.page.margins.left + 260,
    balance:   doc.page.margins.left + 360,
  };
  const W = 80;

  // Header
  doc.font('Helvetica-Bold').fontSize(8);
  doc.text('Month',     COL.month,     doc.y, { width: W, continued: true });
  doc.text('Payment',   COL.payment,   doc.y, { width: W, continued: true });
  doc.text('Principal', COL.principal, doc.y, { width: W, continued: true });
  doc.text('Interest',  COL.interest,  doc.y, { width: W, continued: true });
  doc.text('Balance',   COL.balance,   doc.y, { width: W });
  drawHLine(doc);

  // Rows
  doc.font('Helvetica').fontSize(8);
  rows.forEach(row => {
    const y = doc.y;
    doc.text(String(row.month),                COL.month,     y, { width: W, continued: true });
    doc.text(formatCurrency(row.payment),      COL.payment,   y, { width: W, continued: true });
    doc.text(formatCurrency(row.principal),    COL.principal, y, { width: W, continued: true });
    doc.text(formatCurrency(row.interest),     COL.interest,  y, { width: W, continued: true });
    doc.text(formatCurrency(row.remainingBalance), COL.balance, y, { width: W });
  });

  if (truncated) {
    doc.moveDown(0.4)
       .fontSize(8)
       .fillColor('#888888')
       .font('Helvetica-Oblique')
       .text(`(Table limited to ${MAX_SCHEDULE_ROWS} of ${schedule.length} months for PDF size.)`)
       .fillColor('#333333')
       .font('Helvetica');
  }
}

function buildComparisonTable(doc, mixes) {
  sectionTitle(doc, 'Mix Comparison');

  const left = doc.page.margins.left;
  const colW = 150;
  const headers = ['', ...mixes.map((_, i) => `Mix ${i + 1}`)];

  const rows = [
    ['Repayment Method', ...mixes.map(m => METHOD_LABELS[m.repaymentMethod] || m.repaymentMethod)],
    ['Annual Rate',      ...mixes.map(m => formatDecimal(m.annualRate) + '%')],
    ['Loan Amount',      ...mixes.map(m => formatCurrency(m.loan))],
    ['Duration',         ...mixes.map(m => m.duration + ' years')],
    ['Monthly Payment',  ...mixes.map(m => formatCurrency(m.firstMonthlyPayment))],
    ['Total Interest',   ...mixes.map(m => formatCurrency(m.totalInterest))],
    ['Total Payment',    ...mixes.map(m => formatCurrency(m.totalPayment))],
  ];

  // Identify the most cost-effective mix (lowest totalInterest)
  const bestIdx = mixes.reduce((best, m, i) =>
    m.totalInterest < mixes[best].totalInterest ? i : best, 0);

  // Header row
  doc.font('Helvetica-Bold').fontSize(9);
  headers.forEach((h, i) => {
    doc.text(h, left + i * colW, doc.y, { width: colW, continued: i < headers.length - 1 });
  });
  drawHLine(doc);

  // Data rows
  doc.font('Helvetica').fontSize(9);
  rows.forEach(row => {
    const y = doc.y;
    row.forEach((cell, i) => {
      const isBestCol = i > 0 && i - 1 === bestIdx;
      if (isBestCol) doc.fillColor('#1a7a3c').font('Helvetica-Bold');
      doc.text(cell, left + i * colW, y, { width: colW, continued: i < row.length - 1 });
      if (isBestCol) doc.fillColor('#333333').font('Helvetica');
    });
  });

  doc.moveDown(0.4)
     .fontSize(8)
     .fillColor('#1a7a3c')
     .text('* Green column = lowest total interest')
     .fillColor('#333333');
}

// ── Route handler ─────────────────────────────────────────────────────────────

async function generatePdf(req, res, next) {
  try {
    let mixes;
    try {
      mixes = JSON.parse(req.query.mixes);
    } catch {
      return res.status(400).json({ error: 'Invalid mixes query param — expected JSON array' });
    }

    if (!Array.isArray(mixes) || mixes.length === 0 || mixes.length > 3) {
      return res.status(400).json({ error: 'mixes must be an array of 1–3 mix objects' });
    }

    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="mortgage-simulation.pdf"');
    doc.pipe(res);

    // Title
    doc.fontSize(18)
       .fillColor('#1a3c5e')
       .font('Helvetica-Bold')
       .text('Mortgage Simulation Summary', { align: 'center' });

    doc.fontSize(8)
       .fillColor('#888888')
       .font('Helvetica')
       .text('This document is an estimate only and does not constitute an official bank offer.', { align: 'center' });

    doc.moveDown();

    // Per-mix summary + schedule
    mixes.forEach((mix, i) => {
      const label = `Mix ${i + 1}`;
      if (i > 0) doc.addPage();
      buildSummaryBlock(doc, mix, label);
      doc.moveDown(0.5);
      buildScheduleTable(doc, mix, label);
    });

    // Comparison table (only when more than one mix)
    if (mixes.length > 1) {
      doc.addPage();
      buildComparisonTable(doc, mixes);
    }

    doc.end();
  } catch (err) {
    next(err);
  }
}

module.exports = { generatePdf };
