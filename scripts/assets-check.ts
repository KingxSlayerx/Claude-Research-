/** Lists image slots still using placeholder artwork. Exits non-zero with --strict. */
import { allAssets } from "../src/content/assets";

const pending = allAssets().filter((a) => a.status === "placeholder");
if (!pending.length) {
  console.log("All image slots use final photography.");
} else {
  console.log(`${pending.length} image slot(s) still use placeholders:\n`);
  for (const a of pending) console.log(`- ${a.src}\n    ${a.brief}`);
}
if (process.argv.includes("--strict") && pending.length) process.exit(1);
