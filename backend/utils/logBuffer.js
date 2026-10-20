import util from "util";

// Keeps the most recent console output in memory so admins can read backend logs
// from the admin panel. Cleared when the process restarts.
const MAX_LINES = 1000;
const MAX_LINE_LENGTH = 2000;
const lines = [];

const capture = (level, original) => (...args) => {
    try {
        const text = util.format(...args).slice(0, MAX_LINE_LENGTH);
        lines.push({ at: new Date().toISOString(), level, text });
        if (lines.length > MAX_LINES) lines.splice(0, lines.length - MAX_LINES);
    } catch {
        // Never let log capture break logging
    }
    original(...args);
};

let installed = false;

export const installLogBuffer = () => {
    if (installed) return;
    installed = true;
    console.log = capture("info", console.log.bind(console));
    console.info = capture("info", console.info.bind(console));
    console.warn = capture("warn", console.warn.bind(console));
    console.error = capture("error", console.error.bind(console));
};

/**
 * Most recent log lines, newest last.
 * @param {{ limit?: number, level?: "error" | "warn" }} [options]
 */
export const getRecentLogs = ({ limit = 300, level } = {}) => {
    const filtered = level === "error"
        ? lines.filter((l) => l.level === "error")
        : level === "warn"
            ? lines.filter((l) => l.level === "error" || l.level === "warn")
            : lines;
    return filtered.slice(-limit);
};
