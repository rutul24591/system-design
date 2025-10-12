import mongoose, { Schema, Document } from 'mongoose';

interface ICell {
	value: string;
	formula?: string;
	displayValue?: string;
	format?: {
		bold?: boolean;
	};
}

export interface ISheet extends Document {
	name: string;
	cells: ICell[][]; // 2D array of cells
	owners: mongoose.Types.ObjectId[];
	editors: mongoose.Types.ObjectId[];
	viewers: mongoose.Types.ObjectId[];
	createdAt: Date;
	updatedAt: Date;
}

const SheetSchema: Schema = new Schema(
	{
		name: { type: String, required: true },
		cells: {
			type: [
				[
					{
						value: String,
						formula: String,
						displayValue: String,
						format: {
							bold: Boolean,
						},
					},
				],
			],
			default: [[]],
		},
		owners: [{ type: Schema.Types.ObjectId, ref: 'User' }],
		editors: [{ type: Schema.Types.ObjectId, ref: 'User' }],
		viewers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
	},
	{
		timestamps: true,
	},
);

export default mongoose.model<ISheet>('Sheet', SheetSchema);
