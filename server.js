// server.js
const express = require("express");
const fs = require("fs");
const path = require("path");
const cookieParser = require("cookie-parser");

const app = express();
const PORT = process.env.PORT || 5000;

const PUBLIC_DIR = path.join(__dirname, "public");
const DATA_FILE = path.join(PUBLIC_DIR, "content.json");
const BACKUP_DIR = path.join(__dirname, "data-backups");

const EDITOR_COOKIE_NAME = "oaf_editor_session";
const EZPROXY_HOST_SNIPPET = "ezproxy.med.nyu.edu"; // used for a simple check

app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());
app.use(express.static(PUBLIC_DIR));

// Make sure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// --- tiny helper: is this request probably from EZproxy? ---
function isRequestFromEzproxy(req) {
  const xfHost = (req.headers["x-forwarded-host"] || "").toString().toLowerCase();
  const xfFor = (req.headers["x-forwarded-for"] || "").toString().toLowerCase();
  // Very loose check – good enough for a prototype
  if (xfHost.includes(EZPROXY_HOST_SNIPPET)) return true;
  if (xfFor.includes("ezproxy")) return true; // in case your proxy tags it somehow
  // Optional: if you know EZproxy sets a user header, you can add it here:
  // const user = (req.headers["x-remote-user"] || "").toString();
  // if (user) return true;
  return false;
}

// --- Minimal auth guard for editor & saving ---
// Logic:
// 1) If cookie is set, allow.
// 2) Else if looks like EZproxy, set cookie and allow.
// 3) Else block.
function requireEditorAuth(req, res, next) {
  if (req.cookies[EDITOR_COOKIE_NAME] === "1") {
    return next();
  }
  if (isRequestFromEzproxy(req)) {
    res.cookie(EDITOR_COOKIE_NAME, "1", {
      httpOnly: false, // simple prototype; ok to inspect in dev tools
      secure: false,   // set true behind HTTPS in real deployment
      sameSite: "Lax",
      maxAge: 8 * 60 * 60 * 1000 // 8 hours
    });
    return next();
  }
  res.status(403).send("Editor access is restricted (prototype guard).");
}

// --- Simple helpers for reading/writing JSON with backup ---
function readContentFile() {
  return new Promise((resolve, reject) => {
    fs.readFile(DATA_FILE, "utf8", (err, text) => {
      if (err) return reject(err);
      try {
        const json = JSON.parse(text);
        resolve(json);
      } catch (e) {
        reject(e);
      }
    });
  });
}

function writeContentFile(newData) {
  return new Promise((resolve, reject) => {
    try {
      let currentText = "";
      try {
        currentText = fs.readFileSync(DATA_FILE, "utf8");
      } catch (e) {
        console.warn("No existing content.json to backup (first run?)");
      }

      let backupFileName = null;
      if (currentText) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        backupFileName = `content-${timestamp}.json`;
        const backupPath = path.join(BACKUP_DIR, backupFileName);
        fs.writeFileSync(backupPath, currentText, "utf8");
      }

      const prettyJson = JSON.stringify(newData, null, 2);
      fs.writeFile(DATA_FILE, prettyJson, "utf8", err => {
        if (err) return reject(err);
        resolve(backupFileName);
      });
    } catch (err) {
      reject(err);
    }
  });
}

// --- (Very) basic validator so you don't accidentally overwrite with junk ---
function validateContentJson(payload) {
  const errors = [];
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    errors.push("Root must be a JSON object.");
    return errors;
  }
  if (!Array.isArray(payload.publishing_deals)) {
    errors.push("publishing_deals must be an array.");
  }
  if (!Array.isArray(payload.journals_index)) {
    errors.push("journals_index must be an array.");
  }
  return errors;
}

// ---------------- API ROUTES ----------------

// Public: read JSON
app.get("/api/content", async (req, res) => {
  try {
    const data = await readContentFile();
    res.json(data);
  } catch (err) {
    console.error("Error reading content.json:", err);
    res.status(500).json({ error: "Failed to read content.json" });
  }
});

// --- Metrics: feedback events ---
app.post("/api/metrics/feedback", (req, res) => {
  const event = req.body || {};
  // Expected shape:
  // {
  //   mode: "search" | "support" | "coverage" | "browse",
  //   helpful: true/false (or null/undefined for non-feedback metrics),
  //   stateSnapshot: { subjectId, supportType, benefitType, hasQuery, queryLength },
  //   eventType: "feedback" | "query" | undefined,
  //   timestamp: ISO string
  // }

  // For now, just log it. Later you can persist to a file or database.
  console.log("OAFinder metrics event:", event);

  res.status(204).end();
});

app.post("/api/metrics/feedback", (req, res) => {
  const event = req.body || {};
  const type = event.eventType || "feedback"; // default

  if (type === "query") {
    // TODO: update query counters or log differently
    console.log("OAFinder query event:", event);
  } else {
    // feedback (yes/no)
    console.log("OAFinder feedback event:", event);
  }

  res.status(204).end();
});

// Protected: save JSON. Prototype: no authorization guard, yet.
app.put("/api/content", async (req, res) => {
  const payload = req.body;
  const errors = validateContentJson(payload);
  if (errors.length) {
    return res.status(400).json({
      status: "error",
      message: "Validation failed.",
      errors
    });
  }

  // Update last_updated for convenience
  payload.last_updated = new Date().toISOString();

  try {
    const backupFile = await writeContentFile(payload);
    res.json({
      status: "ok",
      message: "content.json updated",
      backupFile
    });
  } catch (err) {
    console.error("Error writing content.json:", err);
    res.status(500).json({
      status: "error",
      message: "Failed to write content.json"
    });
  }
});

// server.js backup management routes (for editor to list/download previous versions)
app.get("/api/backups", (req, res) => {
  fs.readdir(BACKUP_DIR, (err, files) => {
    if (err) return res.status(500).json({ error: "Failed to list backups" });
    const jsonFiles = files.filter(f => f.endsWith(".json"));
    res.json(jsonFiles);
  });
});

app.get("/api/backups/:name", (req, res) => {
  const name = req.params.name;
  const fullPath = path.join(BACKUP_DIR, name);
  // very basic guard: only allow .json in this folder
  if (!name.endsWith(".json") || !fullPath.startsWith(BACKUP_DIR)) {
    return res.status(400).json({ error: "Invalid backup name" });
  }
  fs.readFile(fullPath, "utf8", (err, text) => {
    if (err) return res.status(500).json({ error: "Failed to read backup" });
    try {
      const json = JSON.parse(text);
      res.json(json);
    } catch {
      res.status(500).json({ error: "Backup is invalid JSON" });
    }
  });
});

// Public index
app.get("/", (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

// Editor (prototype-guarded. Note: auth guard disabled for now.)
app.get("/editor", (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "editor.html"));
});

app.listen(PORT, () => {
  console.log(`OAFinder prototype server running at http://localhost:${PORT}`);
});