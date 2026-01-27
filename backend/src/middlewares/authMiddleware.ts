import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { UserPayload, Role } from '../types';

const SECRET_KEY = process.env.JWT_SECRET || 'supersecretkey';

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return next(new UnauthorizedError('No token provided'));
    }

    const token = authHeader.split(' ')[1];
    try {
        const payload = jwt.verify(token, SECRET_KEY) as UserPayload;
        req.user = payload;
        next();
    } catch (err) {
        next(new UnauthorizedError('Invalid token'));
    }
};

export const authorize = (roles: Role[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return next(new UnauthorizedError('Not authenticated'));
        }

        if (!roles.includes(req.user.role)) {
            return next(new ForbiddenError('Insufficient permissions'));
        }

        next();
    };
};
