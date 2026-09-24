import { getArcadeFile } from "../../../../../lib/arcade-files";
import { bearerToken, verifyForgeBridgeToken } from "../../../../../lib/forge-bridge";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: cors });
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const job = await verifyForgeBridgeToken(id, bearerToken(request));
  if (!job) return Response.json({ error: "INVALID_OR_EXPIRED_BRIDGE_TOKEN" }, { status: 401, headers: cors });
  if (!job.sourceImageKey) return Response.json({ error: "SOURCE_IMAGE_REQUIRED" }, { status: 404, headers: cors });

  try {
    const file = await getArcadeFile(job.sourceImageKey);
    if (!file) return Response.json({ error: "SOURCE_IMAGE_NOT_FOUND" }, { status: 404, headers: cors });
    return new Response(file.body, {
      headers: {
        ...cors,
        "Content-Type": file.httpMetadata?.contentType || "application/octet-stream",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return Response.json(
      { error: "STORAGE_NOT_CONFIGURED", message: error instanceof Error ? error.message : "R2 unavailable" },
      { status: 503, headers: cors },
    );
  }
}
