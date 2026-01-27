import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/authRoutes';
import workflowRoutes from './routes/workflowRoutes';
import { AppError } from './utils/errors';
import { apiLimiter, authLimiter } from './middlewares/rateLimiter';

const app = express();

app.use(helmet()); // Security Headers
app.use(cors());
app.use(express.json());

import templateRoutes from './routes/templateRoutes';
import adminRoutes from './routes/adminRoutes';

// Routes
app.use('/api/auth', authLimiter, authRoutes); // Stricter limit for Auth
app.use('/api/workflows', apiLimiter, workflowRoutes);
app.use('/api/templates', apiLimiter, templateRoutes);
app.use('/api/admin', apiLimiter, adminRoutes);

// Health Check / Root Route
app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'Regula API is running' });
});

// Global Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err);

    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            success: false,
            error: err.message,
        });
        return; // ensure void return
    }

    res.status(500).json({
        success: false,
        error: 'Internal Server Error',
    });
});

export default app;
