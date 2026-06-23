import express                    from 'express';
import { runSimulation, getRates } from './simulatorController.js';
import { generatePdf }            from './pdfManager.js';

const router = express.Router();

// POST /api/simulator — run a simulation and solve the missing field
router.post('/', runSimulation);

// GET /api/simulator/rates — return current market-average rates per track
router.get('/rates', getRates);

// GET /api/simulator/pdf — generate and download PDF summary
router.get('/pdf', generatePdf);

export default router;
