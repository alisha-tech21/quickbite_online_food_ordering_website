// END-TO-END config: ASLI frontend + ASLI backend (test database, port 5001).
// Frontend ek ALAG port (5174) par chalta hai taake aapka normal dev server (5173 -> port 5000 -> asli DB) kabhi use na ho.
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report-e2e", open: "never" }],
  ],
  use: {
    baseURL: "http://localhost:5174",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev -- --port 5174 --strictPort",
    url: "http://localhost:5174",
    reuseExistingServer: false, // jaan boojh kar: purana (asli backend wala) server kabhi reuse na ho
    timeout: 90_000,
    env: { VITE_API_BASE_URL: "http://localhost:5001/api" },
  },
});
