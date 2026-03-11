import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { RowInput } from "jspdf-autotable";

export type PdfColumn = {
  header: string;
  accessor: string;
};

export type PdfTotalsSummary = Record<string, string | number>;

export type PdfExportOptions = {
  title: string;
  fileName: string;
  columns: PdfColumn[];
  rows: Array<Record<string, unknown>>;
  filterSummary?: string;
  totalsSummary?: PdfTotalsSummary;
};

/** Shared helper to export a simple tabular report using jsPDF + autoTable. */
export function exportTableToPdf({
  title,
  fileName,
  columns,
  rows,
  filterSummary,
  totalsSummary,
}: PdfExportOptions) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
  });

  const marginLeft = 40;
  let cursorY = 40;

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(title, marginLeft, cursorY);
  cursorY += 18;

  // Export meta: date/time
  const exportedAt = new Date().toLocaleString();
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.text(`Exported: ${exportedAt}`, marginLeft, cursorY);
  cursorY += 14;

  // Filter summary (single line, preformatted text)
  if (filterSummary) {
    doc.text(filterSummary, marginLeft, cursorY);
    cursorY += 16;
  }

  // Totals summary block (key: value per line)
  if (totalsSummary && Object.keys(totalsSummary).length > 0) {
    const entries = Object.entries(totalsSummary);
    const labelWidth = 80;
    entries.forEach(([key, value]) => {
      doc.setFont("helvetica", "bold");
      doc.text(`${key}:`, marginLeft, cursorY);
      doc.setFont("helvetica", "normal");
      doc.text(String(value), marginLeft + labelWidth, cursorY);
      cursorY += 14;
    });
    cursorY += 6;
  }

  // Table
  const head = [columns.map((c) => c.header)];
  const body: RowInput[] = rows.map((row) =>
    columns.map((c) => {
      const raw = row[c.accessor];
      if (raw === null || raw === undefined) return "";
      if (typeof raw === "string" || typeof raw === "number") return String(raw);
      if (raw instanceof Date) return raw.toLocaleString();
      return String(raw);
    })
  );

  autoTable(doc, {
    startY: cursorY,
    head,
    body,
    styles: {
      fontSize: 9,
      cellPadding: 6,
    },
    headStyles: {
      fillColor: [45, 55, 72],
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    margin: { left: marginLeft, right: 40 },
  });

  doc.save(fileName);
}