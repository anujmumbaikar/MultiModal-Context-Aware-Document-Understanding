import { NextRequest } from "next/server";

const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8000";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string; filename: string[] }> }
) {
  const { projectId, filename } = await params;
  const filePath = filename.map(encodeURIComponent).join("/");

  const upstream = await fetch(`${FASTAPI_URL}/files/${projectId}/${filePath}`);

  if (!upstream.ok) {
    return new Response("File not found", { status: 404 });
  }

  const body = await upstream.arrayBuffer();
  return new Response(body, {
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") ?? "application/octet-stream",
      "Content-Disposition": "inline",
    },
  });
}
