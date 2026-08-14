export type VertexAiProviderConfig = {
  credentialsFile: string;
  project: string;
  location: string;
  model: string;
};

export function readVertexAiProviderConfig(
  env: Record<string, string | undefined> = process.env,
): VertexAiProviderConfig | null {
  if (!env.GOOGLE_APPLICATION_CREDENTIALS || !env.GOOGLE_CLOUD_PROJECT) {
    return null;
  }

  return {
    credentialsFile: env.GOOGLE_APPLICATION_CREDENTIALS,
    project: env.GOOGLE_CLOUD_PROJECT,
    location: env.GOOGLE_CLOUD_LOCATION ?? "global",
    model: env.VERTEX_AI_MODEL_ID ?? "gemini-3.6-flash",
  };
}
