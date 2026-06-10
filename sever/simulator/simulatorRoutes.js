'use strict';

const express    = require('express');
const router     = express.Router();
const auth       = require('../../shared/auth');
const controller = require('./simulatorController');
const pdfManager = require('./pdfManager');

// All simulator routes require authentication
router.use(auth);

// POST /api/simulator — run a simulation and solve the missing field
router.post('/', controller.runSimulation);

// GET /api/simulator/rates — return current market-average rates per track
router.get('/rates', controller.getRates);

// GET /api/simulator/pdf — generate and download PDF summary
router.get('/pdf', pdfManager.generatePdf);

module.exports = router;
