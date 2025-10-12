import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Sheet } from '../Sheet';
import { AuthContext } from '../../contexts/AuthContext';

// Mock the Socket.IO implementation
jest.mock('socket.io-client', () => ({
	io: () => ({
		on: jest.fn(),
		emit: jest.fn(),
		disconnect: jest.fn(),
	}),
}));

const mockUser = {
	_id: 'user123',
	name: 'Test User',
	email: 'test@example.com',
};

const mockAuthContext = {
	user: mockUser,
	token: 'mock-token',
	login: jest.fn(),
	logout: jest.fn(),
	register: jest.fn(),
};

describe('Sheet Component', () => {
	const renderSheet = () => {
		return render(
			<AuthContext.Provider value={mockAuthContext}>
				<Sheet />
			</AuthContext.Provider>,
		);
	};

	it('should render column headers A-Z', () => {
		renderSheet();
		const headers = screen.getAllByRole('cell');
		const columnHeaders = headers.slice(1, 27); // Skip corner cell
		expect(columnHeaders).toHaveLength(26);
		columnHeaders.forEach((header, index) => {
			expect(header).toHaveTextContent(String.fromCharCode(65 + index));
		});
	});

	it('should render row headers 1-100', () => {
		renderSheet();
		const rowHeaders = screen
			.getAllByRole('cell')
			.filter((cell) => cell.classList.contains('row-header'));
		expect(rowHeaders).toHaveLength(100);
		rowHeaders.forEach((header, index) => {
			expect(header).toHaveTextContent(String(index + 1));
		});
	});

	it('should update cell value on change', () => {
		renderSheet();
		const firstCell = screen.getAllByRole('textbox')[0];
		fireEvent.change(firstCell, { target: { value: 'New Value' } });
		expect(firstCell).toHaveValue('New Value');
	});

	it('should evaluate formula on cell change', () => {
		renderSheet();
		const cells = screen.getAllByRole('textbox');

		// Set values in cells A1 and B1
		fireEvent.change(cells[0], { target: { value: '1' } });
		fireEvent.change(cells[1], { target: { value: '2' } });

		// Set formula in C1
		const formulaCell = cells[2];
		fireEvent.change(formulaCell, { target: { value: '=A1+B1' } });

		// Check display value
		expect(formulaCell).toHaveAttribute('data-display-value', '3');
	});

	it('should update formatting when toolbar buttons are clicked', () => {
		renderSheet();
		const firstCell = screen.getAllByRole('textbox')[0];

		// Select cell
		fireEvent.focus(firstCell);

		// Click bold button
		const boldButton = screen.getByText('B');
		fireEvent.click(boldButton);

		// Check if cell style is updated
		expect(firstCell).toHaveStyle({ fontWeight: 'bold' });
	});

	it('should show cursor for active cell', () => {
		renderSheet();
		const firstCell = screen.getAllByRole('textbox')[0];

		// Focus the cell
		fireEvent.focus(firstCell);

		// Check if cursor is rendered
		const cursor = screen.getByText('Test User');
		expect(cursor).toBeInTheDocument();
	});
});
