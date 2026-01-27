import { Router } from 'express';
import { getStats, getWebhookLogs, getUsers, getSystemLogs } from '../controllers/adminController';
import { authenticate, authorize } from '../middlewares/authMiddleware';

const router = Router();

// All routes require authentication and ADMIN role
router.use(authenticate, authorize(['ADMIN']));

router.get('/stats', getStats);
router.get('/webhooks', getWebhookLogs);
router.get('/users', getUsers);
router.get('/logs', getSystemLogs);

export default router;
