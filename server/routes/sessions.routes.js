import express from 'express';
import { getSessions, getCurrentSession, openSession, closeSession } from '../controllers/sessions.controller.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.get('/', getSessions);
router.get('/current', getCurrentSession);
router.post('/open', openSession);
router.patch('/:id/close', closeSession);

export default router;
