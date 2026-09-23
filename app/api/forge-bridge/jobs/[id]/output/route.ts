import { bearerToken, verifyForgeBridgeToken } from "../../../../../lib/forge-bridge";
import { finalizeForgeGlb } from "../../../../../lib/forge-finalize";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, X-Provider-Job-Id",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: cors });
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const job = await verifyForgeBridgeToken(id, bearerToken(request));
  if (!job) return Response.json({ error: "INVALID_OR_EXPIRED_BRIDGE_TOKEN" }, { status: 401, headers: cors });

  const type = (request.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
  if (type && !["model/gltf-binary", "application/octet-stream"].includes(type)) {
    return Response.json({ error: "EXPECTED_GLB" }, { status: 415, headers: cors });
  }

  const bytes = await request.arrayBuffer();
  try {
    const result = await finalizeForgeGlb(
      id,
      job.userId,
      bytes,
      request.headers.get("x-provider-job-id") || job.providerJobId,
    );
    if ("error" in result) return Response.json({ error: result.error }, { status: 400, headers: cors });
    return Response.json(result, { status: 201, headers: cors });
  } catch (error) {
    return Response.json(
      { error: "STORAGE_NOT_CONFIGURED", message: error instanceof Error ? error.message : "R2 unavailable" },
      { status: 503, headers: cors },
    );
  }
}
