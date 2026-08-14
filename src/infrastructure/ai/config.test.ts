import { describe, expect, it } from "vitest";

import { readVertexAiProviderConfig } from "./config";

describe("Vertex AI provider config", () => {
  it("reads service-account based Gemini settings from environment variables", () => {
    expect(
      readVertexAiProviderConfig({
        GOOGLE_APPLICATION_CREDENTIALS: "./gcp-key.json",
        GOOGLE_CLOUD_PROJECT: "pricing-demo",
        GOOGLE_CLOUD_LOCATION: "global",
        VERTEX_AI_MODEL_ID: "gemini-3.6-flash",
      }),
    ).toEqual({
      credentialsFile: "./gcp-key.json",
      project: "pricing-demo",
      location: "global",
      model: "gemini-3.6-flash",
    });
  });

  it("returns null until service-account credentials and project are configured", () => {
    expect(
      readVertexAiProviderConfig({
        VERTEX_AI_MODEL_ID: "gemini-3.6-flash",
      }),
    ).toBeNull();
  });
});
