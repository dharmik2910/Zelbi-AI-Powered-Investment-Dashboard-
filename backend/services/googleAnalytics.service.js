import { BetaAnalyticsDataClient } from "@google-analytics/data";

// Reads GA4 reports with a Google Cloud service account that has Viewer access to the property.
// GA4_PROPERTY_ID: the numeric property id (Admin > Property details), not the G- measurement id.
// GA4_SERVICE_ACCOUNT_JSON: the service account key file contents, as raw JSON or base64.

const REPORT_CACHE_MS = 10 * 60 * 1000;
const REALTIME_CACHE_MS = 30 * 1000;
const cache = new Map();

let client = null;
let clientEmail = null;

const readCredentials = () => {
    const raw = process.env.GA4_SERVICE_ACCOUNT_JSON;
    if (!raw) return null;
    try {
        const text = raw.trim().startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8");
        const json = JSON.parse(text);
        if (!json.client_email || !json.private_key) return null;
        // Keys pasted into env files often have literal \n instead of line breaks
        return { ...json, private_key: json.private_key.replace(/\\n/g, "\n") };
    } catch {
        return null;
    }
};

const getClient = () => {
    if (client) return client;
    const credentials = readCredentials();
    if (!credentials) return null;
    clientEmail = credentials.client_email;
    client = new BetaAnalyticsDataClient({
        credentials: { client_email: credentials.client_email, private_key: credentials.private_key },
        projectId: credentials.project_id,
    });
    return client;
};

const propertyName = () => `properties/${process.env.GA4_PROPERTY_ID}`;

export const isGoogleAnalyticsConfigured = () =>
    /^\d+$/.test(process.env.GA4_PROPERTY_ID || "") && Boolean(readCredentials());

export const serviceAccountEmail = () => {
    getClient();
    return clientEmail;
};

const cached = async (key, ttl, load) => {
    const hit = cache.get(key);
    if (hit && hit.expiresAt > Date.now()) return hit.value;
    const value = await load();
    cache.set(key, { value, expiresAt: Date.now() + ttl });
    return value;
};

// Turns a GA4 report response into plain objects keyed by dimension and metric names
const toRows = (response) => {
    const dimensions = (response.dimensionHeaders || []).map((h) => h.name);
    const metrics = (response.metricHeaders || []).map((h) => h.name);
    return (response.rows || []).map((row) => {
        const item = {};
        dimensions.forEach((name, i) => { item[name] = row.dimensionValues[i]?.value; });
        metrics.forEach((name, i) => { item[name] = Number(row.metricValues[i]?.value || 0); });
        return item;
    });
};

const report = async (request) => {
    const [response] = await getClient().runReport({ property: propertyName(), ...request });
    return toRows(response);
};

/**
 * Overview reports for the last `days` days, cached for 10 minutes.
 */
export const getAnalyticsReport = (days) =>
    cached(`report:${days}`, REPORT_CACHE_MS, async () => {
        const dateRanges = [{ startDate: `${days - 1}daysAgo`, endDate: "today" }];
        const top = (dimension, metric, limit = 10) => ({
            dateRanges,
            dimensions: [{ name: dimension }],
            metrics: [{ name: metric }],
            orderBys: [{ metric: { metricName: metric }, desc: true }],
            limit,
        });

        const [totals, byDay, pages, channels, sources, countries, devices] = await Promise.all([
            report({
                dateRanges,
                metrics: [
                    { name: "activeUsers" },
                    { name: "newUsers" },
                    { name: "sessions" },
                    { name: "screenPageViews" },
                    { name: "averageSessionDuration" },
                    { name: "engagementRate" },
                ],
            }),
            report({
                dateRanges,
                dimensions: [{ name: "date" }],
                metrics: [{ name: "activeUsers" }, { name: "screenPageViews" }],
                orderBys: [{ dimension: { dimensionName: "date" } }],
            }),
            report({
                dateRanges,
                dimensions: [{ name: "pagePath" }],
                metrics: [{ name: "screenPageViews" }, { name: "activeUsers" }],
                orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
                limit: 15,
            }),
            report(top("sessionDefaultChannelGroup", "sessions")),
            report(top("sessionSource", "sessions")),
            report(top("country", "activeUsers")),
            report(top("deviceCategory", "activeUsers", 5)),
        ]);

        const t = totals[0] || {};
        return {
            totals: {
                activeUsers: t.activeUsers || 0,
                newUsers: t.newUsers || 0,
                sessions: t.sessions || 0,
                pageViews: t.screenPageViews || 0,
                avgSessionSeconds: Math.round(t.averageSessionDuration || 0),
                engagementRate: t.engagementRate || 0,
            },
            // GA4 returns dates as YYYYMMDD
            byDay: byDay.map((d) => ({
                date: `${d.date.slice(0, 4)}-${d.date.slice(4, 6)}-${d.date.slice(6, 8)}`,
                users: d.activeUsers,
                views: d.screenPageViews,
            })),
            topPages: pages.map((p) => ({ path: p.pagePath, views: p.screenPageViews, users: p.activeUsers })),
            channels: channels.map((c) => ({ name: c.sessionDefaultChannelGroup, sessions: c.sessions })),
            sources: sources.map((s) => ({ name: s.sessionSource, sessions: s.sessions })),
            countries: countries.map((c) => ({ name: c.country, users: c.activeUsers })),
            devices: devices.map((d) => ({ name: d.deviceCategory, users: d.activeUsers })),
            fetchedAt: new Date().toISOString(),
        };
    });

/**
 * Users active in the last 30 minutes, cached for 30 seconds.
 */
export const getRealtimeUsers = () =>
    cached("realtime", REALTIME_CACHE_MS, async () => {
        const [response] = await getClient().runRealtimeReport({
            property: propertyName(),
            metrics: [{ name: "activeUsers" }],
        });
        return Number(response.rows?.[0]?.metricValues?.[0]?.value || 0);
    });
