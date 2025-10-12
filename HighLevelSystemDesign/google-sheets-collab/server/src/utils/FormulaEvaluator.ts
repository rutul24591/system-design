/**
 * Formula Evaluator Module
 *
 * This module handles the evaluation of spreadsheet formulas, including:
 * 1. Cell reference resolution (e.g., A1, B2)
 * 2. Basic arithmetic operations
 * 3. Nested formula evaluation
 * 4. Error handling for invalid formulas
 */

/**
 * Interface representing a cell in the spreadsheet
 * @property value - Raw input value
 * @property formula - Optional formula starting with =
 * @property displayValue - Calculated or formatted value
 * @property format - Cell formatting options
 */
interface ICell {
	value: string;
	formula?: string;
	displayValue?: string;
	format?: {
		bold?: boolean;
	};
}

/**
 * Converts a cell reference (e.g., 'A1') to row and column indices
 * @example
 * cellRefToIndices('A1') // returns [0, 0]
 * cellRefToIndices('B2') // returns [1, 1]
 */
export const cellRefToIndices = (cellRef: string): [number, number] => {
	const matches = cellRef.match(/([A-Z]+)(\d+)/);
	if (!matches) {
		throw new Error('Invalid cell reference format');
	}
	const col =
		matches[1]
			.split('')
			.reduce((acc, char) => acc * 26 + char.charCodeAt(0) - 64, 0) - 1;
	const row = parseInt(matches[2]) - 1;
	return [row, col];
};

/**
 * Retrieves the numeric value of a cell using its reference
 *
 * Handles:
 * - Empty or non-existent cells (returns 0)
 * - Formula cells (recursively evaluates)
 * - Numeric conversion of cell values
 *
 * @param cells - The spreadsheet grid
 * @param cellRef - Cell reference (e.g., 'A1')
 * @returns Numeric value of the cell
 */
export const getCellValue = (cells: ICell[][], cellRef: string): number => {
	const [row, col] = cellRefToIndices(cellRef);
	if (!cells[row] || !cells[row][col]) {
		return 0;
	}
	const cell = cells[row][col];
	if (!cell.value) {
		return 0;
	}
	if (cell.formula) {
		return Number(evaluateFormula(cells, cell.formula)) || 0;
	}
	return Number(cell.value) || 0;
};

/**
 * Evaluates a formula string in the context of the current sheet
 *
 * Features:
 * - Handles formulas starting with '='
 * - Resolves cell references to their values
 * - Supports basic arithmetic operations
 * - Safe evaluation with error handling
 *
 * @example
 * evaluateFormula(cells, '=A1+B1')  // Adds values in A1 and B1
 * evaluateFormula(cells, '=5*C1')   // Multiplies 5 with value in C1
 *
 * @param cells - The spreadsheet grid
 * @param formula - Formula string to evaluate
 * @returns Calculated numeric result
 */
export const evaluateFormula = (cells: ICell[][], formula: string): number => {
	if (!formula.startsWith('=')) {
		return Number(formula) || 0;
	}

	const expression = formula
		.substring(1)
		.replace(/[A-Z]\d+/g, (cellRef) => getCellValue(cells, cellRef).toString());

	try {
		// eslint-disable-next-line no-eval
		return eval(expression);
	} catch (error) {
		console.error('Formula evaluation error:', error);
		return 0;
	}
};
