import prisma from './config/db';
import bcrypt from 'bcryptjs';

async function main() {
    const password = await bcrypt.hash('password123', 10);

    const users = [
        { email: 'requester@test.com', role: 'REQUESTER' },
        { email: 'reviewer@test.com', role: 'REVIEWER' },
        { email: 'executor@test.com', role: 'EXECUTOR' },
        { email: 'admin@test.com', role: 'ADMIN' },
    ];

    for (const u of users) {
        const exists = await prisma.user.findUnique({ where: { email: u.email } });
        if (!exists) {
            await prisma.user.create({
                data: {
                    email: u.email,
                    password,
                    role: u.role,
                },
            });
            console.log(`Created ${u.role}: ${u.email}`);
        } else {
            console.log(`User ${u.email} already exists.`);
        }
    }

    // Seed Template
    const templateName = 'Standard Two-Stage Approval';
    const templateExists = await prisma.workflowTemplate.findFirst({ where: { name: templateName } });
    if (!templateExists) {
        await prisma.workflowTemplate.create({
            data: {
                name: templateName,
                steps: JSON.stringify([
                    { name: 'Initial Review', role: 'REVIEWER' },
                    { name: 'Final Authorization', role: 'EXECUTOR' }
                ])
            }
        });
        console.log(`Created Template: ${templateName}`);
    } else {
        console.log(`Template ${templateName} already exists.`);
    }

    // Seed Emergency Template (Short SLA)
    const urgentTemplate = 'Emergency Fix (1h SLA)';
    if (!await prisma.workflowTemplate.findFirst({ where: { name: urgentTemplate } })) {
        await prisma.workflowTemplate.create({
            data: {
                name: urgentTemplate,
                steps: JSON.stringify([
                    { name: 'Rapid Review', role: 'REVIEWER', slaHours: 1 },
                    { name: 'Deployment', role: 'EXECUTOR', slaHours: 1 }
                ])
            }
        });
        console.log(`Created Template: ${urgentTemplate}`);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
