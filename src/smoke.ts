import "dotenv/config";
import { callClaude } from "./claude.js";
import { PERSONAS } from "./personas.js";

const maya = PERSONAS.find((p) => p.id === "maya")!;

const reply = await callClaude({
  model: process.env.MODEL_PERSONA ?? "anthropic/claude-sonnet-4.5",
  system: maya.system,
  messages: [
    {
      role: "user",
      content: "[Zeeshan (CEO)]: Maya, what's your gut on the $240/mo EigenCompute line — eat it or drop to Pro tier?",
    },
  ],
  maxTokens: 200,
});

console.log("\n--- MAYA (CFO) replies ---\n");
console.log(reply);
console.log("\n--- ok ---\n");
