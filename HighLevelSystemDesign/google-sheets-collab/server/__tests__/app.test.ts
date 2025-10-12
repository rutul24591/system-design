import request from 'supertest';
import { app } from '../src/app';
import { connect, disconnect } from '../src/config/database';
import User from '../src/models/User';
import Sheet from '../src/models/Sheet';
import jwt from 'jsonwebtoken';
import { beforeAll, afterAll, describe, it, expect } from '@jest/globals';

describe('Server API Tests', () => {
	let authToken: string;
	let userId: string;
	let sheetId: string;

	beforeAll(async () => {
		await connect();

		// Create test user
		const user = await User.create({
			name: 'Test User',
			email: 'test@example.com',
			password: 'password123',
		});
		userId = (user._id as any).toString();
		authToken = jwt.sign({ userId }, process.env.JWT_SECRET || 'secret');
	});

	afterAll(async () => {
		await User.deleteMany({});
		await Sheet.deleteMany({});
		await disconnect();
	});

	describe('Authentication', () => {
		it('should register a new user', async () => {
			const res = await request(app).post('/auth/register').send({
				name: 'New User',
				email: 'new@example.com',
				password: 'password123',
			});

			expect(res.status).toBe(201);
			expect(res.body).toHaveProperty('token');
		});

		it('should login existing user', async () => {
			const res = await request(app).post('/auth/login').send({
				email: 'test@example.com',
				password: 'password123',
			});

			expect(res.status).toBe(200);
			expect(res.body).toHaveProperty('token');
		});

		it('should reject invalid login', async () => {
			const res = await request(app).post('/auth/login').send({
				email: 'test@example.com',
				password: 'wrongpassword',
			});

			expect(res.status).toBe(401);
		});
	});

	describe('Sheet Operations', () => {
		it('should create a new sheet', async () => {
			const res = await request(app)
				.post('/api/sheets')
				.set('Authorization', `Bearer ${authToken}`)
				.send({
					name: 'Test Sheet',
				});

			expect(res.status).toBe(201);
			expect(res.body).toHaveProperty('_id');
			sheetId = res.body._id;
		});

		it('should get sheet details', async () => {
			const res = await request(app)
				.get(`/api/sheets/${sheetId}`)
				.set('Authorization', `Bearer ${authToken}`);

			expect(res.status).toBe(200);
			expect(res.body.name).toBe('Test Sheet');
		});

		it('should update cell value', async () => {
			const res = await request(app)
				.put(`/api/sheets/${sheetId}/cells/0/0`)
				.set('Authorization', `Bearer ${authToken}`)
				.send({
					value: 'New Value',
					format: {
						bold: true,
					},
				});

			expect(res.status).toBe(200);
			expect(res.body.cells[0][0].value).toBe('New Value');
			expect(res.body.cells[0][0].format.bold).toBe(true);
		});

		it('should handle formula evaluation', async () => {
			// Set values in cells A1 and B1
			await request(app)
				.put(`/api/sheets/${sheetId}/cells/0/0`)
				.set('Authorization', `Bearer ${authToken}`)
				.send({ value: '1' });

			await request(app)
				.put(`/api/sheets/${sheetId}/cells/0/1`)
				.set('Authorization', `Bearer ${authToken}`)
				.send({ value: '2' });

			// Set formula in C1
			const res = await request(app)
				.put(`/api/sheets/${sheetId}/cells/0/2`)
				.set('Authorization', `Bearer ${authToken}`)
				.send({ value: '=A1+B1', formula: '=A1+B1' });

			expect(res.status).toBe(200);
			expect(res.body.cells[0][2].displayValue).toBe('3');
		});

		it('should import sheet', async () => {
			const csvData = `1,2,3
4,5,6`;
			const res = await request(app)
				.post('/api/sheets/import')
				.set('Authorization', `Bearer ${authToken}`)
				.attach('file', Buffer.from(csvData), 'test.csv');

			expect(res.status).toBe(201);
			expect(res.body).toHaveProperty('_id');
			expect(res.body.cells[0][0].value).toBe('1');
		});

		it('should export sheet', async () => {
			const res = await request(app)
				.get(`/api/sheets/${sheetId}/export`)
				.set('Authorization', `Bearer ${authToken}`);

			expect(res.status).toBe(200);
			expect(res.header['content-type']).toBe('text/csv; charset=utf-8');
		});
	});
});
