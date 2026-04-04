import express from 'express';
import { getDashboard, getSalesReport, exportPDF, exportXLS } from '../controllers/reports.controller.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.get('/dashboard', getDashboard);
router.get('/sales', getSalesReport);
router.get('/export/pdf', exportPDF);
router.get('/export/xls', exportXLS);

export default router;
