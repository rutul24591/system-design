import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser extends Document {
	email: string;
	password: string;
	name: string;
	comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema(
	{
		email: {
			type: String,
			required: true,
			unique: true,
			trim: true,
			lowercase: true,
		},
		password: {
			type: String,
			required: true,
		},
		name: {
			type: String,
			required: true,
		},
	},
	{
		timestamps: true,
	},
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
	if (!this.isModified('password')) return next();

	try {
		const salt = await bcrypt.genSalt(10);
		const document = this as any;
		document.password = await bcrypt.hash(document.password as string, salt);
		return next();
	} catch (error) {
		return next(error as Error);
	}
});

// Compare password method
UserSchema.methods.comparePassword = async function (
	candidatePassword: string,
): Promise<boolean> {
	try {
		return await bcrypt.compare(candidatePassword, this.password);
	} catch (error) {
		throw error;
	}
};

export default mongoose.model<IUser>('User', UserSchema);
