import app from './app';
import dotenv from 'dotenv';
dotenv.config();

import { WorkflowService } from './services/workflowService';

const PORT = process.env.PORT || 3001;

// Background Worker for SLAs (Every 60 seconds)
setInterval(async () => {
    try {
        await WorkflowService.checkSLAs();
    } catch (err) {
        console.error('SLA Monitor Error:', err);
    }
}, 60000);

// Background Worker for Webhooks (Every 30 seconds)
import { WebhookService } from './services/webhookService';
setInterval(async () => {
    try {
        await WebhookService.processQueue();
    } catch (err) {
        console.error('Webhook Worker Error:', err);
    }
}, 30000);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
