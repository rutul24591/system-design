/**
 * Main application entry point for the Google Sheets Clone API server.
 * This file sets up the Express application with necessary middleware and routes.
 */

import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import authRoutes from './routes/auth';
import sheetRoutes from './routes/sheets';
import { authenticate } from './middleware/auth';

// Initialize Express application
const app = express();

// Configure middleware
// Enable CORS for cross-origin requests (needed for development and production)
app.use(cors());
// Parse incoming JSON payloads
app.use(bodyParser.json());

// Configure routes
// Authentication routes (/auth/login, /auth/register)
app.use('/auth', authRoutes);
// Protected sheet routes - requires authentication
app.use('/api/sheets', authenticate, sheetRoutes);

// Export the configured Express application
export { app };
