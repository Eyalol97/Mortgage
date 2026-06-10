'use strict';

const mongoose = require('../db');

const interestRateSchema = new mongoose.Schema({
  track: {
    type: String,
    required: true,
    enum: ['prime-linked', 'fixed', 'cpi-linked'],
    unique: true,
  },
  rate: {
    type: Number,
    required: true,
    min: 0,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  source: {
    type: String,
    default: 'Bank of Israel',
  },
});

module.exports = mongoose.model('InterestRate', interestRateSchema);
