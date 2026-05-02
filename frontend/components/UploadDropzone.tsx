"use client";

import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileUp, X, CheckCircle2, Loader2, AlertCircle, CloudUpload, Image, Table2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import axios from "axios";
import { toast } from "sonner";

const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || "http://localhost:8000";

interface UploadDropzoneProps {
  projectId: string;
  onUpload: () => void;
  className?: string;
}

export function UploadDropzone({ projectId, onUpload, className }: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{ file: File; status: "queued" | "uploading" | "done" | "error" }[]>([]);
  const [processImages, setProcessImages] = useState(false);
  const [processTables, setProcessTables] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) {
      setUploadedFiles((prev) => [...prev, ...files.map((f) => ({ file: f, status: "queued" as const }))]);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length) {
      setUploadedFiles((prev) => [...prev, ...files.map((f) => ({ file: f, status: "queued" as const }))]);
    }
  }, []);

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    const queued = uploadedFiles.filter((f) => f.status === "queued");
    if (!queued.length) return;

    setUploadedFiles((prev) =>
      prev.map((f) => (f.status === "queued" ? { ...f, status: "uploading" } : f))
    );

    const url = `${FASTAPI_URL}/upload?project_id=${projectId}&process_images=${processImages}&process_tables=${processTables}`;

    const results = await Promise.allSettled(
      queued.map(async ({ file }) => {
        const formData = new FormData();
        formData.append("file", file);
        await axios.post(url, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        return file;
      })
    );

    const succeeded: File[] = [];
    setUploadedFiles((prev) =>
      prev.map((item) => {
        const result = results[queued.findIndex((q) => q.file === item.file)];
        if (!result) return item;
        if (result.status === "fulfilled") {
          succeeded.push(item.file);
          return { ...item, status: "done" };
        }
        return { ...item, status: "error" };
      })
    );

    const failed = results.filter((r) => r.status === "rejected").length;
    if (succeeded.length) {
      toast.success(`${succeeded.length} file(s) uploaded — processing in background`);
      onUpload();
    }
    if (failed) toast.error(`${failed} file(s) failed to upload`);

    setTimeout(() => setUploadedFiles((prev) => prev.filter((f) => f.status !== "done")), 3000);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "queued":
        return <FileUp className="h-4 w-4 text-muted-foreground" />;
      case "uploading":
        return <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />;
      case "done":
        return <CheckCircle2 className="h-4 w-4 text-green-400" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("space-y-4", className)}
    >
      {/* Dropzone */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className={cn(
          "relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300",
          isDragging
            ? "border-primary/50 bg-primary/5 scale-[1.02]"
            : "border-border/50 hover:border-primary/30 hover:bg-secondary/30"
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById("file-input")?.click()}
      >
        <input
          id="file-input"
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          accept=".pdf,.docx,.xlsx,.txt,.csv,.png,.jpg,.jpeg"
        />

        <div className="flex flex-col items-center gap-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center"
          >
            <CloudUpload className="h-7 w-7 text-primary" />
          </motion.div>

          <div>
            <p className="text-base font-semibold">Drop files here or click to browse</p>
            <p className="text-sm text-muted-foreground mt-1.5">
              PDF, DOCX, XLSX, TXT, CSV, PNG, JPG — up to 50MB each
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mt-1">
            {["PDF", "DOCX", "XLSX", "CSV", "PNG", "JPG"].map((t) => (
              <span
                key={t}
                className="text-[10px] font-medium bg-secondary/50 border border-border/50 px-2.5 py-1 rounded-full"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Processing options */}
      <div
        className="rounded-xl border border-border/50 bg-card/30 px-4 py-3 space-y-2"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Extraction options
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <input
              type="checkbox"
              checked={processImages}
              onChange={(e) => setProcessImages(e.target.checked)}
              className="h-4 w-4 rounded accent-primary cursor-pointer"
            />
            <Image className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
            <span className="text-sm select-none group-hover:text-foreground transition-colors">
              Extract &amp; caption images
            </span>
            {processImages && (
              <span className="text-[10px] bg-amber-500/15 text-amber-500 border border-amber-500/20 px-1.5 py-0.5 rounded-full font-medium">
                slower
              </span>
            )}
          </label>

          <label className="flex items-center gap-2.5 cursor-pointer group">
            <input
              type="checkbox"
              checked={processTables}
              onChange={(e) => setProcessTables(e.target.checked)}
              className="h-4 w-4 rounded accent-primary cursor-pointer"
            />
            <Table2 className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
            <span className="text-sm select-none group-hover:text-foreground transition-colors">
              Extract &amp; describe tables
            </span>
            {processTables && (
              <span className="text-[10px] bg-amber-500/15 text-amber-500 border border-amber-500/20 px-1.5 py-0.5 rounded-full font-medium">
                slower
              </span>
            )}
          </label>
        </div>
        {(processImages || processTables) && (
          <p className="text-[11px] text-muted-foreground">
            Each image/table requires a GPT-4 API call. Large documents will take significantly longer.
          </p>
        )}
      </div>

      {/* File list */}
      <AnimatePresence>
        {uploadedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {uploadedFiles.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/50 p-3.5 hover:bg-card/70 transition-colors"
              >
                <div className="h-9 w-9 rounded-lg bg-secondary/50 flex items-center justify-center shrink-0">
                  {getStatusIcon(item.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatSize(item.file.size)}</p>
                </div>
                {item.status === "queued" && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(i);
                    }}
                    className="text-muted-foreground hover:text-destructive p-1"
                  >
                    <X className="h-4 w-4" />
                  </motion.button>
                )}
              </motion.div>
            ))}

            {uploadedFiles.some((f) => f.status === "queued") && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Button
                  onClick={handleUpload}
                  className="w-full rounded-xl shadow-lg"
                  size="lg"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload {uploadedFiles.filter((f) => f.status === "queued").length} file(s)
                </Button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
