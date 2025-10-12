import express from 'express';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import authRoutes from './routes/auth';
import Sheet from './models/Sheet';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
	cors: {
		origin: 'http://localhost:5173', // Vite default port
		methods: ['GET', 'POST'],
	},
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

// MongoDB connection
mongoose
	.connect(
		process.env.MONGODB_URI || 'mongodb://localhost:27017/google-sheets-collab',
	)
	.then(() => console.log('Connected to MongoDB'))
	.catch((err) => console.error('MongoDB connection error:', err));

// Socket.io middleware for authentication
io.use((socket, next) => {
	const token = socket.handshake.auth.token;
	if (!token) {
		return next(new Error('Authentication error'));
	}

	try {
		const decoded = jwt.verify(
			token,
			process.env.JWT_SECRET || 'your-secret-key',
		) as { userId: string };
		socket.data.userId = decoded.userId;
		next();
	} catch (err) {
		next(new Error('Authentication error'));
	}
});

// Socket.io handling
io.on('connection', (socket) => {
	console.log('User connected:', socket.id);

	socket.on('join-sheet', async (sheetId) => {
		try {
			const sheet = await Sheet.findById(sheetId);
			if (!sheet) {
				socket.emit('error', 'Sheet not found');
				return;
			}

			// Check if user has access to the sheet
			if (
				![...sheet.owners, ...sheet.editors, ...sheet.viewers].includes(
					socket.data.userId,
				)
			) {
				socket.emit('error', 'Access denied');
				return;
			}

			socket.join(sheetId);
			console.log(`User ${socket.id} joined sheet ${sheetId}`);
		} catch (error) {
			socket.emit('error', 'Error joining sheet');
		}
	});

	socket.on('cell-update', async ({ sheetId, row, col, value }) => {
		try {
			const sheet = await Sheet.findById(sheetId);
			if (!sheet) {
				socket.emit('error', 'Sheet not found');
				return;
			}

			// Check if user has edit access
			if (![...sheet.owners, ...sheet.editors].includes(socket.data.userId)) {
				socket.emit('error', 'Access denied');
				return;
			}

			// Update cell in database
			const cellKey = `${String.fromCharCode(65 + col)}${row + 1}`;
			if (!sheet.cells) {
				sheet.cells = new Map();
			}
			const isFormula = value.startsWith('=');
			const cellData = {
				value,
				...(isFormula && { formula: value }),
				displayValue: isFormula ? value : value, // Frontend will handle formula evaluation
			};
			sheet.cells.set(cellKey, cellData);
			await sheet.save();

			// Broadcast to other users
			socket.to(sheetId).emit('cell-updated', { row, col, value });
		} catch (error) {
			socket.emit('error', 'Error updating cell');
		}
	});

	socket.on('disconnect', () => {
		console.log('User disconnected:', socket.id);
	});
});

// Start server
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
