import { FormulaEvaluator } from '../FormulaEvaluator';

describe('FormulaEvaluator', () => {
	const mockGrid = [
		[{ value: '1' }, { value: '2' }, { value: '3' }],
		[{ value: '4' }, { value: '5' }, { value: '6' }],
		[{ value: '7' }, { value: '8' }, { value: '9' }],
	];

	describe('basic arithmetic', () => {
		it('should evaluate addition', () => {
			expect(FormulaEvaluator.evaluateFormula('=1+2', mockGrid)).toBe(3);
		});

		it('should evaluate subtraction', () => {
			expect(FormulaEvaluator.evaluateFormula('=5-3', mockGrid)).toBe(2);
		});

		it('should evaluate multiplication', () => {
			expect(FormulaEvaluator.evaluateFormula('=4*2', mockGrid)).toBe(8);
		});

		it('should evaluate division', () => {
			expect(FormulaEvaluator.evaluateFormula('=10/2', mockGrid)).toBe(5);
		});
	});

	describe('cell references', () => {
		it('should evaluate single cell reference', () => {
			expect(FormulaEvaluator.evaluateFormula('=A1', mockGrid)).toBe(1);
		});

		it('should evaluate cell reference in arithmetic', () => {
			expect(FormulaEvaluator.evaluateFormula('=A1+B1', mockGrid)).toBe(3);
		});

		it('should handle complex formulas with cell references', () => {
			expect(FormulaEvaluator.evaluateFormula('=A1+B1*C1', mockGrid)).toBe(7); // 1 + (2 * 3)
		});
	});

	describe('functions', () => {
		it('should evaluate SUM function', () => {
			expect(FormulaEvaluator.evaluateFormula('=SUM(A1:C1)', mockGrid)).toBe(6);
		});

		it('should evaluate AVERAGE function', () => {
			expect(
				FormulaEvaluator.evaluateFormula('=AVERAGE(A1:C1)', mockGrid),
			).toBe(2);
		});

		it('should evaluate MAX function', () => {
			expect(FormulaEvaluator.evaluateFormula('=MAX(A1:C1)', mockGrid)).toBe(3);
		});

		it('should evaluate MIN function', () => {
			expect(FormulaEvaluator.evaluateFormula('=MIN(A1:C1)', mockGrid)).toBe(1);
		});
	});

	describe('error handling', () => {
		it('should handle division by zero', () => {
			expect(FormulaEvaluator.evaluateFormula('=1/0', mockGrid)).toBe(
				'#DIV/0!',
			);
		});

		it('should handle invalid cell references', () => {
			expect(FormulaEvaluator.evaluateFormula('=Z99', mockGrid)).toBe('#REF!');
		});

		it('should handle invalid formulas', () => {
			expect(FormulaEvaluator.evaluateFormula('=1++2', mockGrid)).toBe(
				'#ERROR!',
			);
		});
	});
});
