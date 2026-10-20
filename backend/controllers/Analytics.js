import jwt from "jsonwebtoken";
import PageView from "../models/PageView.js";

// Paths whose last part is a secret (reset links) or an id, replaced before saving
const MASKED_PATHS = [
    [/^\/update-password\/[^/]+$/, "/update-password/:token"],
];

const SESSION_PATTERN = /^[a-zA-Z0-9-]{8,64}$/;

const normalizePath = (raw) => {
    let path = String(raw || "").split(/[?#]/)[0].slice(0, 200);
    if (!path.startsWith("/")) return null;
    path = path.replace(/\/+$/, "") || "/";
    for (const [pattern, replacement] of MASKED_PATHS) {
        if (pattern.test(path)) return replacement;
    }
    return path;
};

const referrerDomain = (raw) => {
    try {
        const host = new URL(raw).hostname.replace(/^www\./, "");
        return host.slice(0, 100) || undefined;
    } catch {
        return undefined;
    }
};

const deviceType = (userAgent = "") => {
    if (/ipad|tablet/i.test(userAgent)) return "tablet";
    if (/mobi|android|iphone/i.test(userAgent)) return "mobile";
    return "desktop";
};

// Signed-in users are attached when a valid token is sent; anonymous visits are fine too
const optionalUserId = (req) => {
    const header = req.header("Authorization");
    const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return undefined;
    try {
        return jwt.verify(token, process.env.JWT_SECRET).id;
    } catch {
        return undefined;
    }
};

export const trackPageView = async (req, res) => {
    try {
        const path = normalizePath(req.body?.path);
        if (!path) {
            return res.status(400).json({ success: false });
        }

        const sessionId = SESSION_PATTERN.test(req.body?.sessionId || "") ? req.body.sessionId : undefined;

        // Ignore the same page reported twice in a row by one session (refreshes, double renders)
        if (sessionId) {
            const last = await PageView.findOne({ sessionId }).sort({ createdAt: -1 }).select("path createdAt").lean();
            if (last && last.path === path && Date.now() - new Date(last.createdAt).getTime() < 10 * 1000) {
                return res.status(204).end();
            }
        }

        const ownDomain = referrerDomain(process.env.FRONTEND_URL);
        const referrer = referrerDomain(req.body?.referrer);

        await PageView.create({
            path,
            userId: optionalUserId(req),
            sessionId,
            referrer: referrer && referrer !== ownDomain ? referrer : undefined,
            device: deviceType(req.header("User-Agent")),
        });

        return res.status(204).end();
    } catch (err) {
        console.error("Error in trackPageView:", err.message);
        return res.status(204).end();
    }
};
