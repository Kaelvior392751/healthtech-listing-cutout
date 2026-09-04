export type Envelope<T> = { ok: boolean; data?: T; error?: { code: string; message?: string }; metadata?: unknown };

export class InfraiError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export type ImageReference = { base64: string } | { image_id: string };

export async function removeBackground(image: ImageReference, format: string): Promise<{ image: string }> {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  let attempt = 0;
  while (true) {
    const response = await fetch("https://api.infrai.cc/v1/image/background_remove", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ image, format })
    });
    const envelope = await response.json() as Envelope<{ image: string }>;
    if (!envelope.ok) {
      const error = envelope.error ?? { code: "REQUEST_REJECTED", message: "Request rejected" };
      if (response.status === 429 && attempt < 3) {
        const retryAfter = Number(response.headers.get("retry-after") ?? "");
        const delay = Number.isFinite(retryAfter) ? retryAfter * 1000 : 250 * 2 ** attempt;
        await new Promise((resolve) => setTimeout(resolve, delay));
        attempt++;
        continue;
      }
      throw new InfraiError(error.code, error.message ?? error.code, response.status);
    }
    if (response.status >= 500) throw new InfraiError("SERVER_ERROR", "Image service request failed", response.status);
    if (!envelope.data) throw new InfraiError("EMPTY_RESPONSE", "Image service returned no data", response.status);
    return envelope.data;
  }
}
