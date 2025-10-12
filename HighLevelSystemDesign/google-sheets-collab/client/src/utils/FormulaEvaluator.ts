type CellReference = {
	col: number;
	row: number;
};

export class FormulaEvaluator {
	private static operations = {
		'+': (a: number, b: number) => a + b,
		'-': (a: number, b: number) => a - b,
		'*': (a: number, b: number) => a * b,
		'/': (a: number, b: number) => a / b,
	};

	private static functions = {
		SUM: (args: number[]) => args.reduce((acc, val) => acc + val, 0),
		AVERAGE: (args: number[]) =>
			args.reduce((acc, val) => acc + val, 0) / args.length,
		MAX: (args: number[]) => Math.max(...args),
		MIN: (args: number[]) => Math.min(...args),
	};

	static parseCellReference(ref: string): CellReference | null {
		const match = ref.match(/([A-Z])(\d+)/);
		if (!match) return null;

		const col = match[1].charCodeAt(0) - 65; // Convert A-Z to 0-25
		const row = parseInt(match[2]) - 1; // Convert 1-based to 0-based

		return { col, row };
	}

	static parseRangeReference(range: string): CellReference[] {
		const [start, end] = range.split(':');
		const startRef = this.parseCellReference(start);
		const endRef = this.parseCellReference(end);

		if (!startRef || !endRef) return [];

		const cells: CellReference[] = [];
		for (let row = startRef.row; row <= endRef.row; row++) {
			for (let col = startRef.col; col <= endRef.col; col++) {
				cells.push({ col, row });
			}
		}

		return cells;
	}

	static getCellValue(cellRef: CellReference, grid: any[][]): number {
		const value = grid[cellRef.row]?.[cellRef.col]?.value || '';
		return parseFloat(value) || 0;
	}

	static evaluateFormula(formula: string, grid: any[][]): string | number {
		try {
			if (!formula.startsWith('=')) return formula;

			const expression = formula.substring(1).trim();

			// Handle built-in functions
			const functionMatch = expression.match(/^([A-Z]+)\((.*)\)$/);
			if (functionMatch) {
				const [_, functionName, args] = functionMatch;
				const func =
					this.functions[functionName as keyof typeof this.functions];

				if (!func) throw new Error(`Unknown function: ${functionName}`);

				// Handle range references (e.g., "A1:A5")
				if (args.includes(':')) {
					const range = this.parseRangeReference(args);
					const values = range.map((ref) => this.getCellValue(ref, grid));
					return func(values);
				}

				// Handle comma-separated cell references or numbers
				const values = args.split(',').map((arg) => {
					const ref = this.parseCellReference(arg.trim());
					return ref
						? this.getCellValue(ref, grid)
						: parseFloat(arg.trim()) || 0;
				});

				return func(values);
			}

			// Handle basic arithmetic operations
			const tokens = expression.match(/([A-Z]\d+|\d+\.?\d*|[+\-*/()])/g) || [];
			const output: (string | number)[] = [];
			const operators: string[] = [];

			for (const token of tokens) {
				if (/^[A-Z]\d+$/.test(token)) {
					const ref = this.parseCellReference(token);
					if (ref) {
						output.push(this.getCellValue(ref, grid));
					}
				} else if (/^\d+\.?\d*$/.test(token)) {
					output.push(parseFloat(token));
				} else {
					while (
						operators.length > 0 &&
						this.getPrecedence(operators[operators.length - 1]) >=
							this.getPrecedence(token)
					) {
						output.push(operators.pop()!);
					}
					operators.push(token);
				}
			}

			while (operators.length > 0) {
				output.push(operators.pop()!);
			}

			return this.evaluatePostfix(output);
		} catch (error) {
			return '#ERROR!';
		}
	}

	private static getPrecedence(operator: string): number {
		switch (operator) {
			case '+':
			case '-':
				return 1;
			case '*':
			case '/':
				return 2;
			default:
				return 0;
		}
	}

	private static evaluatePostfix(tokens: (string | number)[]): number {
		const stack: number[] = [];

		for (const token of tokens) {
			if (typeof token === 'number') {
				stack.push(token);
			} else {
				const b = stack.pop() || 0;
				const a = stack.pop() || 0;
				const operation =
					this.operations[token as keyof typeof this.operations];
				if (operation) {
					stack.push(operation(a, b));
				}
			}
		}

		return stack[0] || 0;
	}
}
