import React from 'react';
import { CellFormat } from '../types/cellFormat';

interface FormattingToolbarProps {
	format: CellFormat;
	onFormatChange: (format: CellFormat) => void;
}

const defaultFonts = [
	'Arial',
	'Times New Roman',
	'Helvetica',
	'Courier New',
	'Verdana',
];

const fontSizes = Array.from({ length: 16 }, (_, i) => i + 8); // 8 to 24

export const FormattingToolbar: React.FC<FormattingToolbarProps> = ({
	format,
	onFormatChange,
}) => {
	const toggleFormat = (key: keyof CellFormat) => {
		onFormatChange({
			...format,
			[key]: !format[key],
		});
	};

	const handleFontChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
		onFormatChange({
			...format,
			fontFamily: event.target.value,
		});
	};

	const handleFontSizeChange = (
		event: React.ChangeEvent<HTMLSelectElement>,
	) => {
		onFormatChange({
			...format,
			fontSize: parseInt(event.target.value),
		});
	};

	const handleAlignmentChange = (alignment: 'left' | 'center' | 'right') => {
		onFormatChange({
			...format,
			textAlign: alignment,
		});
	};

	return (
		<div className='formatting-toolbar'>
			<select
				value={format.fontFamily}
				onChange={handleFontChange}
				className='font-select'
			>
				{defaultFonts.map((font) => (
					<option key={font} value={font}>
						{font}
					</option>
				))}
			</select>

			<select
				value={format.fontSize}
				onChange={handleFontSizeChange}
				className='font-size-select'
			>
				{fontSizes.map((size) => (
					<option key={size} value={size}>
						{size}
					</option>
				))}
			</select>

			<button
				onClick={() => toggleFormat('bold')}
				className={`format-button ${format.bold ? 'active' : ''}`}
			>
				B
			</button>

			<button
				onClick={() => toggleFormat('italic')}
				className={`format-button ${format.italic ? 'active' : ''}`}
			>
				I
			</button>

			<button
				onClick={() => toggleFormat('underline')}
				className={`format-button ${format.underline ? 'active' : ''}`}
			>
				U
			</button>

			<div className='alignment-buttons'>
				<button
					onClick={() => handleAlignmentChange('left')}
					className={`format-button ${
						format.textAlign === 'left' ? 'active' : ''
					}`}
				>
					⫷
				</button>
				<button
					onClick={() => handleAlignmentChange('center')}
					className={`format-button ${
						format.textAlign === 'center' ? 'active' : ''
					}`}
				>
					⫶
				</button>
				<button
					onClick={() => handleAlignmentChange('right')}
					className={`format-button ${
						format.textAlign === 'right' ? 'active' : ''
					}`}
				>
					⫸
				</button>
			</div>

			<input
				type='color'
				value={format.color || '#000000'}
				onChange={(e) => onFormatChange({ ...format, color: e.target.value })}
				className='color-picker'
			/>

			<input
				type='color'
				value={format.backgroundColor || '#ffffff'}
				onChange={(e) =>
					onFormatChange({ ...format, backgroundColor: e.target.value })
				}
				className='color-picker'
			/>

			<style>{`
        .formatting-toolbar {
          display: flex;
          gap: 8px;
          padding: 8px;
          border-bottom: 1px solid #ddd;
          background: #f8f9fa;
        }

        .font-select,
        .font-size-select {
          padding: 4px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }

        .format-button {
          padding: 4px 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background: white;
          cursor: pointer;
        }

        .format-button.active {
          background: #e8f0fe;
          border-color: #1a73e8;
          color: #1a73e8;
        }

        .alignment-buttons {
          display: flex;
          gap: 4px;
        }

        .color-picker {
          width: 32px;
          height: 32px;
          padding: 0;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
      `}</style>
		</div>
	);
};
