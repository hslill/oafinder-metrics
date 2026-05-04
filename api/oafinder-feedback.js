// api/oafinder-feedback.js
import { appendEventToGitHub } from "../lib/githubMetrics.js";

const ALLOWED_ORIGINS = [
  "https://hslguides.med.nyu.edu",
  // add other origins if needed, e.g. your own test host:
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

  // Normalize event shape
  const eventType = event.eventType || "feedback";

  const normalizedEvent = {
    eventType,
    mode: event.mode || "unknown",
    helpful:
      typeof event.helpful === "boolean" ? event.helpful : null,
    stateSnapshot: event.stateSnapshot || {},
    journalTitle: event.journalTitle || "",
    userRole: event.userRole || "",
    userDepartment: event.userDepartment || "",
    timestamp: event.timestamp || new Date().toISOString()
  };

  try {
    await appendEventToGitHub(normalizedEvent);
    console.log("OAFinder metrics event appended.");
    res.status(204).end();
  } catch (error) {
    console.error("Failed to append metrics to GitHub:", error);
    // Still return 204 so UI is not blocked; you could change to 500 if desired
    res.status(204).end();
  }
}
