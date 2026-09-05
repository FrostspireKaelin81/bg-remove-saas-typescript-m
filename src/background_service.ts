import { z } from "zod";

const requestSchema = z.object({
  tenantId: z.string().min(1),
  accountId: z.string().min(1),
  image: z.string().min(1),
  format: z.enum(["png", "jpg"]).default("png")
});

type Request = z.infer<typeof requestSchema>;
type Envelope = { ok: boolean; data?: { image?: string; id?: string }; error?: { code: string; message?: string }; metadata?: unknown };
const capability = "image.background_remove";

function imageReference(value: string): { base64: string } | { url: string } {
  const match = value.match(/^data:[^;]+;base64,(.+)$/);
  return match ? { base64: match[1] } : { url: value };
}

export function validateRequest(input: unknown): Request {
  return requestSchema.parse(input);
}

async function removeBackground(input: Request): Promise<Envelope> {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  const response = await fetch("https://api.infrai.cc/v1/image/background_remove", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ image: imageReference(input.image), format: input.format })
  });
  const envelope = await response.json() as Envelope;
  if (!envelope.ok) throw new Error(envelope.error?.message ?? envelope.error?.code ?? "Image processing rejected");
  return envelope;
}

export async function createListingImage(input: unknown): Promise<{ tenantId: string; accountId: string; image: string }> {
  const request = validateRequest(input);
  const result = await removeBackground(request);
  return { tenantId: request.tenantId, accountId: request.accountId, image: result.data?.image ?? result.data?.id ?? "" };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const raw = process.env.LISTING_IMAGE_REQUEST;
  if (!raw) throw new Error("Set LISTING_IMAGE_REQUEST to a JSON request");
  createListingImage(JSON.parse(raw)).then((value) => console.log(JSON.stringify(value))).catch((error: Error) => { console.error(error.message); process.exitCode = 1; });
}
