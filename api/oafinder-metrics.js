// api/oafinder-metrics.js
import { readAllEvents } from "../lib/githubMetrics.js";

const ALLOWED_ORIGINS = [
  "https://hslguides.med.nyu.edu",
  // "http://localhost:5000",
];

function setCorsHeaders(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  try {
    const events = await readAllEvents();

    const summary = {
      totalEvents: events.length,
      modes: {},          // per-mode counts
      supportTypes: {},   // per supportType counts
      subjects: {},       // per subjectId counts
    };

    for (const ev of events) {
      const mode = ev.mode || "unknown";
      const helpful = ev.helpful;
      const snapshot = ev.stateSnapshot || {};
      const supportType = snapshot.supportType || "none";
      const subjectId = snapshot.subjectId || "none";

      // --- per-mode summary ---
      const modeGroup =
        summary.modes[mode] ||
        (summary.modes[mode] = {
          total: 0,
          helpfulTrue: 0,
          helpfulFalse: 0,
          helpfulNull: 0,
        });

      modeGroup.total += 1;
      if (helpful === true) modeGroup.helpfulTrue += 1;
      else if (helpful === false) modeGroup.helpfulFalse += 1;
      else modeGroup.helpfulNull += 1;

      // --- per-supportType summary ---
      const stGroup =
        summary.supportTypes[supportType] ||
        (summary.supportTypes[supportType] = {
          total: 0,
          helpfulTrue: 0,
          helpfulFalse: 0,
          helpfulNull: 0,
        });

      stGroup.total += 1;
      if (helpful === true) stGroup.helpfulTrue += 1;
      else if (helpful === false) stGroup.helpfulFalse += 1;
      else stGroup.helpfulNull += 1;

      // --- per-subjectId summary ---
      const subjGroup =
        summary.subjects[subjectId] ||
        (summary.subjects[subjectId] = {
          total: 0,
          helpfulTrue: 0,
          helpfulFalse: 0,
          helpfulNull: 0,
        });

      subjGroup.total += 1;
      if (helpful === true) subjGroup.helpfulTrue += 1;
      else if (helpful === false) subjGroup.helpfulFalse += 1;
      else subjGroup.helpfulNull += 1;
    }

    res.status(200).json(summary);
  } catch (error) {
    console.error("Error reading metrics from GitHub:", error);
    res.status(500).json({ error: "Failed to load metrics" });
  }
}
