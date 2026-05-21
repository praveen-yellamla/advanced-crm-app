import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

/**
 * Generates a PDF file with a table
 * @param {string} title - Title of the PDF document
 * @param {Array<string>} headers - Array of column headers
 * @param {Array<Array<any>>} data - Array of row data (must match headers length)
 * @param {string} filename - Output filename (without extension)
 */
export const exportToPDF = (title, headers, data, filename) => {
  const doc = new jsPDF('p', 'pt', 'a4');

  // Title
  doc.setFontSize(18);
  doc.text(title, 40, 40);

  // Subtitle/Date
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated on: ${format(new Date(), 'PPpp')}`, 40, 60);

  // Table
  autoTable(doc, {
    head: [headers],
    body: data,
    startY: 80,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 4,
    },
    headStyles: {
      fillColor: [79, 70, 229], // Indigo 600
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // Slate 50
    },
    margin: { top: 80 },
  });

  doc.save(`${filename}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

/**
 * Generates a CSV file and triggers download
 * @param {Array<string>} headers - Array of column headers
 * @param {Array<Array<any>>} data - Array of row data
 * @param {string} filename - Output filename (without extension)
 */
export const exportToCSV = (headers, data, filename) => {
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      row.map(cell => {
        // Escape quotes and wrap in quotes if contains comma
        const cellString = String(cell ?? '');
        if (cellString.includes(',') || cellString.includes('"') || cellString.includes('\n')) {
          return `"${cellString.replace(/"/g, '""')}"`;
        }
        return cellString;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
