import { Request, Response, NextFunction } from 'express';
import { WorkflowService } from '../services/workflowService';
import { SystemLogService } from '../services/systemLogService';

export class WorkflowController {
    static async create(req: Request, res: Response, next: NextFunction) {
        try {
            const user = req.user!;
            const { title, description, templateId, webhookUrl } = req.body;
            const workflow = await WorkflowService.createWorkflow(user, title, description, templateId, webhookUrl);
            res.status(201).json({ success: true, data: workflow });
        } catch (error) {
            next(error);
        }
    }

    static async list(req: Request, res: Response, next: NextFunction) {
        try {
            const user = req.user!;
            const workflows = await WorkflowService.getWorkflows(user);
            res.status(200).json({ success: true, data: workflows });
        } catch (error) {
            next(error);
        }
    }

    static async getOne(req: Request, res: Response, next: NextFunction) {
        try {
            const user = req.user!;
            const { id } = req.params;
            const workflow = await WorkflowService.getWorkflowById(id as string, user);
            res.status(200).json({ success: true, data: workflow });
        } catch (error) {
            next(error);
        }
    }

    static async transition(req: Request, res: Response, next: NextFunction) {
        try {
            const user = req.user!;
            const { id } = req.params;
            const { action, comment } = req.body; // SUBMIT, APPROVE, REJECT, EXECUTE
            const workflow = await WorkflowService.transitionWorkflow(id as string, user, action, comment);
            res.status(200).json({ success: true, data: workflow });
        } catch (error) {
            next(error);
        }
    }

    static async getLogs(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const logs = await SystemLogService.getWorkflowLogs(id as string);
            res.status(200).json({ success: true, data: logs });
        } catch (error) {
            next(error);
        }
    }
}
