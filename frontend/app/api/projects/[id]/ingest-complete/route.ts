import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const projectId = (await params).id;
    const { filename, fileType, fileSize, chunks, pages } = await req.json();

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    await prisma.document.create({
      data: {
        projectId,
        name: filename,
        fileType: fileType || "unknown",
        size: fileSize || 0,
        status: "completed",
        chunks: chunks || 0,
        pages: pages || 0,
        contentTypes: [],
        uploadedAt: new Date(),
        processedAt: new Date(),
      },
    });

    await prisma.project.update({
      where: { id: projectId },
      data: {
        totalDocuments: { increment: 1 },
        totalChunks: { increment: chunks || 0 },
        totalPages: { increment: pages || 0 },
        status: "ready",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("INGEST_COMPLETE_ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
