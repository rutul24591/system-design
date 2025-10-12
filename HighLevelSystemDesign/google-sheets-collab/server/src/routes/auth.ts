import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Register a new user
router.post('/register', async (req: Request, res: Response) => {
	try {
		const { email, password, name } = req.body;
		const existingUser = await User.findOne({ email });

		if (existingUser) {
			return res.status(400).json({ error: 'Email already exists' });
		}

		const user = new User({ email, password, name });
		await user.save();

		const token = jwt.sign(
			{ userId: user._id },
			process.env.JWT_SECRET || 'your-secret-key',
			{ expiresIn: '24h' },
		);

		res.status(201).json({ user, token });
	} catch (error) {
		res.status(400).json({ error: 'Error creating user' });
	}
});

// Login user
router.post('/login', async (req: Request, res: Response) => {
	try {
		const { email, password } = req.body;
		const user = await User.findOne({ email });

		if (!user) {
			return res.status(401).json({ error: 'Invalid login credentials' });
		}

		const isMatch = await user.comparePassword(password);
		if (!isMatch) {
			return res.status(401).json({ error: 'Invalid login credentials' });
		}

		const token = jwt.sign(
			{ userId: user._id },
			process.env.JWT_SECRET || 'your-secret-key',
			{ expiresIn: '24h' },
		);

		res.json({ user, token });
	} catch (error) {
		res.status(400).json({ error: 'Error logging in' });
	}
});

// Get current user
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
	try {
		const user = await User.findById(req.user?._id);
		if (!user) {
			return res.status(404).json({ error: 'User not found' });
		}
		res.json(user);
	} catch (error) {
		res.status(500).json({ error: 'Error fetching user' });
	}
});

export default router;
