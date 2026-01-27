import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db';
import { UserPayload, Role } from '../types';
import { ConflictError, UnauthorizedError, ValidationError } from '../utils/errors';

const SECRET_KEY = process.env.JWT_SECRET || 'supersecretkey';

export class AuthService {
    static async register(email: string, password: string, role: Role) {
        // Validate inputs
        if (!email || !password || !role) {
            throw new ValidationError('Email, password, and role are required');
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            throw new ConflictError('User already exists');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                role,
            },
        });

        return { id: user.id, email: user.email, role: user.role };
    }

    static async login(email: string, password: string) {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            throw new UnauthorizedError('Invalid credentials');
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            throw new UnauthorizedError('Invalid credentials');
        }

        const payload: UserPayload = {
            id: user.id,
            email: user.email,
            role: user.role as Role,
        };

        const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '1d' });

        return { token, user: payload };
    }
}
