/**
 * Sheet Component - Main spreadsheet interface for the Google Sheets Clone
 *
 * This component handles:
 * 1. Grid rendering and management
 * 2. Real-time collaboration through WebSocket
 * 3. Formula evaluation
 * 4. Cell formatting
 * 5. Cursor tracking
 * 6. Offline support
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Socket, io } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import { FormulaEvaluator } from '../utils/FormulaEvaluator';
import { CursorPosition } from '../types/cursor';
import { FormattingToolbar } from './FormattingToolbar';
import { storePendingUpdate } from '../service-worker-registration';

import { CellFormat } from '../types/cellFormat';

/**
 * Represents a single cell in the spreadsheet
 * @property value - Raw input value entered by user
 * @property formula - Optional formula string (starts with =)
 * @property displayValue - Calculated value for formulas or formatted display value
 * @property format - Cell formatting options
 */
interface Cell {
	value: string;
	formula?: string;
	displayValue?: string;
	format?: CellFormat;
}

/**
 * Props for the Sheet component
 * Currently empty but can be extended for future functionality
 */
interface SheetProps {}

export const Sheet: React.FC<SheetProps> = () => {
	const [cells, setCells] = useState<Cell[][]>([]);
	const [socket, setSocket] = useState<Socket | null>(null);
	const [cursors, setCursors] = useState<{ [key: string]: CursorPosition }>({});
	const [activeCursor, setActiveCursor] = useState<CursorPosition | null>(null);
	const [selectedCell, setSelectedCell] = useState<{
		row: number;
		col: number;
	} | null>(null);
	const [selectedFormat, setSelectedFormat] = useState<CellFormat>({
		fontFamily: 'Arial',
		fontSize: 14,
		color: '#000000',
		backgroundColor: '#ffffff',
		textAlign: 'left',
		bold: false,
		italic: false,
		underline: false,
	});
	const { user } = useAuth();
	const sheetRef = useRef<HTMLDivElement>(null);

	/**
	 * Initialize the spreadsheet grid and set up WebSocket connection
	 * - Creates an empty grid with 100 rows and 26 columns (A-Z)
	 * - Establishes WebSocket connection for real-time collaboration
	 * - Sets up cursor tracking and synchronization
	 */
	useEffect(() => {
		const initializeGrid = () => {
			const rows = 100;
			const cols = 26; // A to Z
			const newGrid = Array(rows)
				.fill(null)
				.map(() =>
					Array(cols)
						.fill(null)
						.map(() => ({ value: '' })),
				);
			setCells(newGrid);
		};

		initializeGrid();

		// Connect to WebSocket with auth token
		const { token } = useAuth();
		const socket = io('http://localhost:3001', {
			auth: { token },
		});

		socket.on('cursor-update', (cursor: CursorPosition) => {
			setCursors((prev) => ({
				...prev,
				[cursor.userId]: cursor,
			}));
		});

		socket.on('cursor-leave', (userId: string) => {
			setCursors((prev) => {
				const newCursors = { ...prev };
				delete newCursors[userId];
				return newCursors;
			});
		});

		setSocket(socket);

		return () => {
			socket.emit('cursor-leave');
			socket.disconnect();
		};
	}, []);

	/**
	 * Evaluates all formulas in the grid
	 * - Checks each cell for formula (starting with =)
	 * - Uses FormulaEvaluator to calculate results
	 * - Updates displayValue for formula cells
	 * - Memoized with useCallback for performance
	 *
	 * @param grid - Current state of the spreadsheet
	 * @returns Updated grid with evaluated formulas
	 */
	const evaluateFormulas = useCallback((grid: Cell[][]): Cell[][] => {
		return grid.map((row) =>
			row.map((cell) => {
				if (cell.value?.startsWith('=')) {
					const result = FormulaEvaluator.evaluateFormula(cell.value, grid);
					return {
						...cell,
						formula: cell.value,
						displayValue: String(result),
					};
				}
				return {
					...cell,
					displayValue: cell.value,
				};
			}),
		);
	}, []);

	const getRandomColor = () => {
		const colors = [
			'#FF6B6B',
			'#4ECDC4',
			'#45B7D1',
			'#96CEB4',
			'#FFEEAD',
			'#D4A5A5',
			'#9B59B6',
			'#3498DB',
		];
		return colors[Math.floor(Math.random() * colors.length)];
	};

	const updateCursorPosition = (row: number, col: number) => {
		if (!user) return;

		const newCursor: CursorPosition = {
			row,
			col,
			userId: user._id,
			userName: user.name,
			color: activeCursor?.color || getRandomColor(),
		};

		setActiveCursor(newCursor);
		socket?.emit('cursor-update', newCursor);
	};

	/**
	 * Handles cell value changes with offline support
	 * - Updates cell value while preserving formatting
	 * - Re-evaluates all formulas in the grid
	 * - Attempts to sync with server via WebSocket
	 * - Falls back to offline storage if server sync fails
	 * - Updates cursor position after change
	 *
	 * @param row - Row index of changed cell
	 * @param col - Column index of changed cell
	 * @param value - New cell value
	 */
	const handleCellChange = async (row: number, col: number, value: string) => {
		const newCells = [...cells];
		const existingFormat = newCells[row][col]?.format;
		newCells[row][col] = { value, format: existingFormat };
		const evaluatedCells = evaluateFormulas(newCells);
		setCells(evaluatedCells);

		const update = { row, col, value, format: existingFormat };

		try {
			// Try to emit change to server
			socket?.emit('cell-update', update);
		} catch (error) {
			// If offline, store update for later sync
			try {
				await storePendingUpdate(update);
			} catch (error) {
				console.error('Failed to store offline update:', error);
			}
		}

		updateCursorPosition(row, col);
	};

	const handleCellSelect = (row: number, col: number) => {
		setSelectedCell({ row, col });
		const cellFormat = cells[row][col].format;
		if (cellFormat) {
			setSelectedFormat(cellFormat);
		} else {
			setSelectedFormat({
				fontFamily: 'Arial',
				fontSize: 14,
				color: '#000000',
				backgroundColor: '#ffffff',
				textAlign: 'left',
				bold: false,
				italic: false,
				underline: false,
			});
		}
	};

	const handleFormatChange = (format: CellFormat) => {
		if (!selectedCell) return;

		const { row, col } = selectedCell;
		const newCells = [...cells];
		newCells[row][col] = {
			...newCells[row][col],
			format,
		};
		setCells(newCells);
		setSelectedFormat(format);

		// Emit format change to server
		socket?.emit('cell-update', {
			row,
			col,
			value: newCells[row][col].value,
			format,
		});
	};

	// Column headers (A, B, C, etc.)
	const renderColumnHeaders = () => {
		return (
			<div className='row header'>
				<div className='cell corner'></div>
				{Array(26)
					.fill(null)
					.map((_, i) => (
						<div key={i} className='cell'>
							{String.fromCharCode(65 + i)}
						</div>
					))}
			</div>
		);
	};

	const renderCursor = (cursor: CursorPosition) => {
		if (!sheetRef.current) return null;

		const cellElements = sheetRef.current.getElementsByClassName('cell');
		const targetCell = cellElements[
			(cursor.row + 1) * 27 + cursor.col + 1
		] as HTMLElement;

		if (!targetCell) return null;

		const rect = targetCell.getBoundingClientRect();
		const sheetRect = sheetRef.current.getBoundingClientRect();

		return (
			<div
				key={cursor.userId}
				className='cursor-indicator'
				style={{
					position: 'absolute',
					left: rect.left - sheetRect.left,
					top: rect.top - sheetRect.top,
					width: '2px',
					height: rect.height,
					backgroundColor: cursor.color,
					zIndex: 100,
				}}
			>
				<div
					className='cursor-name'
					style={{
						position: 'absolute',
						top: '-20px',
						left: '0',
						backgroundColor: cursor.color,
						color: 'white',
						padding: '2px 6px',
						borderRadius: '3px',
						fontSize: '12px',
						whiteSpace: 'nowrap',
					}}
				>
					{cursor.userName}
				</div>
			</div>
		);
	};

	return (
		<div className='sheet-container'>
			<FormattingToolbar
				format={selectedFormat}
				onFormatChange={handleFormatChange}
			/>
			<div className='sheet' ref={sheetRef}>
				{renderColumnHeaders()}
				{cells.map((row, rowIndex) => (
					<div key={rowIndex} className='row'>
						<div className='cell row-header'>{rowIndex + 1}</div>
						{row.map((cell, colIndex) => (
							<input
								key={colIndex}
								className='cell'
								value={cell.value}
								onChange={(e) =>
									handleCellChange(rowIndex, colIndex, e.target.value)
								}
								data-display-value={cell.displayValue}
								onFocus={(e) => {
									e.target.value = cell.value;
									updateCursorPosition(rowIndex, colIndex);
									handleCellSelect(rowIndex, colIndex);
								}}
								onBlur={(e) => (e.target.value = cell.displayValue || '')}
								style={{
									...(cell.format && {
										fontFamily: cell.format.fontFamily,
										fontSize: `${cell.format.fontSize}px`,
										color: cell.format.color,
										backgroundColor: cell.format.backgroundColor,
										textAlign: cell.format.textAlign,
										fontWeight: cell.format.bold ? 'bold' : 'normal',
										fontStyle: cell.format.italic ? 'italic' : 'normal',
										textDecoration: cell.format.underline
											? 'underline'
											: 'none',
									}),
								}}
							/>
						))}
					</div>
				))}
				<div
					className='cursor-container'
					style={{
						position: 'absolute',
						top: 0,
						left: 0,
						pointerEvents: 'none',
					}}
				>
					{Object.values(cursors).map(
						(cursor) => cursor.userId !== user?._id && renderCursor(cursor),
					)}
					{activeCursor && renderCursor(activeCursor)}
				</div>
				<style>{`
        .sheet-container {
          display: flex;
          flex-direction: column;
          height: 100vh;
          width: 100%;
        }
        .sheet {
          flex: 1;
          overflow: auto;
          width: max-content;
          min-width: 100%;
        }
        .row {
          display: flex;
          border-bottom: 1px solid #ddd;
        }
        .header {
          position: sticky;
          top: 0;
          background: #f8f9fa;
          z-index: 1;
        }
        .cell {
          min-width: 146px;
          padding: 4px 8px;
          border-right: 1px solid #ddd!important;
          outline: none;
          width: max-content;
        }
        .corner, .row-header {
          background: #f8f9fa;
          min-width: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: sticky;
          left: 0;
          z-index: 2;
        }
        .corner {
          z-index: 3;
        }
        input.cell {
          border: none;
          font-size: 14px;
        }
        input.cell:focus {
          background: #e8f0fe;
        }
      `}</style>
			</div>
		</div>
	);
};
