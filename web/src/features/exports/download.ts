import { toCsv, type Dataset, type ExportData, type ExportFormat } from "./data";

function save(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export async function downloadExport(data: ExportData, dataset: Dataset, format: ExportFormat): Promise<void> {
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" })
    .formatToParts(new Date());
  const part = (type: Intl.DateTimeFormatPartTypes) => date.find((item) => item.type === type)?.value;
  const year = part("year");
  const month = part("month");
  const day = part("day");
  if (!year || !month || !day) throw new Error("Não foi possível gerar a data do arquivo.");
  const filename = `fleetmonitor-${dataset}-${year}-${month}-${day}`;
  if (format === "csv") {
    save(new Blob([toCsv(data)], { type: "text/csv;charset=utf-8" }), `${filename}.csv`);
    return;
  }
  if (format === "xlsx") {
    const ExcelJS = await import("exceljs");
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(data.title);
    sheet.addRow(data.columns);
    for (const row of data.rows) sheet.addRow(row);
    sheet.getRow(1).font = { bold: true };
    sheet.views = [{ state: "frozen", ySplit: 1 }];
    sheet.columns.forEach((column) => { column.width = 22; });
    const buffer = await workbook.xlsx.writeBuffer();
    save(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `${filename}.xlsx`);
    return;
  }
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const pdf = new jsPDF({ orientation: "landscape" });
  pdf.setFontSize(15);
  pdf.text(`FleetMonitor — ${data.title}`, 14, 16);
  autoTable(pdf, {
    startY: 23,
    head: [data.columns],
    body: data.rows.map((row) => row.map((cell) => cell === null ? "" : String(cell))),
    styles: { fontSize: 8, overflow: "linebreak" },
    headStyles: { fillColor: [39, 49, 39] },
  });
  pdf.save(`${filename}.pdf`);
}
