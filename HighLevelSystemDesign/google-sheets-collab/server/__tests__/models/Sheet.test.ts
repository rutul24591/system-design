import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Sheet, { ISheet } from '../../src/models/Sheet';
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
	await Sheet.deleteMany({});
	await User.deleteMany({});
});

describe('Sheet Model Test', () => {
	it('should create & save sheet successfully', async () => {
		const user = new User({
			name: 'Test User',
			email: 'test@test.com',
			password: 'testpass123',
		});
		await user.save();

		const validSheet = new Sheet({
			name: 'Test Sheet',
			cells: [[{ value: '10' }, { value: '20', formula: '=A1*2' }]],
			owners: [user._id],
			editors: [],
			viewers: [],
		});

		const savedSheet = await validSheet.save();

		expect(savedSheet._id).toBeDefined();
		expect(savedSheet.name).toBe(validSheet.name);

		expect(savedSheet.cells[0][0].value).toBe('10');
		expect(savedSheet.cells[0][1].value).toBe('20');
		expect(savedSheet.cells[0][1].formula).toBe('=A1*2');

		expect(savedSheet.owners).toHaveLength(1);
		expect(savedSheet.owners[0].toString()).toBe(user._id?.toString());
	});

	it('should fail to save sheet without required title', async () => {
		const sheetWithoutTitle = new Sheet({
			cells: [[]],
			owners: [],
			editors: [],
			viewers: [],
		});

		let err;
		try {
			await sheetWithoutTitle.save();
		} catch (error) {
			err = error;
		}
		expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
	});

	it('should save sheet with empty cells map', async () => {
		const user = new User({
			name: 'Test User',
			email: 'test@test.com',
			password: 'testpass123',
		});
		await user.save();

		const sheetWithEmptyCells = new Sheet({
			name: 'Empty Sheet',
			owners: [user._id],
		});

		const savedSheet = await sheetWithEmptyCells.save();
		expect(savedSheet._id).toBeDefined();
		expect(savedSheet.cells[0]).toHaveLength(0);
	});

	it('should update cells map correctly', async () => {
		const sheet = new Sheet({
			name: 'Test Sheet',
			cells: [[{ value: '10' }]],
		});
		await sheet.save();

		// Update existing cell
		sheet.cells[0][0] = { value: '20' };
		// Add new cell
		sheet.cells[0][1] = { value: '30', formula: '=A1+10' };

		await sheet.save();

		const updatedSheet = await Sheet.findById(sheet._id);
		expect(updatedSheet).toBeDefined();

		expect(updatedSheet!.cells[0][0].value).toBe('20');
		expect(updatedSheet!.cells[0][1].value).toBe('30');
		expect(updatedSheet!.cells[0][1].formula).toBe('=A1+10');
	});

	it('should handle user permissions correctly', async () => {
		const owner = await new User({
			name: 'Owner',
			email: 'owner@test.com',
			password: 'pass123',
		}).save();

		const editor = await new User({
			name: 'Editor',
			email: 'editor@test.com',
			password: 'pass123',
		}).save();

		const viewer = await new User({
			name: 'Viewer',
			email: 'viewer@test.com',
			password: 'pass123',
		}).save();

		const sheet = new Sheet({
			name: 'Permissions Test Sheet',
			owners: [owner._id],
			editors: [editor._id],
			viewers: [viewer._id],
		});

		const savedSheet = await sheet.save();
		expect(savedSheet.owners).toHaveLength(1);
		expect(savedSheet.editors).toHaveLength(1);
		expect(savedSheet.viewers).toHaveLength(1);

		// Convert ObjectIds to strings for comparison
		const ownerId = owner._id?.toString() as string;
		const editorId = editor._id?.toString() as string;
		const viewerId = viewer._id?.toString() as string;

		expect(savedSheet.owners[0].toString()).toBe(ownerId);
		expect(savedSheet.editors[0].toString()).toBe(editorId);
		expect(savedSheet.viewers[0].toString()).toBe(viewerId);
	});
});
