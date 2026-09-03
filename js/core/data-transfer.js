import { all, put } from "./storage.js";
import { today, ukDate, ukDateTime, download, csvCell } from "./utils.js";

export const CSV_HEADERS = [
  "ID",
  "Form",
  "Status",
  "Inspection Date",
  "Submitted Date and Time",
  "Inspector",
  "Site",
  "Area",
  "Location reference",
  "Defect number",
  "Component",
  "Defect",
  "Risk",
  "Comments",
];

export async function exportBackup() {
  const records = await all();
  if (!records.length) return { exported: false, count: 0 };

  const payload = {
    version: 2,
    exported: ukDateTime(new Date()),
    records,
  };

  download(
    `qhse-backup-${today().replaceAll("/", "-")}.json`,
    JSON.stringify(payload, null, 2),
    "application/json",
  );

  return { exported: true, count: records.length };
}

export async function importBackup(file) {
  if (!file) return { imported: false, count: 0 };

  const parsed = JSON.parse(await file.text());
  const records = Array.isArray(parsed.records) ? parsed.records : [parsed];

  if (!records.length || records.some((record) => !record?.id || !record?.type)) {
    throw new Error("INVALID_BACKUP");
  }

  for (const record of records) await put(record);
  return { imported: true, count: records.length };
}

export async function exportCsv(getForm) {
  const records = await all();
  if (!records.length) return { exported: false, count: 0 };

  const rows = [CSV_HEADERS];

  records.forEach((record) => {
    const form = getForm(record.type);
    const detailRows = form?.toCsvRows?.(record) || [["", "", "", "", "", "", ""]];

    detailRows.forEach((details) => rows.push([
      record.id,
      record.title,
      record.status,
      ukDate(record.date),
      record.submittedAt || "",
      record.inspector || "",
      record.site || "EMG - Nestle",
      ...details,
    ]));
  });

  download(
    `qhse-summary-${today().replaceAll("/", "-")}.csv`,
    rows.map((row) => row.map(csvCell).join(",")).join("\r\n"),
    "text/csv",
  );

  return { exported: true, count: records.length };
}
