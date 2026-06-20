import { APP_NAME } from "@/lib/brand";
import type { ReportTaskRow, ReportUserRow } from "@/lib/reports";
import { formatCompletedDuration } from "@/lib/task-utils";
import { formatDateTime } from "@/lib/utils";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function escapeCsv(value: string | number | null | undefined): string {
  const str = value == null ? "" : String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

const TASK_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  paused: "Paused",
  completed: "Completed",
};

function formatTaskExportRow(row: ReportTaskRow): string[] {
  return [
    String(row.taskId),
    row.taskName,
    TASK_STATUS_LABELS[row.status] || row.status,
    row.assignedTo,
    formatDateTime(row.createdAt),
    row.startTime ? formatDateTime(row.startTime) : "",
    row.endTime ? formatDateTime(row.endTime) : "",
    formatCompletedDuration(row.durationSeconds),
    formatCompletedDuration(row.spanDurationSeconds),
    String(row.totalImages),
    row.editedImages != null ? String(row.editedImages) : "",
  ];
}

const TASK_HEADERS = [
  "Task ID",
  "Task Name",
  "Status",
  "Assigned To",
  "Created",
  "Start",
  "End",
  "Work",
  "Span",
  "Total Images",
  "Edited Images",
];

export function exportTasksCsv(rows: ReportTaskRow[], filenamePrefix = "tasks-report") {
  const lines = [
    TASK_HEADERS.join(","),
    ...rows.map((r) => formatTaskExportRow(r).map(escapeCsv).join(",")),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, `${filenamePrefix}-${new Date().toISOString().split("T")[0]}.csv`);
}

const USER_SUMMARY_HEADERS = [
  "User",
  "Completed",
  "In Progress",
  "Paused",
  "Pending",
  "Total Hours",
  "Images Edited",
];

function formatUserSummaryExportRow(row: ReportUserRow): string[] {
  return [
    row.userName,
    String(row.completed),
    String(row.inProgress),
    String(row.paused),
    String(row.pending),
    String(row.totalHours),
    String(row.imagesEdited),
  ];
}

function buildUserSummarySheetRows(rows: ReportUserRow[]) {
  return rows.map((r) => ({
    User: r.userName,
    Completed: r.completed,
    "In Progress": r.inProgress,
    Paused: r.paused,
    Pending: r.pending,
    "Total Hours": r.totalHours,
    "Images Edited": r.imagesEdited,
  }));
}

export interface FullReportExportOptions {
  periodLabel: string;
  summary: { label: string; value: string }[];
  taskRows: ReportTaskRow[];
  userRows: ReportUserRow[];
  filenamePrefix?: string;
}

export function exportFullReportCsv(options: FullReportExportOptions) {
  const lines = [
    "Full Report",
    `Period,${escapeCsv(options.periodLabel)}`,
    "",
    "Overview",
    "Metric,Value",
    ...options.summary.map((item) =>
      [escapeCsv(item.label), escapeCsv(item.value)].join(",")
    ),
    "",
    "User Summary",
    USER_SUMMARY_HEADERS.join(","),
    ...options.userRows.map((r) =>
      formatUserSummaryExportRow(r).map(escapeCsv).join(",")
    ),
    "",
    "Task Detail",
    TASK_HEADERS.join(","),
    ...options.taskRows.map((r) => formatTaskExportRow(r).map(escapeCsv).join(",")),
  ];

  const prefix = options.filenamePrefix ?? "full-report";
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, `${prefix}-${new Date().toISOString().split("T")[0]}.csv`);
}

export async function exportFullReportExcel(options: FullReportExportOptions) {
  const XLSX = await import("xlsx");
  const book = XLSX.utils.book_new();

  const overviewSheet = XLSX.utils.aoa_to_sheet([
    ["Full Report"],
    ["Period", options.periodLabel],
    [],
    ["Overview"],
    ["Metric", "Value"],
    ...options.summary.map((item) => [item.label, item.value]),
  ]);
  XLSX.utils.book_append_sheet(book, overviewSheet, "Overview");

  const usersSheet = XLSX.utils.json_to_sheet(buildUserSummarySheetRows(options.userRows));
  XLSX.utils.book_append_sheet(book, usersSheet, "User Summary");

  const tasksData = options.taskRows.map((r) => {
    const cols = formatTaskExportRow(r);
    return Object.fromEntries(TASK_HEADERS.map((h, i) => [h, cols[i]]));
  });
  const tasksSheet = XLSX.utils.json_to_sheet(tasksData);
  XLSX.utils.book_append_sheet(book, tasksSheet, "Task Detail");

  const prefix = options.filenamePrefix ?? "full-report";
  XLSX.writeFile(book, `${prefix}-${new Date().toISOString().split("T")[0]}.xlsx`);
}

export function exportUserSummaryCsv(rows: ReportUserRow[], filenamePrefix = "user-summary") {
  const lines = [
    USER_SUMMARY_HEADERS.join(","),
    ...rows.map((r) => formatUserSummaryExportRow(r).map(escapeCsv).join(",")),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, `${filenamePrefix}-${new Date().toISOString().split("T")[0]}.csv`);
}

