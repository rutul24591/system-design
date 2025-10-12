import express from 'express';
import multer, { Multer } from 'multer';
import { AuthRequest } from '../middleware/auth';
import Sheet from '../models/Sheet';
import { evaluateFormula } from '../utils/FormulaEvaluator';

// Extend AuthRequest to include multer file
interface FileAuthRequest extends AuthRequest {
	file?: Express.Multer.File;
}

const router = express.Router();
const upload: Multer = multer({ storage: multer.memoryStorage() });

// Create a new sheet
router.post('/', async (req: AuthRequest, res) => {
	try {
		const sheet = new Sheet({
			name: req.body.name,
			owners: [req.user?._id],
			cells: [[]],
		});
		await sheet.save();
		res.status(201).json(sheet);
	} catch (error) {
		const err = error as Error;
		res.status(400).json({ error: err.message });
	}
});

// Get sheet details
router.get('/:id', async (req: AuthRequest, res) => {
	try {
		const sheet = await Sheet.findById(req.params.id);
		if (!sheet) {
			return res.status(404).json({ error: 'Sheet not found' });
		}
		res.json(sheet);
	} catch (error) {
		const err = error as Error;
		res.status(400).json({ error: err.message });
	}
});

// Update cell value
router.put('/:id/cells/:row/:col', async (req: AuthRequest, res) => {
	try {
		const sheet = await Sheet.findById(req.params.id);
		if (!sheet) {
			return res.status(404).json({ error: 'Sheet not found' });
		}

		const row = parseInt(req.params.row);
		const col = parseInt(req.params.col);

		// Ensure arrays exist up to the required row/col
		while (sheet.cells.length <= row) {
			sheet.cells.push([]);
		}
		while (sheet.cells[row].length <= col) {
			sheet.cells[row].push({ value: '' });
		}

		const value = req.body.value;
		const formula = req.body.formula;
		const format = req.body.format;

		let displayValue;
		if (formula) {
			try {
				displayValue = evaluateFormula(sheet.cells, formula).toString();
			} catch (error) {
				console.error('Formula evaluation error:', error);
				displayValue = '#ERROR';
			}
		}

		sheet.cells[row][col] = {
			value,
			...(formula && { formula }),
			...(format && { format }),
			...(displayValue && { displayValue }),
		};

		await sheet.save();
		res.json(sheet);
	} catch (error) {
		const err = error as Error;
		res.status(400).json({ error: err.message });
	}
});

// Import sheet
router.post(
	'/import',
	upload.single('file'),
	async (req: FileAuthRequest, res) => {
		try {
			if (!req.file) {
				return res.status(400).json({ error: 'No file uploaded' });
			}

			const csvData = req.file.buffer.toString();
			const rows: string[][] = csvData
				.split('\\n')
				.map((row) => row.split(','));

			const sheet = new Sheet({
				name: req.body.name || 'Imported Sheet',
				owners: [req.user?._id],
				cells: [[]],
			});

			sheet.cells = rows
				.map((row) =>
					row.map((cellValue) => ({
						value: cellValue.trim(),
					})),
				)
				.filter((row) => row.length > 0); // Remove empty rows

			await sheet.save();
			res.status(201).json(sheet);
		} catch (error) {
			const err = error as Error;
			res.status(400).json({ error: err.message });
		}
	},
);

// Export sheet
router.get('/:id/export', async (req: AuthRequest, res) => {
	try {
		const sheet = await Sheet.findById(req.params.id);
		if (!sheet) {
			return res.status(404).json({ error: 'Sheet not found' });
		}

		// Convert cells to CSV format
		const csvRows = sheet.cells.map((row) =>
			row.map((cell) => cell?.value || '').join(','),
		);

		const csv = csvRows.join('\\n');
		res.header('Content-Type', 'text/csv');
		res.attachment(`${sheet.name}.csv`);
		res.send(csv);
	} catch (error) {
		const err = error as Error;
		res.status(400).json({ error: err.message });
	}
});

export default router;
