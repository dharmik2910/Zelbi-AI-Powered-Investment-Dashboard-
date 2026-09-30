import { parseCsv } from "./csv";

// Header names used by the Zelbi template, Zerodha's tradebook and Groww's order history
const COLUMN_ALIASES = {
  symbol: ["symbol", "tradingsymbol", "ticker", "stock symbol", "scrip"],
  type: ["type", "trade_type", "trade type", "transaction type", "side", "buy/sell", "order type"],
  quantity: ["quantity", "qty", "shares", "units"],
  price: ["price", "trade price", "avg price", "average price", "rate", "execution price"],
  value: ["value", "amount", "trade value", "total value"],
  date: ["date", "trade_date", "trade date", "execution date and time", "order execution time", "order date"],
  exchange: ["exchange"],
  fees: ["fees", "charges", "brokerage", "total charges"],
  status: ["order status", "status"],
  notes: ["notes", "remarks"],
};

export const TEMPLATE_HEADER = ["symbol", "type", "quantity", "price", "date", "fees", "notes"];

export const TEMPLATE_EXAMPLE = [
  ["RELIANCE:NSE", "buy", "10", "2450.50", "2024-05-14", "20", "Long-term hold"],
  ["AAPL", "buy", "5", "189.20", "2024-06-03", "0", ""],
  ["RELIANCE:NSE", "sell", "4", "2890", "2025-06-20", "20", ""],
];

const normalize = (header) => header.trim().toLowerCase().replace(/\s+/g, " ");

const findColumns = (header) => {
  const normalized = header.map(normalize);
  const columns = {};
  for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
    const index = normalized.findIndex((name) => aliases.includes(name));
    if (index !== -1) columns[field] = index;
  }
  return columns;
};

const parseNumber = (value) => {
  if (value === undefined || value === null) return NaN;
  const cleaned = String(value).replace(/[₹$,\s]/g, "");
  return cleaned === "" ? NaN : Number(cleaned);
};

/**
 * Parses dates like 2024-05-14, 14-05-2024, 14/05/2024 or "14-05-2024 10:15 AM".
 * Day-first is assumed for dd-mm-yyyy, as Indian brokers use it.
 * @returns {string|null} yyyy-mm-dd
 */
const parseDate = (value) => {
  const text = String(value || "").trim();
  let match = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (match) {
    const [, y, m, d] = match;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  match = text.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (match) {
    const [, d, m, y] = match;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return null;
};

const parseType = (value) => {
  const text = String(value || "").trim().toLowerCase();
  if (["buy", "b", "purchase"].includes(text)) return "buy";
  if (["sell", "s", "sale"].includes(text)) return "sell";
  return null;
};

const SKIPPED_STATUSES = ["rejected", "cancelled", "canceled", "failed", "open", "pending"];

/**
 * Turns a broker or template CSV into trades for /api/portfolio/transactions/import.
 * @param {string} text - CSV file contents
 * @returns {{ trades: Array, errors: string[], skipped: number }}
 */
export const parseTradeCsv = (text) => {
  const rows = parseCsv(text);
  if (rows.length < 2) {
    return { trades: [], errors: ["The file has no data rows."], skipped: 0 };
  }

  const columns = findColumns(rows[0]);
  const missing = ["symbol", "type", "quantity", "date"].filter((field) => columns[field] === undefined);
  if (columns.price === undefined && columns.value === undefined) missing.push("price");
  if (missing.length) {
    return {
      trades: [],
      errors: [`Couldn't find these columns: ${missing.join(", ")}. Use the template or a Zerodha/Groww export.`],
      skipped: 0,
    };
  }

  const trades = [];
  const errors = [];
  let skipped = 0;

  rows.slice(1).forEach((row, index) => {
    const line = index + 2;
    const cell = (field) => (columns[field] === undefined ? undefined : row[columns[field]]);

    const status = String(cell("status") || "").trim().toLowerCase();
    if (SKIPPED_STATUSES.includes(status)) {
      skipped++;
      return;
    }

    let symbol = String(cell("symbol") || "").trim().toUpperCase();
    const exchange = String(cell("exchange") || "").trim().toUpperCase();
    if (symbol && !symbol.includes(":") && ["NSE", "BSE"].includes(exchange)) {
      symbol = `${symbol}:${exchange}`;
    }

    const type = parseType(cell("type"));
    const quantity = parseNumber(cell("quantity"));
    let price = parseNumber(cell("price"));
    if (!Number.isFinite(price)) price = parseNumber(cell("value")) / quantity;
    const date = parseDate(cell("date"));
    const fees = parseNumber(cell("fees"));

    const problems = [];
    if (!symbol) problems.push("missing symbol");
    if (!type) problems.push(`type "${cell("type")}" isn't buy or sell`);
    if (!(quantity > 0)) problems.push("invalid quantity");
    if (!(price >= 0)) problems.push("invalid price");
    if (!date) problems.push(`unreadable date "${cell("date")}"`);

    if (problems.length) {
      errors.push(`Line ${line}: ${problems.join(", ")}`);
      return;
    }

    trades.push({
      symbol,
      type,
      quantity,
      price: Number(price.toFixed(4)),
      date,
      fees: Number.isFinite(fees) ? fees : 0,
      notes: cell("notes") || undefined,
    });
  });

  return { trades, errors, skipped };
};
