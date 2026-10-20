import axios from "axios";
import fs from "fs/promises";
import os from "os";

const GITHUB_API = "https://api.github.com";
const WORKFLOW_FILE = "deploy.yml";

const percent = (part, whole) => (whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0);

/** Machine and backend process health. Reads only; runs no commands. */
export const getServerHealth = async () => {
    const cpus = os.cpus().length || 1;
    const [load1, load5, load15] = os.loadavg();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();

    let disk = null;
    try {
        const stats = await fs.statfs(process.cwd());
        const total = stats.blocks * stats.bsize;
        const free = stats.bavail * stats.bsize;
        disk = { totalBytes: total, freeBytes: free, usedPercent: percent(total - free, total) };
    } catch {
        // statfs isn't available on every platform
    }

    const memory = process.memoryUsage();

    return {
        hostname: os.hostname(),
        platform: `${os.type()} ${os.release()}`,
        cpu: {
            cores: cpus,
            load: { "1m": load1, "5m": load5, "15m": load15 },
            // Load average per core; above 100% means work is queuing
            loadPercent: percent(load1, cpus),
        },
        memory: { totalBytes: totalMem, freeBytes: freeMem, usedPercent: percent(totalMem - freeMem, totalMem) },
        disk,
        systemUptimeSeconds: Math.round(os.uptime()),
        backend: {
            nodeVersion: process.version,
            pid: process.pid,
            uptimeSeconds: Math.round(process.uptime()),
            memoryBytes: memory.rss,
            managedByPm2: process.env.pm_id !== undefined,
            restarts: process.env.restart_time !== undefined ? Number(process.env.restart_time) : null,
            environment: process.env.NODE_ENV || "development",
        },
    };
};

/** Restarting is only safe under pm2, which starts the process again after it exits. */
export const canRestart = () => process.env.pm_id !== undefined;

const githubConfig = () => {
    const token = process.env.GITHUB_DEPLOY_TOKEN;
    const repo = process.env.GITHUB_REPO;
    if (!token || !/^[\w.-]+\/[\w.-]+$/.test(repo || "")) return null;
    return {
        repo,
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        },
    };
};

export const isDeployConfigured = () => Boolean(githubConfig());

/** Starts the Deploy Zelbi workflow on the main branch. */
export const triggerDeploy = async () => {
    const config = githubConfig();
    await axios.post(
        `${GITHUB_API}/repos/${config.repo}/actions/workflows/${WORKFLOW_FILE}/dispatches`,
        { ref: "main" },
        { headers: config.headers, timeout: 10000 }
    );
};

/** The five most recent deploy runs. */
export const getRecentDeploys = async () => {
    const config = githubConfig();
    const { data } = await axios.get(
        `${GITHUB_API}/repos/${config.repo}/actions/workflows/${WORKFLOW_FILE}/runs`,
        { headers: config.headers, params: { per_page: 5 }, timeout: 10000 }
    );
    return (data.workflow_runs || []).map((run) => ({
        id: run.id,
        status: run.status,
        conclusion: run.conclusion,
        event: run.event,
        commitMessage: (run.head_commit?.message || "").split("\n")[0],
        startedAt: run.run_started_at || run.created_at,
        url: run.html_url,
    }));
};
