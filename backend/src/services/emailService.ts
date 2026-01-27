import nodemailer from 'nodemailer';

// Configure transporter using environment variables
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

interface EmailPayload {
    to: string;
    subject: string;
    text: string;
}

// Async, non-blocking email sender - failures are logged but don't throw
export async function sendEmail(payload: EmailPayload): Promise<void> {
    // Skip if SMTP is not configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log('[Email] SMTP not configured. Skipping email:', payload.subject);
        return;
    }

    try {
        await transporter.sendMail({
            from: process.env.SMTP_FROM || 'noreply@regula.app',
            to: payload.to,
            subject: payload.subject,
            text: payload.text,
        });
        console.log(`[Email] Sent to ${payload.to}: ${payload.subject}`);
    } catch (error) {
        // Log error but do NOT throw - email failure should never break workflow
        console.error('[Email] Failed to send:', error);
    }
}

// Email templates for workflow notifications
export function buildWorkflowEmail(
    action: string,
    workflowTitle: string,
    status: string,
    timestamp: Date
): string {
    return `
Workflow Notification
=====================

Action: ${action}
Workflow: ${workflowTitle}
Current Status: ${status}
Timestamp: ${timestamp.toISOString()}

This is an automated notification from the Regula Workflow System.
`.trim();
}
