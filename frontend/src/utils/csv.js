/**
 * Parses CSV text into an array of rows (arrays of strings).
 * Handles quoted fields, escaped quotes ("") and commas or newlines inside quotes.
 */
export const parseCsv = (text) => {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  const input = text.replace(/^﻿/, ""); // strip a byte order mark from Excel exports

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (inQuotes) {
      if (char === '"' && input[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && input[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
};

const escapeCell = (value) => {
  const text = value === null || value === undefined ? "" : String(value);
  // Prefix cells that spreadsheet apps would run as formulas
  const safe = /^[=+\-@\t\r]/.test(text) && !/^-?\d/.test(text) ? `'${text}` : text;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

/** Builds CSV text from a header row and data rows. */
export const toCsv = (header, rows) =>
  [header, ...rows].map((row) => row.map(escapeCell).join(",")).join("\r\n");

/** Starts a browser download of CSV text. */
export const downloadCsv = (filename, csvText) => {
  const blob = new Blob([csvText], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
