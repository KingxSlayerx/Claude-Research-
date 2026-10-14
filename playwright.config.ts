import { defineConfig, devices } from "@playwright/test";
import path from "node:path";
import { randomBytes, scryptSync } from "node:crypto";

const PORT = 3100;
const executablePath = process.env.CHROMIUM_PATH ?? (process.env.CI ? undefined : "/opt/pw-browsers/chromium-1194/chrome-linux/chrome");

/** Throwaway staff account for the e2e server only. */
export const E2E_STAFF = { email: "e2e-staff@example.com", password: "e2e staff password 123" };

function scryptHash(pw: string) {
  const salt = randomBytes(16);
  const hash = scryptSync(pw, salt, 32, { N: 16384, r: 8, p: 1 });
  return `scrypt:16384:8:1:${salt.toString("base64")}:${hash.toString("base64")}`;
}

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  globalSetup: "./tests/e2e/global-setup.ts",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    launchOptions: executablePath ? { executablePath } : undefined,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "mobile", use: { ...devices["Pixel 7"] }, grep: /@mobile/ },
  ],
  webServer: {
    command: `npm run build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    timeout: 240_000,
    reuseExistingServer: false,
    env: {
      QUOTE_STORE: "file",
      QUOTE_FILE_PATH: path.join(__dirname, ".data/e2e-quotes.json"),
      SESSION_SECRET: "e2e-session-secret-e2e-session-secret-0001",
      SESSION_COOKIE_INSECURE: "1",
      STAFF_EMAIL: E2E_STAFF.email,
      STAFF_NAME: "E2E Staff",
      STAFF_PASSWORD_HASH: scryptHash(E2E_STAFF.password),
      NEXT_TELEMETRY_DISABLED: "1",
    },
  },
});
