// api/oafinder-feedback.js
import { appendEventToGitHub } from "../lib/githubMetrics.js";

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
    // Still return 204 so the UI isn't affected; or use 500 if you prefer
    res.status(204).end();
  }
}
