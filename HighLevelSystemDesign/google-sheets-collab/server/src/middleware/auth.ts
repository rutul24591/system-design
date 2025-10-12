import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { IUser } from '../models/User';

export interface AuthRequest extends Request {
	user?: IUser;
}

export const authenticate = async (
	req: AuthRequest,
	res: Response,
	next: NextFunction,
) => {
	try {
		const token = req.header('Authorization')?.replace('Bearer ', '');

		if (!token) {
			throw new Error('No token provided');
		}

		const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as {
			userId: string;
		};
		req.user = { _id: decoded.userId } as IUser;

		next();
	} catch (error) {
		res.status(401).json({ error: 'Please authenticate' });
	}
};
