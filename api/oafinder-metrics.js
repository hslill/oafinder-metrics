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
  setCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET, OPTIONS");
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  try {
    const events = await readAllEvents();

    // Current time and 30-day window
    const now = new Date();
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

    const summary = {
      totalEvents: events.length,
      modes: {},
      supportTypes: {},
      subjects: {},
      usage: {
        totalAccesses: 0,
        totalQueries: 0
      },
      topJournals: [],
      userRoles: {},
      userDepartments: {},
      lastEventTimestamp: null, // NEW
      last30Days: {
        from: new Date(now.getTime() - THIRTY_DAYS_MS).toISOString(),
        to: now.toISOString(),
        totalEvents: 0,
        usage: {
          totalAccesses: 0,
          totalQueries: 0
        }
        // You can add per-mode, etc. for last 30 days later if needed
      }
    };

    // Temporary maps for topJournals aggregation
    const journalCounts = new Map();

    for (const ev of events) {
      const type = ev.eventType || "feedback";
      const mode = ev.mode || "unknown";
      const helpful = ev.helpful;
      const snapshot = ev.stateSnapshot || {};
      const supportType = snapshot.supportType || "none";
      const subjectId = snapshot.subjectId || "none";
      const journalTitle = (ev.journalTitle || "").trim();
      const userRole = (ev.userRole || "Unknown").trim();
      const userDept = (ev.userDepartment || "Unknown").trim();

      // Parse timestamp to track last event
      const ts = ev.timestamp ? new Date(ev.timestamp) : null;
      if (ts && !Number.isNaN(ts.getTime())) {
        if (!summary.lastEventTimestamp) {
          summary.lastEventTimestamp = ts.toISOString();
        } else {
          const currentLast = new Date(summary.lastEventTimestamp);
          if (ts > currentLast) {
            summary.lastEventTimestamp = ts.toISOString();
          }
        }
      }

      // Determine if this event is within the last 30 days
      const inLast30Days = ts
        ? now.getTime() - ts.getTime() <= THIRTY_DAYS_MS
        : false;
      if (inLast30Days) {
        summary.last30Days.totalEvents += 1;
      }

      // === Usage: accesses & queries (all-time) ===
      if (type === "access") {
        summary.usage.totalAccesses += 1;
        if (inLast30Days) {
          summary.last30Days.usage.totalAccesses += 1;
        }
      } else if (type === "query") {
        summary.usage.totalQueries += 1;
        if (inLast30Days) {
          summary.last30Days.usage.totalQueries += 1;
        }

        // Track top journals when journalTitle is present
        if (journalTitle) {
          journalCounts.set(
            journalTitle,
            (journalCounts.get(journalTitle) || 0) + 1
          );
        }
      }

      // === Feedback by mode (all-time, as before) ===
      const modeGroup =
        summary.modes[mode] ||
        (summary.modes[mode] = {
          total: 0,
          helpfulTrue: 0,
          helpfulFalse: 0,
          helpfulNull: 0
        });

      modeGroup.total += 1;
      if (helpful === true) modeGroup.helpfulTrue += 1;
      else if (helpful === false) modeGroup.helpfulFalse += 1;
      else modeGroup.helpfulNull += 1;

      // === Support types summary (all-time) ===
      const stGroup =
        summary.supportTypes[supportType] ||
        (summary.supportTypes[supportType] = {
          total: 0,
          helpfulTrue: 0,
          helpfulFalse: 0,
          helpfulNull: 0
        });

      stGroup.total += 1;
      if (helpful === true) stGroup.helpfulTrue += 1;
      else if (helpful === false) stGroup.helpfulFalse += 1;
      else stGroup.helpfulNull += 1;

      // === Subjects summary (all-time) ===
      const subjGroup =
        summary.subjects[subjectId] ||
        (summary.subjects[subjectId] = {
          total: 0,
          helpfulTrue: 0,
          helpfulFalse: 0,
          helpfulNull: 0
        });

      subjGroup.total += 1;
      if (helpful === true) subjGroup.helpfulTrue += 1;
      else if (helpful === false) subjGroup.helpfulFalse += 1;
      else subjGroup.helpfulNull += 1;

      // === User roles ===
      if (userRole) {
        summary.userRoles[userRole] =
          (summary.userRoles[userRole] || 0) + 1;
      }

      // === User departments ===
      if (userDept) {
        summary.userDepartments[userDept] =
          (summary.userDepartments[userDept] || 0) + 1;
      }
    }

    // Build topJournals array from journalCounts
    summary.topJournals = Array.from(journalCounts.entries())
      .map(([title, count]) => ({ title, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // top 10 journals

    res.status(200).json(summary);
  } catch (error) {
    console.error("Error reading metrics from GitHub:", error);
    res.status(500).json({ error: "Failed to load metrics" });
  }
}
