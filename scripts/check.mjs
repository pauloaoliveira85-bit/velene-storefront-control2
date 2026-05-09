import { readFile } from "node:fs/promises";

const required = [
  "index.html",
  "netlify.toml",
  "src/app.js",
  "src/shopify.js",
  "src/tracking.js",
  "src/config.js",
  "src/styles.css",
  "netlify/functions/shopify.js",
  "docs/QA_CHECKLIST.md",
  "docs/ROLLOUT.md",
  "docs/PARALLEL_INFRASTRUCTURE.md",
  "docs/SHOPIFY_CLONE_CHECKLIST.md",
  "docs/TRACKING_ARCHITECTURE.md",
  "docs/CUTOVER_DECISION_TREE.md",
];

for (const file of required) {
  await readFile(file);
}

const tracking = await readFile("src/tracking.js", "utf8");
if (tracking.includes('"Purchase"') || tracking.includes("'Purchase'")) {
  throw new Error("Frontend must not fire Purchase.");
}

console.log("Static project check passed.");
