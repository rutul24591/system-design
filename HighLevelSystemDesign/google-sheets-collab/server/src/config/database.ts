import mongoose from 'mongoose';

export const connect = async () => {
	try {
		await mongoose.connect(
			process.env.MONGODB_URI || 'mongodb://localhost:27017/google-sheets',
		);
		console.log('Connected to MongoDB');
	} catch (error) {
		console.error('MongoDB connection error:', error);
		process.exit(1);
	}
};

export const disconnect = async () => {
	try {
		await mongoose.disconnect();
		console.log('Disconnected from MongoDB');
	} catch (error) {
		console.error('MongoDB disconnection error:', error);
	}
};
