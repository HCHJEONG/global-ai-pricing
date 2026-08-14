import { describe, expect, it, vi } from "vitest";

import type { LlmProvider } from "../../application/ai";
import { GeminiVertexProvider } from "./gemini-provider";

describe("GeminiVertexProvider", () => {
  it("implements the LlmProvider contract without a live API call", async () => {
    const fetcher = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      expect(init?.headers).toEqual(
        expect.objectContaining({
          authorization: "Bearer test-token",
          "content-type": "application/json",
        }),
      );
      expect(JSON.parse(String(init?.body))).toEqual({
        contents: [
          {
            role: "user",
            parts: [{ text: "Keep verified pricing assumptions separate." }],
          },
        ],
      });

      return new Response(
        JSON.stringify({
          candidates: [{ content: { parts: [{ text: "Verified provider response." }] } }],
        }),
        { status: 200 },
      );
    });

    const provider: LlmProvider = new GeminiVertexProvider({
      config: {
        credentialsFile: "./gcp-key.json",
        project: "pricing-demo",
        location: "global",
        model: "gemini-3.6-flash",
      },
      createAuthClient: async () => ({
        getAccessToken: async () => ({ token: "test-token" }),
      }),
      fetcher,
    });

    const response = await provider.generate({
      messages: [
        {
          role: "user",
          content: "Keep verified pricing assumptions separate.",
        },
      ],
      timeoutMs: 1000,
    });

    expect(fetcher).toHaveBeenCalledWith(
      "https://aiplatform.googleapis.com/v1/projects/pricing-demo/locations/global/publishers/google/models/gemini-3.6-flash:generateContent",
      expect.any(Object),
    );
    expect(response).toEqual(
      expect.objectContaining({
        text: "Verified provider response.",
        provider: "gemini-vertex",
        model: "gemini-3.6-flash",
      }),
    );
  });
});
