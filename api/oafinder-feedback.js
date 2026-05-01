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
