import { env } from "cloudflare:workers";

type R2ObjectBodyLike = {
  body: ReadableStream;
  httpEtag?: string;
  size?: number;
  httpMetadata?: { contentType?: string };
};

type StudioR2Bucket = {
  get(key: string): Promise<R2ObjectBodyLike | null>;
  head(key: string): Promise<{ size?: number; httpEtag?: string } | null>;
  put(
    key: string,
    value: ReadableStream | ArrayBuffer | ArrayBufferView | string | null,
    options?: { httpMetadata?: { contentType?: string }; customMetadata?: Record<string, string> },
  ): Promise<unknown>;
  delete(key: string): Promise<void>;
};

type StudioCloudflareEnv = {
  DB?: unknown;
  STUDIO_ASSETS?: StudioR2Bucket;
};

function cloudflareEnv(): StudioCloudflareEnv {
  return env as unknown as StudioCloudflareEnv;
}

export function studioBindingStatus() {
  const bindings = cloudflareEnv();
  return {
    d1: Boolean(bindings.DB),
    r2: Boolean(bindings.STUDIO_ASSETS),
  };
}

export function getStudioAssetsBucket(): StudioR2Bucket {
  const bucket = cloudflareEnv().STUDIO_ASSETS;
  if (!bucket) throw new Error("Cloudflare R2 binding `STUDIO_ASSETS` is unavailable.");
  return bucket;
}

export function studioStorageKey(projectId: string, category: string, filename: string) {
  const safeProject = safeSegment(projectId);
  const safeCategory = safeSegment(category);
  const safeFilename = filename
    .normalize("NFKC")
    .replace(/[\\/]+/g, "_")
    .replace(/[^a-zA-Z0-9._() -]+/g, "_")
    .replace(/^\.+/, "")
    .trim();

  if (!safeFilename || safeFilename.length > 180) throw new Error("invalid_storage_filename");
  return `studio/${safeProject}/${safeCategory}/${safeFilename}`;
}

function safeSegment(value: string) {
  if (!/^[a-z0-9][a-z0-9-]{0,79}$/.test(value)) throw new Error("invalid_storage_segment");
  return value;
}
