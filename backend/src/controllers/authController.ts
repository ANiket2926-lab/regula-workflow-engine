import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { SystemLogService } from '../services/systemLogService';

export class AuthController {
    static async register(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, password, role } = req.body;
            const user = await AuthService.register(email, password, role);
            res.status(201).json({ success: true, data: user });
        } catch (error) {
            next(error);
        }
    }

    static async login(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, password } = req.body;
            const result = await AuthService.login(email, password);

            await SystemLogService.log({
                eventType: 'LOGIN_SUCCESS',
                actorEmail: result.user.email,
                actorRole: result.user.role,
                status: 'SUCCESS',
                message: `User ${result.user.email} logged in successfully.`
            });

            res.status(200).json({ success: true, data: result });
        } catch (error: any) {
            await SystemLogService.log({
                eventType: 'LOGIN_FAILURE',
                actorEmail: req.body.email,
                actorRole: 'SYSTEM', // Unknown role at this point
                status: 'FAILURE',
                message: `Login failed for ${req.body.email}: ${error.message}`
            });
            next(error);
        }
    }
}
