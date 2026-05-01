// api/oafinder-feedback.js
import { appendEventToGitHub } from "../lib/githubMetrics.js";

const ALLOWED_ORIGINS = [
  "https://hslguides.med.nyu.edu", // LibGuides
  // add others if needed, e.g. local dev:
  // "http://localhost:5000"
];

function setCorsHeaders(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  // Handle preflight
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
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

  if (!event.mode) {
    res.status(400).json({ error: "Missing mode" });
    return;
  }

  const normalizedEvent = {
    mode: event.mode,
    helpful: typeof event.helpful === "boolean" ? event.helpful : null,
    eventType: event.eventType || "feedback",
    stateSnapshot: event.stateSnapshot || {},
    timestamp: event.timestamp || new Date().toISOString(),
  };

  try {
    await appendEventToGitHub(normalizedEvent);
    console.log("OAFinder feedback event appended.");
    res.status(204).end();
  } catch (error) {
    console.error("Failed to append metrics to GitHub:", error);
    // Still end with 204 to not break UI (or you can send 500)
    res.status(204).end();
  }
}
