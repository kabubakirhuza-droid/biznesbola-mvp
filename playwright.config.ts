import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  timeout: 60000,
  fullyParallel: true,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:5177",
    trace: "retain-on-failure",
    browserName: "chromium",
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 5177",
    url: "http://127.0.0.1:5177",
    reuseExistingServer: true,
  },
  projects: [360, 390, 768, 1280].map((width) => ({
    name: `width-${width}`,
    use: { viewport: { width, height: 900 } },
  })),
});
