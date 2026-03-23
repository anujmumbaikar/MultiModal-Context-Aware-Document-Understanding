"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { StatsCard } from "@/components/StatsCard";
import { StatusBadge } from "@/components/StatusBadge";
import { UploadDropzone } from "@/components/UploadDropzone";
import { IngestionStepper } from "@/components/IngestionStepper";
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

  useEffect(() => {
    if (!projectId) return;

    const mockProject = {
      id: projectId,
      name: "AI Research Project",
      domain: "AI / ML",
      description: "This is a temporary mock project for UI development.",
      status: "idle",
      totalDocuments: 0,
      totalChunks: 0,
      totalPages: 0,
      updatedAt: new Date().toISOString(),
    };
    setProject(mockProject);

    // async function loadProject() {
    //   const res = await fetch(`/api/projects/${projectId}`);
    //   if (!res.ok) {
    //     setProject(null);
    //     return;
    //   }
    //   const data = await res.json();
    //   setProject(data);
    // }

    // loadProject();
  }, [projectId]);

  const handleUpload = (files: File[]) => {
    toast.success(`${files.length} file(s) uploaded`);
  };

  const handleDeleteDoc = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    toast.success("Document deleted");
  };

  const handleSendChat = (content: string) => {
    setChatMessages((prev) => [...prev, { role: "user", content }]);
  };

  const handleDeleteProject = async () => {
    await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
    toast.success("Project deleted");
    router.push("/");
  };

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

  return (
    <div className="min-h-screen flex bg-background">
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

      <div className="flex-1">
        <header className="border-b p-4 flex justify-between">
          <div>
            <h1 className="font-semibold">{project.name}</h1>
            <p className="text-xs text-muted-foreground">
              {project.domain}
            </p>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => setActiveSection("upload")}>
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
          </div>
        </header>

        <main className="p-6 max-w-4xl">
          {activeSection === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard title="Documents" value={0} icon={FileText} />
                <StatsCard title="Chunks" value={0} icon={Layers} />
                <StatsCard title="Pages" value={0} icon={FileUp} />
                <StatsCard title="Updated" value={"-"} icon={Clock} />
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
            <UploadDropzone onUpload={handleUpload} />
          )}

          {activeSection === "ingestion" && (
            <div>
              {jobs.length === 0 ? (
                <EmptyState
                  title="No jobs"
                  description="No ingestion jobs yet"
                />
              ) : (
                jobs.map((job) => (
                  <IngestionStepper key={job.id} job={job} />
                ))
              )}
            </div>
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
            <div className="space-y-4">
              <Button
                variant="destructive"
                onClick={handleDeleteProject}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Project
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}