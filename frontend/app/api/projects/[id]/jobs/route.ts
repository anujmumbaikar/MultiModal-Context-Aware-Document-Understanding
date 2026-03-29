import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

const PIPELINE_STAGES = [
  "upload_received",
  "chunking",
  "embeddings",
  "vector_storage",
  "ready",
] as const;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const projectId = (await params).id;
    const jobs = await prisma.ingestionJob.findMany({
      where: { projectId },
      include: {
        stages: { orderBy: { id: "asc" } },
        logs: { orderBy: { timestamp: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(jobs);
  } catch (error) {
    console.error("JOBS_GET_ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const projectId = (await params).id;
    const { filename } = await req.json();

    const job = await prisma.ingestionJob.create({
      data: {
        projectId,
        currentStage: "upload_received",
        progress: 0,
        stages: {
          create: PIPELINE_STAGES.map((stage) => ({
            stage,
            status: stage === "upload_received" ? "running" : "pending",
            startedAt: stage === "upload_received" ? new Date() : null,
          })),
        },
        logs: {
          create: {
            timestamp: new Date(),
            message: `Ingestion job started for: ${filename}`,
            level: "info",
          },
        },
      },
      include: {
        stages: true,
        logs: true,
      },
    });

    return NextResponse.json(job);
  } catch (error) {
    console.error("JOBS_POST_ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
