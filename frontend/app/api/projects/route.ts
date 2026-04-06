import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      include: {
        documents: true,
        ingestionJobs: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    const projectsWithStats = projects.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      domain: p.domain,
      status: p.status,
      totalDocuments: p.documents.length,
      totalChunks: p.documents.reduce((sum, d) => sum + (d.chunks || 0), 0),
      totalPages: p.documents.reduce((sum, d) => sum + (d.pages || 0), 0),
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));

    return NextResponse.json({ projects: projectsWithStats });
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}
