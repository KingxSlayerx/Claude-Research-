import fs from "node:fs";
import path from "node:path";

/** Starts every run with an empty quote store. */
export default function globalSetup() {
  fs.rmSync(path.join(__dirname, "../../.data/e2e-quotes.json"), { force: true });
}
