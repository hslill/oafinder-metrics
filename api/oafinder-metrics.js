// api/oafinder-metrics.js
import { getEvents } from "../lib/metricsStore.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  const events = getEvents();

  // Aggregate feedback events by mode and helpful flag
  const summary = {
    totalEvents: events.length,
    modes: {},
  };

  for (const ev of events) {
    const mode = ev.mode || "unknown";
    const group =
      summary.modes[mode] ||
      (summary.modes[mode] = {
        total: 0,
        helpfulTrue: 0,
        helpfulFalse: 0,
        helpfulNull: 0,
      });

    group.total += 1;

    if (ev.helpful === true) group.helpfulTrue += 1;
    else if (ev.helpful === false) group.helpfulFalse += 1;
    else group.helpfulNull += 1;
  }

  res.status(200).json(summary);
}
