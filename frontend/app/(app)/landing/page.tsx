"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Brain,
  Plus,
  Layers,
  Zap,
  Search,
  FileText,
  FileStack,
  BookOpen,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Upload,
  Shield,
  Clock,
} from "lucide-react";
import axios from "axios";

interface Project {
  id: string;
  name: string;
  description: string;
  domain: string;
  status: string;
  totalDocuments: number;
  totalChunks: number;
  totalPages: number;
  createdAt: string;
  updatedAt: string;
}

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.3 },
};

const Landing = () => {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const res = await axios.get("/api/projects");
        setProjects(res.data.projects || []);
      } catch (error) {
        console.error("Failed to load projects:", error);
      } finally {
        setLoading(false);
      }
    };
    loadProjects();
  }, []);

  const features = [
    {
      icon: Layers,
      title: "Multi-format Ingestion",
      desc: "PDF, DOCX, images — OCR ready",
      color: "from-blue-500/20 to-cyan-500/20",
      iconColor: "text-blue-400",
    },
    {
      icon: Zap,
      title: "Automated Pipeline",
      desc: "Extract, chunk, embed, index",
      color: "from-yellow-500/20 to-orange-500/20",
      iconColor: "text-yellow-400",
    },
    {
      icon: Search,
      title: "Grounded Retrieval",
      desc: "Chat with citations",
      color: "from-purple-500/20 to-pink-500/20",
      iconColor: "text-purple-400",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Animated background gradient */}
      <div className="fixed inset-0 bg-linear-to-br from-background via-background to-secondary/5 pointer-events-none" />
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="h-9 w-9 rounded-xl bg-linear-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg glow-primary">
              <Brain className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <span className="font-semibold text-lg tracking-tight">DocuMind</span>
              <p className="text-xs text-muted-foreground -mt-0.5">Document Intelligence</p>
            </div>
          </motion.div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/projects/new">
              <Button className="gap-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                <Plus className="h-4 w-4" />
                New Project
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-6 py-12 space-y-16">
        {/* Hero Section */}
        <motion.section
          initial="initial"
          animate="animate"
          variants={staggerContainer}
          className="text-center py-12"
        >
          <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border/50 mb-6">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium">Powered by Advanced RAG</span>
          </motion.div>

          <motion.h1
            variants={fadeInUp}
            className="text-5xl md:text-6xl font-bold tracking-tight mb-4"
          >
            Context-Aware{" "}
            <span className="bg-linear-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              Document Intelligence
            </span>
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8"
          >
            Upload, process, and query your documents using multimodal RAG.
            Get accurate answers grounded in your knowledge base.
          </motion.p>

          <motion.div variants={fadeInUp} className="flex items-center justify-center gap-3">
            <Link href="/projects/new">
              <Button size="lg" className="gap-2 rounded-xl px-6 shadow-lg hover:shadow-xl transition-all duration-300">
                <Upload className="h-4 w-4" />
                Start Uploading
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="#projects">
              <Button variant="outline" size="lg" className="gap-2 rounded-xl px-6">
                <FileText className="h-4 w-4" />
                View Projects
              </Button>
            </Link>
          </motion.div>
        </motion.section>

        {/* Features Grid */}
        <motion.section
          initial="initial"
          animate="animate"
          variants={staggerContainer}
          className="grid md:grid-cols-3 gap-4"
        >
          {features.map((feature, i) => (
            <motion.div key={i} variants={scaleIn}>
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300 h-full group hover:shadow-lg hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className={`h-12 w-12 rounded-xl bg-linear-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className={`h-5 w-5 ${feature.iconColor}`} />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.section>

        {/* Projects Section */}
        <section id="projects" className="space-y-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-between"
          >
            <div>
              <h2 className="text-2xl font-semibold">Your Projects</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Manage and access your document collections
              </p>
            </div>
            <Link href="/projects/new">
              <Button variant="outline" className="gap-2 rounded-xl">
                <Plus className="h-4 w-4" />
                Create Project
              </Button>
            </Link>
          </motion.div>

          {loading ? (
            <div className="grid gap-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="border-border/50 animate-pulse">
                  <CardContent className="p-5">
                    <div className="h-4 bg-secondary rounded w-1/3 mb-2" />
                    <div className="h-3 bg-secondary rounded w-2/3 mb-3" />
                    <div className="flex gap-4">
                      <div className="h-3 bg-secondary rounded w-20" />
                      <div className="h-3 bg-secondary rounded w-20" />
                      <div className="h-3 bg-secondary rounded w-20" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : projects.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16 border border-border/50 rounded-2xl bg-card/30"
            >
              <div className="h-16 w-16 rounded-2xl bg-secondary/50 flex items-center justify-center mx-auto mb-4">
                <FileText className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-2">No projects yet</h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                Create your first project to start uploading and processing documents
              </p>
              <Link href="/projects/new">
                <Button className="gap-2 rounded-xl">
                  <Plus className="h-4 w-4" />
                  Create Your First Project
                </Button>
              </Link>
            </motion.div>
          ) : (
            <motion.div
              initial="initial"
              animate="animate"
              variants={staggerContainer}
              className="grid gap-3"
            >
              {projects.map((p) => (
                <motion.div key={p.id} variants={scaleIn}>
                  <Link href={`/projects/${p.id}`}>
                    <Card className="border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300 cursor-pointer group bg-card/50 backdrop-blur-sm">
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="h-8 w-8 rounded-lg bg-linear-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                                <Brain className="h-4 w-4 text-primary" />
                              </div>
                              <h3 className="font-semibold group-hover:text-primary transition-colors">
                                {p.name}
                              </h3>
                              <span className={`text-xs px-2 py-0.5 rounded-full border ${
                                p.status === "ready"
                                  ? "bg-green-500/10 text-green-400 border-green-500/20"
                                  : p.status === "processing"
                                  ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                                  : "bg-secondary text-muted-foreground border-border/50"
                              }`}>
                                {p.status}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-1">
                              {p.description}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-secondary/50">
                                <FileText className="h-3 w-3" />
                                {p.totalDocuments} doc{p.totalDocuments !== 1 ? "s" : ""}
                              </span>
                              <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-secondary/50">
                                <FileStack className="h-3 w-3" />
                                {p.totalChunks} chunks
                              </span>
                              <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-secondary/50">
                                <BookOpen className="h-3 w-3" />
                                {p.totalPages} pages
                              </span>
                              <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-secondary/50">
                                <Clock className="h-3 w-3" />
                                {new Date(p.updatedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0 ml-4" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </section>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="pt-12 border-t border-border/50 text-center text-sm text-muted-foreground"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="h-4 w-4" />
            <span>Secure & Private</span>
          </div>
          <p>Your documents stay on your infrastructure</p>
        </motion.footer>
      </main>
    </div>
  );
};

export default Landing;
