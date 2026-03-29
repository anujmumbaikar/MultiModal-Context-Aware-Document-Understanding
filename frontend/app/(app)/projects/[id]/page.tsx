"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { StatsCard } from "@/components/StatsCard";
import { StatusBadge } from "@/components/StatusBadge";
import { UploadDropzone } from "@/components/UploadDropzone";
import { IngestionStepper, IngestionLogs } from "@/components/IngestionStepper";
import { DocumentTable } from "@/components/DocumentTable";
import { ChatPanel } from "@/components/ChatPanel";
import { EmptyState } from "@/components/EmptyState";

import {
  FileText,
  Layers,
  Upload,
  MessageSquare,
  Settings,
  ArrowLeft,
  Brain,
  Clock,
  Trash2,
  FileUp,
  Activity,
  LayoutDashboard,
} from "lucide-react";

import { toast } from "sonner";
import { cn } from "@/lib/utils";
import axios from "axios";

const NAV_ITEMS = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "upload", label: "Upload", icon: Upload },
  { key: "ingestion", label: "Ingestion", icon: Activity },
  { key: "documents", label: "Documents", icon: FileText },
  { key: "chat", label: "Chat", icon: MessageSquare },
  { key: "settings", label: "Settings", icon: Settings },
];

export default function ProjectDashboard() {
  const router = useRouter();
  const params = useParams();

  const projectId = params.id as string;

  const [activeSection, setActiveSection] = useState("overview");

  const [project, setProject] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  // 🔥 Fetch project
  useEffect(() => {
    if (!projectId) return;

    const loadProject = async () => {
      try {
        setLoading(true);

        const res = await axios.get(`/api/projects/${projectId}`);
        const data = res.data;

        setProject(data);
        setDocuments(data.documents || []);
        setJobs(data.ingestionJobs || []);
        setChatMessages(data.chatMessages || []);
      } catch (error) {
        console.error("Failed to load project:", error);
        setProject(null);
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [projectId]);

  // 🔥 Poll ingestion jobs every 2s while on ingestion tab
  useEffect(() => {
    if (activeSection !== "ingestion" || !projectId) return;

    // Fire immediately on tab enter, then every 2s
    const fetchJobs = async () => {
      try {
        const res = await axios.get(`/api/projects/${projectId}/jobs`);
        setJobs(res.data);
      } catch {
        // silently retry next tick
      }
    };

    fetchJobs();
    const interval = setInterval(fetchJobs, 2000);
    return () => clearInterval(interval);
  }, [activeSection, projectId]);

  // 🔥 Loading state (fixes flicker)
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading project...</p>
      </div>
    );
  }

  // 🔥 Not found state (only AFTER loading)
  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <EmptyState
          icon={FileText}
          title="Project not found"
          description="This project doesn't exist"
        >
          <Button onClick={() => router.push("/")}>Go Home</Button>
        </EmptyState>
      </div>
    );
  }

  const handleUpload = () => {
    setActiveSection("ingestion");
  };

  const handleDeleteDoc = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    toast.success("Document deleted");
  };

  const handleSendChat = (_content: string) => {
    // Chat state is managed internally by ChatPanel
  };

  const handleDeleteProject = async () => {
    await axios.delete(`/api/projects/${projectId}`);
    toast.success("Project deleted");
    router.push("/");
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-56 border-r bg-card flex flex-col">
        <div className="p-4 border-b">
          <Button
            variant="ghost"
            onClick={() => router.push("/")}
            className="text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Projects
          </Button>
        </div>

        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-primary rounded flex items-center justify-center">
              <Brain className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="text-sm font-medium">{project.name}</div>
              <StatusBadge status={project.status} />
            </div>
          </div>
        </div>

        <nav className="p-2 space-y-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveSection(item.key)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 rounded text-sm",
                activeSection === item.key
                  ? "bg-secondary font-medium"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1">
        <header className="border-b p-4 flex justify-between">
          <div>
            <h1 className="font-semibold">{project.name}</h1>
            <p className="text-xs text-muted-foreground">
              {project.domain}
            </p>
          </div>

          <Button onClick={() => setActiveSection("upload")}>
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>
        </header>

        <main className="p-6 max-w-4xl">
          {activeSection === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                  title="Documents"
                  value={documents.length}
                  icon={FileText}
                />
                <StatsCard
                  title="Chunks"
                  value={project.totalChunks || 0}
                  icon={Layers}
                />
                <StatsCard
                  title="Pages"
                  value={project.totalPages || 0}
                  icon={FileUp}
                />
                <StatsCard
                  title="Updated"
                  value={project.updatedAt || "-"}
                  icon={Clock}
                />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{project.description}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === "upload" && (
            <UploadDropzone projectId={projectId} onUpload={handleUpload} />
          )}

          {activeSection === "ingestion" && (
            jobs.length === 0 ? (
              <EmptyState
                icon={Activity}
                title="No ingestion jobs"
                description="Upload a document to start processing"
              />
            ) : (
              <div className="space-y-6">
                {jobs.map((job) => (
                  <Card key={job.id} className="border-border/50">
                    <CardContent className="p-5 space-y-5">
                      <IngestionStepper job={job} />
                      {job.logs?.length > 0 && <IngestionLogs logs={job.logs} />}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )
          )}

          {activeSection === "documents" && (
            <DocumentTable
              documents={documents}
              onDelete={handleDeleteDoc}
            />
          )}

          {activeSection === "chat" && (
            <ChatPanel
              projectId={project.id}
              messages={chatMessages}
              onSend={handleSendChat}
              onClear={() => setChatMessages([])}
            />
          )}

          {activeSection === "settings" && (
            <Button variant="destructive" onClick={handleDeleteProject}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Project
            </Button>
          )}
        </main>
      </div>
    </div>
  );
}