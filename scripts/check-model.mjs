import { createAnthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
const key = process.env.ANTHROPIC_API_KEY,
  model = process.env.ANTHROPIC_MODEL;
if (!key || !model) {
  console.error(
    "Set ANTHROPIC_API_KEY and ANTHROPIC_MODEL in the server environment.",
  );
  process.exit(1);
}
const response = await fetch(
  `https://api.anthropic.com/v1/models/${encodeURIComponent(model)}`,
  {
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01" },
    signal: AbortSignal.timeout(10000),
  },
);
if (!response.ok) {
  console.error(
    `Model verification failed (HTTP ${response.status}). Check the configured account and model ID.`,
  );
  process.exit(1);
}
const data = await response.json();
console.log(`Account model verified: ${data.id}`);
if (process.argv.includes("--probe")) {
  try {
    const result = await generateText({
      model: createAnthropic({ apiKey: key })(model),
      prompt: "Reply with the word OK.",
      maxOutputTokens: 20,
    });
    if (!result.text) throw new Error();
    console.log(
      "Installed AI SDK provider successfully generated a live response.",
    );
  } catch {
    console.error(
      "Live SDK probe failed. Check model generation access and quota.",
    );
    process.exit(1);
  }
}
