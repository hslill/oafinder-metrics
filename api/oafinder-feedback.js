// api/oafinder-feedback.js

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

  console.log("OAFinder feedback event:", event);

  // TODO: later, persist this to a datastore or GitHub via API

  res.status(204).end();
}
