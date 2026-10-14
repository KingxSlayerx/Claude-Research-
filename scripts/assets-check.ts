/** Lists image slots that still use placeholders or renders. Exits non-zero with --strict if placeholders remain. */
import { allAssets } from "../src/content/assets";

const assets = allAssets();
const placeholders = assets.filter((a) => a.status === "placeholder");
const renders = assets.filter((a) => a.status === "render");
console.log(`${placeholders.length} placeholder illustration(s) — replace before launch:`);
for (const a of placeholders) console.log(`- ${a.src}\n    ${a.brief}`);
console.log(`\n${renders.length} 3D render(s) — fine to launch with; replace with photography when available:`);
for (const a of renders) console.log(`- ${a.src}\n    ${a.brief}`);
if (process.argv.includes("--strict") && placeholders.length) process.exit(1);
