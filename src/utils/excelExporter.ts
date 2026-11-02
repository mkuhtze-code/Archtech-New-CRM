import { SpreadsheetRow, SpreadsheetSection } from '../types/crm';

/**
 * Evaluates simple Excel-like mathematical formulas like:
 * "=180 * 34.50"
 * "=285 * 1.10"
 * "=50 * 28.5 + 450"
 */
export function evaluateFormula(formula: string, fallback: number = 0): number {
  if (!formula || typeof formula !== 'string') return fallback;
  const cleaned = formula.startsWith('=') ? formula.slice(1).trim() : formula.trim();
  if (!cleaned) return fallback;

  // If it's just a number
  const num = Number(cleaned);
  if (!isNaN(num)) return num;

  try {
    // Only allow safe arithmetic characters: digits, decimal point, parentheses, +, -, *, /, %, spaces
    if (!/^[0-9+\-*/().\s%]+$/.test(cleaned)) {
      return fallback;
    }
    // Handle percentage like "10%" -> "0.10"
    const sanitized = cleaned.replace(/([0-9.]+)%/g, '($1/100)');
    // Safe evaluation using Function
    const result = new Function(`return (${sanitized});`)();
    return typeof result === 'number' && !isNaN(result) && isFinite(result) ? Math.round(result * 100) / 100 : fallback;
  } catch (err) {
    return fallback;
  }
}

/**
 * Exports spreadsheet sections and rows into a clean, downloadable CSV
 * formatted with headers, section separators, and formatted currency.
 */
export function exportToCSV(
  quoteNumber: string,
  clientName: string,
  sections: SpreadsheetSection[],
  rows: SpreadsheetRow[],
  subtotal: number,
  gst: number,
  total: number
): void {
  const lines: string[] = [];

  // Quote Metadata Header
  lines.push(`ARCHTECH ARCHITECTURAL ROOFING - QUOTE ESTIMATE`);
  lines.push(`Quote Number,${quoteNumber}`);
  lines.push(`Client,${clientName}`);
  lines.push(`Export Date,${new Date().toLocaleDateString('en-NZ')} ${new Date().toLocaleTimeString('en-NZ')}`);
  lines.push(``);

  // Column Headers
  lines.push(`Section,Code,Description,Category,Quantity,Unit,Wastage %,Unit Cost (NZD),Markup %,Sell Rate (NZD),Line Total (NZD),Formula / Calculation Notes,Supplier`);

  sections.forEach(section => {
    const sectionRows = rows.filter(r => r.sectionId === section.id);
    if (sectionRows.length === 0) return;

    // Section title divider
    lines.push(`[${section.title}],,,,,,,,,,,`);

    sectionRows.forEach(row => {
      const escapedDesc = `"${row.description.replace(/"/g, '""')}"`;
      const escapedNotes = `"${(row.formula || row.notes || '').replace(/"/g, '""')}"`;
      const line = [
        `"${section.title}"`,
        row.itemCode || '',
        escapedDesc,
        row.category || '',
        row.quantity,
        row.unit,
        `${row.wastagePercent || 0}%`,
        `$${(row.unitCostNZD || 0).toFixed(2)}`,
        `${row.markupPercent || 0}%`,
        `$${(row.unitSellNZD || 0).toFixed(2)}`,
        `$${(row.totalNZD || 0).toFixed(2)}`,
        escapedNotes,
        `"${row.supplier || 'The Roofing Store'}"`
      ].join(',');
      lines.push(line);
    });

    const sectionTotal = sectionRows.reduce((sum, r) => sum + r.totalNZD, 0);
    lines.push(`,,,,"Subtotal [${section.title}]",,,,,,,"$${sectionTotal.toFixed(2)}",,`);
    lines.push(``);
  });

  // Summary footer
  lines.push(`,,,,"TOTAL EXCL. GST",,,,,,"$${subtotal.toFixed(2)}"`);
  lines.push(`,,,,"GST (15%)",,,,,,"$${gst.toFixed(2)}"`);
  lines.push(`,,,,"TOTAL INCL. GST (NZD)",,,,,,"$${total.toFixed(2)}"`);

  const csvContent = '\uFEFF' + lines.join('\n'); // Add UTF-8 BOM for Microsoft Excel
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${quoteNumber}_Archtech_Takeoff_Matrix.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Copies the spreadsheet matrix to clipboard as tab-separated values (TSV)
 * which instantly pastes into Excel or Google Sheets across multiple columns.
 */
export async function copyTableForExcel(
  sections: SpreadsheetSection[],
  rows: SpreadsheetRow[]
): Promise<boolean> {
  try {
    const lines: string[] = [];
    lines.push(['Section', 'Code', 'Description', 'Category', 'Quantity', 'Unit', 'Wastage %', 'Unit Cost', 'Markup %', 'Sell Rate', 'Total', 'Notes'].join('\t'));

    sections.forEach(sec => {
      const secRows = rows.filter(r => r.sectionId === sec.id);
      secRows.forEach(r => {
        lines.push([
          sec.title,
          r.itemCode || '',
          r.description,
          r.category,
          r.quantity,
          r.unit,
          `${r.wastagePercent}%`,
          r.unitCostNZD,
          `${r.markupPercent}%`,
          r.unitSellNZD,
          r.totalNZD,
          r.formula || r.notes || ''
        ].join('\t'));
      });
    });

    await navigator.clipboard.writeText(lines.join('\n'));
    return true;
  } catch (err) {
    return false;
  }
}
