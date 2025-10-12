import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User, { IUser } from '../../src/models/User';
import {
	beforeAll,
	afterAll,
	beforeEach,
	describe,
	it,
	expect,
} from '@jest/globals';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
	mongoServer = await MongoMemoryServer.create();
	const mongoUri = mongoServer.getUri();
	await mongoose.connect(mongoUri);
});

afterAll(async () => {
	await mongoose.disconnect();
	await mongoServer.stop();
});

beforeEach(async () => {
	await User.deleteMany({});
});

describe('User Model Test', () => {
	it('should create & save user successfully', async () => {
		const validUser = new User({
			name: 'Test User',
			email: 'test@test.com',
			password: 'testpass123',
		});
		const savedUser = await validUser.save();

		expect(savedUser._id).toBeDefined();
		expect(savedUser.name).toBe(validUser.name);
		expect(savedUser.email).toBe(validUser.email);
		// Password should be hashed
		expect(savedUser.password).not.toBe('testpass123');
	});

	it('should fail to save user without required fields', async () => {
		const userWithoutRequiredField = new User({ name: 'test' });
		let err;
		try {
			await userWithoutRequiredField.save();
		} catch (error) {
			err = error;
		}
		expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
	});

	it('should fail to save duplicate email', async () => {
		const firstUser = new User({
			name: 'User One',
			email: 'same@test.com',
			password: 'pass123',
		});
		await firstUser.save();

		const duplicateUser = new User({
			name: 'User Two',
			email: 'same@test.com',
			password: 'pass456',
		});

		let err: any;
		try {
			await duplicateUser.save();
		} catch (error) {
			err = error;
		}
		expect(err).toBeDefined();
		expect(err.code).toBe(11000); // MongoDB duplicate key error code
	});

	it('should correctly compare passwords', async () => {
		const user = new User({
			name: 'Test User',
			email: 'test@password.com',
			password: 'correctpass123',
		});
		await user.save();

		// Test with correct password
		const validPasswordCheck = await user.comparePassword('correctpass123');
		expect(validPasswordCheck).toBe(true);

		// Test with incorrect password
		const invalidPasswordCheck = await user.comparePassword('wrongpass123');
		expect(invalidPasswordCheck).toBe(false);
	});
});