export async function exportTasksExcel(rows: ReportTaskRow[], filenamePrefix = "tasks-report") {
  const XLSX = await import("xlsx");
  const data = rows.map((r) => {
    const cols = formatTaskExportRow(r);
    return Object.fromEntries(TASK_HEADERS.map((h, i) => [h, cols[i]]));
  });
  const sheet = XLSX.utils.json_to_sheet(data);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Tasks");
  XLSX.writeFile(book, `${filenamePrefix}-${new Date().toISOString().split("T")[0]}.xlsx`);
}

export async function exportUserSummaryExcel(
  rows: ReportUserRow[],
  filenamePrefix = "user-summary"
) {
  const XLSX = await import("xlsx");
  const data = buildUserSummarySheetRows(rows);
  const sheet = XLSX.utils.json_to_sheet(data);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Users");
  XLSX.writeFile(book, `${filenamePrefix}-${new Date().toISOString().split("T")[0]}.xlsx`);
}

export async function exportTasksPdf(options: {
  title: string;
  periodLabel: string;
  taskRows: ReportTaskRow[];
  filenamePrefix?: string;
}) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF({ orientation: "landscape" });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(APP_NAME, pageWidth - 14, 16, { align: "right" });
  doc.setTextColor(0);

  doc.setFontSize(16);
  doc.text(options.title, 14, 16);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(options.periodLabel, 14, 24);
  doc.setTextColor(0);

  autoTable(doc, {
    startY: 32,
    head: [["ID", "Name", "Status", "Assigned", "Work", "Span", "Images", "End"]],
    body: options.taskRows.map((r) => [
      r.taskId,
      r.taskName,
      TASK_STATUS_LABELS[r.status] || r.status,
      r.assignedTo,
      formatCompletedDuration(r.durationSeconds),
      formatCompletedDuration(r.spanDurationSeconds),
      r.editedImages != null ? `${r.editedImages}/${r.totalImages}` : String(r.totalImages),
      r.endTime ? formatDateTime(r.endTime) : "—",
    ]),
    styles: { fontSize: 7 },
    margin: { left: 14, right: 14 },
  });

  const prefix = options.filenamePrefix ?? "tasks-report";
  doc.save(`${prefix}-${new Date().toISOString().split("T")[0]}.pdf`);
}

export async function exportUserSummaryPdf(options: {
  title: string;
  periodLabel: string;
  userRows: ReportUserRow[];
  filenamePrefix?: string;
}) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF({ orientation: "landscape" });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(APP_NAME, pageWidth - 14, 16, { align: "right" });
  doc.setTextColor(0);

  doc.setFontSize(16);
  doc.text(options.title, 14, 16);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(options.periodLabel, 14, 24);
  doc.setTextColor(0);

  autoTable(doc, {
    startY: 32,
    head: [["User", "Completed", "In Progress", "Paused", "Pending", "Hours", "Images"]],
    body: options.userRows.map((r) => [
      r.userName,
      r.completed,
      r.inProgress,
      r.paused,
      r.pending,
      r.totalHours,
      r.imagesEdited,
    ]),
    styles: { fontSize: 8 },
    margin: { left: 14, right: 14 },
  });

  const prefix = options.filenamePrefix ?? "user-summary";
  doc.save(`${prefix}-${new Date().toISOString().split("T")[0]}.pdf`);
}

export async function exportReportPdf(options: {
  title: string;
  periodLabel: string;
  summary: { label: string; value: string }[];
  taskRows: ReportTaskRow[];
  userRows: ReportUserRow[];
}) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF({ orientation: "landscape" });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(APP_NAME, pageWidth - 14, 16, { align: "right" });
  doc.setTextColor(0);

  doc.setFontSize(16);
  doc.text(options.title, 14, 16);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(options.periodLabel, 14, 24);
  doc.setTextColor(0);

  let y = 32;
  doc.setFontSize(11);
  for (const item of options.summary) {
    doc.text(`${item.label}: ${item.value}`, 14, y);
    y += 6;
  }

  y += 4;
  doc.setFontSize(13);
  doc.text("User Summary", 14, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [["User", "Completed", "In Progress", "Paused", "Pending", "Hours", "Images"]],
    body: options.userRows.map((r) => [
      r.userName,
      r.completed,
      r.inProgress,
      r.paused,
      r.pending,
      r.totalHours,
      r.imagesEdited,
    ]),
    styles: { fontSize: 8 },
    margin: { left: 14, right: 14 },
  });

  const afterUsers = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  doc.setFontSize(13);
  doc.text("Task Detail", 14, afterUsers);

  autoTable(doc, {
    startY: afterUsers + 4,
    head: [["ID", "Name", "Status", "Assigned", "Work", "Span", "Images", "End"]],
    body: options.taskRows.map((r) => [
      r.taskId,
      r.taskName,
      TASK_STATUS_LABELS[r.status] || r.status,
      r.assignedTo,
      formatCompletedDuration(r.durationSeconds),
      formatCompletedDuration(r.spanDurationSeconds),
      r.editedImages != null ? `${r.editedImages}/${r.totalImages}` : String(r.totalImages),
      r.endTime ? formatDateTime(r.endTime) : "—",
    ]),
    styles: { fontSize: 7 },
    margin: { left: 14, right: 14 },
  });

  doc.save(`report-${new Date().toISOString().split("T")[0]}.pdf`);
}
