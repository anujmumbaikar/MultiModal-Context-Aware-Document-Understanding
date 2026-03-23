"use client";

import * as React from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import {
  Brain,
  Plus,
  Layers,
  Zap,
  Search,
  FileText,
  ArrowRight,
} from "lucide-react";

const projects = [
  {
    id: "1",
    name: "AI Research Docs",
    description: "Multimodal RAG knowledge base",
    status: "active",
    totalDocuments: 12,
    totalChunks: 340,
    domain: "AI",
  },
];

const StatusBadge = ({ status }: { status: string }) => (
  <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
    {status}
  </span>
);

const EmptyState = ({
  icon: Icon,
  title,
  description,
  children,
}: any) => (
  <div className="text-center py-12 border rounded-lg">
    <Icon className="mx-auto mb-3 h-6 w-6 text-muted-foreground" />
    <h3 className="font-medium">{title}</h3>
    <p className="text-sm text-muted-foreground mb-4">{description}</p>
    {children}
  </div>
);

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Brain className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg">DocuMind</span>
          </div>

          <Link href="/projects/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-3">
            Context-Aware Document Understanding
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Upload, process, and query your documents using multimodal RAG.
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-4 mb-12">
          {[
            {
              icon: Layers,
              title: "Multi-format Ingestion",
              desc: "PDF, DOCX, images — OCR ready",
            },
            {
              icon: Zap,
              title: "Automated Pipeline",
              desc: "Extract, chunk, embed, index",
            },
            {
              icon: Search,
              title: "Grounded Retrieval",
              desc: "Chat with citations",
            },
          ].map((f, i) => (
            <Card key={i} className="border-border/50 h-full">
              <CardContent className="p-5">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <f.icon className="h-4 w-4 text-primary" />
                </div>
                <h3 className="font-medium mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Projects */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Your Projects</h2>

          <Link href="/projects/new">
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Create Project
            </Button>
          </Link>
        </div>

        {projects.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No projects yet"
            description="Create your first project"
          >
            <Link href="/projects/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Project
              </Button>
            </Link>
          </EmptyState>
        ) : (
          <div className="grid gap-3">
            {projects.map((p) => (
              <Link key={p.id} href={`/projects/${p.id}`}>
                <Card className="border-border/50 hover:shadow-md transition cursor-pointer">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{p.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {p.description}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Landing;