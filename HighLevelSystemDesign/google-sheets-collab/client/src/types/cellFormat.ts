export interface CellFormat {
	bold?: boolean;
	italic?: boolean;
	underline?: boolean;
	fontFamily?: string;
	fontSize?: number;
	color?: string;
	backgroundColor?: string;
	textAlign?: 'left' | 'center' | 'right';
	verticalAlign?: 'top' | 'middle' | 'bottom';
	numberFormat?: string;
	dateFormat?: string;
	borderTop?: string;
	borderRight?: string;
	borderBottom?: string;
	borderLeft?: string;
}
