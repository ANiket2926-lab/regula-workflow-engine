import { Router } from 'express';
import { TemplateService } from '../services/templateService';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

// Create Template (Only Admin/Executor for now, or open for demo)
router.post('/', authenticate, async (req, res, next) => {
    try {
        const { name, steps } = req.body;
        // Basic validation
        if (!name || !steps || !Array.isArray(steps)) {
            res.status(400).json({ success: false, error: 'Invalid payload' });
            return;
        }
        const template = await TemplateService.createTemplate(name, steps);
        res.status(201).json({ success: true, data: template });
    } catch (error) {
        next(error);
    }
});

// List Templates
router.get('/', authenticate, async (req, res, next) => {
    try {
        const templates = await TemplateService.getTemplates();
        res.json({ success: true, data: templates });
    } catch (error) {
        next(error);
    }
});

export default router;
