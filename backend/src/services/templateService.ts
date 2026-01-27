import prisma from '../config/db';
import { Step } from '../types';

export class TemplateService {
    static async createTemplate(name: string, steps: Step[]) {
        return await prisma.workflowTemplate.create({
            data: {
                name,
                steps: JSON.stringify(steps),
            },
        });
    }

    static async getTemplates() {
        const templates = await prisma.workflowTemplate.findMany();
        return templates.map(t => ({
            ...t,
            steps: JSON.parse(t.steps),
        }));
    }

    static async getTemplateById(id: string) {
        const template = await prisma.workflowTemplate.findUnique({ where: { id } });
        if (!template) return null;
        return {
            ...template,
            steps: JSON.parse(template.steps) as Step[],
        };
    }
}
