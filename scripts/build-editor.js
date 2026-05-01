// scripts/build-editor.js
// Build-time script to inject EDITOR_PASSWORD from env into editor.js

const fs = require("fs");
const path = require("path");

const srcPath = path.join(__dirname, "..", "public", "editor.js");
const outPath = path.join(__dirname, "..", "public", "editor-built.js");

const password = process.env.EDITOR_PASSWORD;

if (!password) {
  console.error("EDITOR_PASSWORD env var is not set. Aborting editor build.");
  process.exit(1);
}

let source = fs.readFileSync(srcPath, "utf8");

if (!source.includes("__EDITOR_PASSWORD__PLACEHOLDER__")) {
  console.error("Placeholder __EDITOR_PASSWORD__PLACEHOLDER__ not found in editor.js");
  process.exit(1);
}

// Replace all occurrences of the placeholder with a safely-escaped password
const escapedPassword = password.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
source = source.replace(
  /"__EDITOR_PASSWORD__PLACEHOLDER__"/g,
  `"${escapedPassword}"`
);

fs.writeFileSync(outPath, source, "utf8");
console.log("editor-built.js generated with injected password.");