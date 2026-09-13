import fs from "node:fs";
import path from "node:path";

const root = path.resolve("node_modules");
const results = [];
function walk(dir, depth = 0) {
  if (depth > 6 || !fs.existsSync(dir)) return;
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "@tanstack") walk(p, depth + 1);
      if (e.name === "start-client-core") {
        const pj = path.join(p, "package.json");
        if (fs.existsSync(pj)) {
          const v = JSON.parse(fs.readFileSync(pj, "utf8")).version;
          const rel = p.replace(root + path.sep, "node_modules/" + path.sep);
          results.push(`${p} => ${v}`);
        }
      }
    }
  }
}
// Also catch node_modules/.pnpm nested via @tanstack
function walkAll(base) {
  if (!fs.existsSync(base)) return;
