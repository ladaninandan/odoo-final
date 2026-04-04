import express from 'express';
import { getSessions, getCurrentSession, openSession, closeSession } from '../controllers/sessions.controller.js';
import { protect } from '../middlewares/authMiddleware.js';
import { authorizeRoles } from '../middlewares/roleMiddleware.js';

const router = express.Router();
router.use(protect, authorizeRoles('admin', 'cashier'));

router.get('/', getSessions);
router.get('/current', getCurrentSession);
router.post('/open', openSession);
router.patch('/:id/close', closeSession);

export default router;
