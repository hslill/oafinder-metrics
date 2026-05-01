// api/oafinder-feedback.js
import { addEvent } from "../lib/metricsStore.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  let event = {};
  try {
    event = req.body || {};
  } catch (err) {
    res.status(400).json({ error: "Invalid JSON" });
    return;
  }

  // Minimal validation
  if (!event.mode) {
    res.status(400).json({ error: "Missing mode" });
    return;
  }

  // Normalize event shape a bit
  const normalizedEvent = {
    mode: event.mode,
    helpful: typeof event.helpful === "boolean" ? event.helpful : null,
    eventType: event.eventType || "feedback",
    stateSnapshot: event.stateSnapshot || {},
    timestamp: event.timestamp || new Date().toISOString(),
  };

  // Add to in-memory store
  addEvent(normalizedEvent);

  // Also log to Vercel logs for debugging
  console.log("OAFinder feedback event:", normalizedEvent);

  res.status(204).end();
}
// lib/githubMetrics.js
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER;
const GITHUB_REPO = process.env.GITHUB_REPO;
const GITHUB_METRICS_PATH = process.env.GITHUB_METRICS_PATH || "data/events.jsonl";

if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
  console.warn("GitHub metrics env vars are not fully set.");
}

const GITHUB_API_BASE = "https://api.github.com";

async function fetchFile() {
  const url = `${GITHUB_API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${encodeURIComponent(
    GITHUB_METRICS_PATH
  )}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (response.status === 404) {
    // File does not exist yet
    return { sha: null, content: "" };
  }

  if (!response.ok) {
    throw new Error(`GitHub fetch failed: ${response.status}`);
  }

  const json = await response.json();
  const decoded = Buffer.from(json.content || "", "base64").toString("utf8");
  return { sha: json.sha, content: decoded };
}

async function updateFile(newContent, previousSha) {
  const url = `${GITHUB_API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${encodeURIComponent(
    GITHUB_METRICS_PATH
  )}`;

  const message = "Append OAFinder feedback event";

  const body = {
    message,
    content: Buffer.from(newContent, "utf8").toString("base64"),
    sha: previousSha || undefined,
  };

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub update failed: ${response.status} ${text}`);
  }

  return response.json();
}

export async function appendEventToGitHub(event) {
  if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
    console.warn("GitHub metrics not configured, skipping append.");
    return;
  }

  // 1. Get current file content + sha
  const { sha, content } = await fetchFile();

  // 2. Append new line (JSONL)
  const line = JSON.stringify(event);
  const newContent = content ? `${content.trimEnd()}\n${line}\n` : `${line}\n`;

  // 3. Update the file
  await updateFile(newContent, sha);
}

export async function readAllEvents() {
  if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
    console.warn("GitHub metrics not configured, returning empty events.");
    return [];
  }

  const { content } = await fetchFile();
  if (!content.trim()) return [];

  const lines = content
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const events = [];
  for (const line of lines) {
    try {
      const ev = JSON.parse(line);
      events.push(ev);
    } catch (e) {
      // Skip bad lines
      console.warn("Invalid metrics line, skipping:", line);
    }
  }
  return events;
}
