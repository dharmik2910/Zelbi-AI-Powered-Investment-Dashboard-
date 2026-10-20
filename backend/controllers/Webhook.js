import crypto from "crypto";
import EmailLog from "../models/EmailLog.js";

// Brevo transactional event names mapped to our statuses
const BREVO_STATUS = {
    deferred: "deferred",
    delivered: "delivered",
    opened: "opened",
    unique_opened: "opened",
    proxy_open: "opened",
    click: "clicked",
    soft_bounce: "bounced",
    hard_bounce: "bounced",
    blocked: "blocked",
    invalid_email: "invalid",
    spam: "spam",
    complaint: "spam",
    error: "failed",
};

// Events can arrive out of order; never let an earlier stage overwrite a later one
const STATUS_RANK = {
    failed: 0, sent: 1, deferred: 2, delivered: 3, opened: 4, clicked: 5, bounced: 6, blocked: 6, invalid: 6, spam: 7,
};

const safeEqual = (a, b) => {
    const left = Buffer.from(String(a));
    const right = Buffer.from(String(b));
    return left.length === right.length && crypto.timingSafeEqual(left, right);
};

/**
 * Receives Brevo delivery events. Configure in Brevo under Transactional > Settings > Webhook
 * with the URL https://<your-site>/api/webhooks/brevo?token=<BREVO_WEBHOOK_SECRET>.
 */
export const brevoWebhook = async (req, res) => {
    const secret = process.env.BREVO_WEBHOOK_SECRET;
    if (!secret) {
        return res.status(404).end();
    }
    if (!safeEqual(req.query.token || "", secret)) {
        return res.status(401).json({ success: false });
    }

    try {
        const events = Array.isArray(req.body) ? req.body : [req.body];
        for (const event of events) {
            const status = BREVO_STATUS[event?.event];
            const messageId = event?.["message-id"];
            if (!status || !messageId) continue;

            const log = await EmailLog.findOne({ messageId });
            if (!log) continue;

            log.events.push({
                event: event.event,
                at: event.ts_event ? new Date(event.ts_event * 1000) : new Date(),
                reason: event.reason ? String(event.reason).slice(0, 300) : undefined,
            });
            if ((STATUS_RANK[status] ?? 0) >= (STATUS_RANK[log.status] ?? 0)) {
                log.status = status;
                if (event.reason && ["bounced", "blocked", "invalid", "failed", "deferred"].includes(status)) {
                    log.error = String(event.reason).slice(0, 500);
                }
            }
            await log.save();
        }
        return res.status(200).json({ success: true });
    } catch (err) {
        console.error("Error in brevoWebhook:", err);
        // A 500 makes Brevo retry, which is what we want for transient database errors
        return res.status(500).json({ success: false });
    }
};
