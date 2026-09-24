import { env } from "cloudflare:workers";

type BucketObject = {
  body: ReadableStream;
  httpMetadata?: { contentType?: string };
  size?: number;
};

type BucketLike = {
  put(key: string, value: ArrayBuffer | Uint8Array | ReadableStream, options?: { httpMetadata?: { contentType?: string } }): Promise<unknown>;
  get(key: string): Promise<BucketObject | null>;
  delete(key: string): Promise<unknown>;
};

function bucket() {
  const bindings = env as unknown as Record<string, unknown>;
  const value = bindings.ARCADE_FILES as BucketLike | undefined;
  if (!value) {
    throw new Error("Cloudflare R2 binding `ARCADE_FILES` is unavailable. Bind R2 before enabling Character Forge uploads.");
  }
  return value;
}

export function forgeSourceKey(userId: string, jobId: string, extension: string) {
  const safe = extension.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8) || "jpg";
  return `character-forge/${userId}/${jobId}/source.${safe}`;
}

export function forgeOutputKey(userId: string, jobId: string) {
  return `character-forge/${userId}/${jobId}/character.glb`;
}

export async function putArcadeFile(key: string, bytes: ArrayBuffer | Uint8Array, contentType: string) {
  await bucket().put(key, bytes, { httpMetadata: { contentType } });
}

export async function getArcadeFile(key: string) {
  return bucket().get(key);
}

export async function deleteArcadeFile(key: string) {
  await bucket().delete(key);
}
