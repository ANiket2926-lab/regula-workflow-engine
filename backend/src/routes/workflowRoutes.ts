import { Router } from 'express';
import { WorkflowController } from '../controllers/workflowController';
import { authenticate, authorize } from '../middlewares/authMiddleware';

const router = Router();

// Everyone authenticated can list/create (creation restricted to REQUESTER in service)
router.post('/', authenticate, WorkflowController.create);
router.get('/', authenticate, WorkflowController.list);
router.get('/:id', authenticate, WorkflowController.getOne);

// Transitions
router.post('/:id/transition', authenticate, WorkflowController.transition);
router.get('/:id/logs', authenticate, WorkflowController.getLogs);

export default router;
