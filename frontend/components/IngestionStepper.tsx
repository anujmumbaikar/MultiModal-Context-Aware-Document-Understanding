"use client";

import { Check, Loader2, Circle, XCircle, Trash2, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { IngestionJob } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const stageLabels: Record<string, string> = {
  upload_received: "Upload Received",
  chunking: "Extracting & Chunking",
  embeddings: "Generating Embeddings",
  vector_storage: "Vector Storage",
  ready: "Ready for Query",
};

const stageIcons: Record<string, React.ReactNode> = {
  upload_received: <Circle className="h-3 w-3" />,
  chunking: <Circle className="h-3 w-3" />,
  embeddings: <Circle className="h-3 w-3" />,
  vector_storage: <Circle className="h-3 w-3" />,
  ready: <Check className="h-3.5 w-3.5" />,
};

export function IngestionStepper({ job, onDelete }: { job: IngestionJob; onDelete?: (jobId: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-medium">Pipeline Progress</h4>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{job.progress}%</span>
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(job.id)}
              title="Delete job"
              type="button"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-secondary/50 rounded-full h-2.5 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${job.progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="bg-gradient-to-r from-primary to-primary/70 h-full rounded-full"
        />
      </div>

      {/* Stages */}
      <div className="space-y-2">
        {job.stages.map((stage, idx) => {
          const isCompleted = stage.status === "completed";
          const isRunning = stage.status === "running";
          const isFailed = stage.status === "failed";
          const isPending = stage.status === "pending";

          return (
            <motion.div
              key={stage.stage}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.08 }}
              className={cn(
                "flex items-center gap-3 py-2 px-3 rounded-lg transition-colors",
                isRunning && "bg-primary/10 border border-primary/20"
              )}
            >
              {/* Status indicator */}
              <motion.div
                animate={isRunning ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 1, repeat: isRunning ? Infinity : 0 }}
                className={cn(
                  "h-7 w-7 rounded-full flex items-center justify-center shrink-0 border-2",
                  isCompleted && "bg-green-500 border-green-500 text-white",
                  isRunning && "bg-primary border-primary text-primary-foreground",
                  isFailed && "bg-destructive border-destructive text-destructive-foreground",
                  isPending && "bg-muted border-border/50 text-muted-foreground"
                )}
              >
                {isCompleted && <Check className="h-4 w-4" />}
                {isRunning && <Loader2 className="h-4 w-4 animate-spin" />}
                {isFailed && <XCircle className="h-4 w-4" />}
                {isPending && <Circle className="h-2.5 w-2.5" />}
              </motion.div>

              {/* Label */}
              <span
                className={cn(
                  "text-sm flex-1",
                  isRunning && "font-medium text-foreground",
                  isCompleted && "text-muted-foreground",
                  isPending && "text-muted-foreground/60",
                  isFailed && "text-destructive"
                )}
              >
                {stageLabels[stage.stage] ?? stage.stage}
              </span>

              {/* Status badge */}
              {isCompleted && (
                <span className="text-xs text-green-400 font-medium">Done</span>
              )}
              {isRunning && (
                <span className="text-xs text-primary font-medium">Running...</span>
              )}
              {isFailed && (
                <span className="text-xs text-destructive font-medium">Failed</span>
              )}
              {isPending && (
                <span className="text-xs text-muted-foreground/60">Pending</span>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

export function IngestionLogs({ logs }: { logs: IngestionJob["logs"] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border/50 bg-card/30 overflow-hidden"
    >
      <div className="p-3 border-b border-border/50 bg-secondary/30">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Settings className="h-3.5 w-3.5 text-muted-foreground" />
          Activity Log
        </h4>
      </div>
      <div className="max-h-48 overflow-y-auto p-3 space-y-1.5 font-mono text-xs scrollbar-thin">
        {logs.map((log, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            className="flex gap-2"
          >
            <span className="text-muted-foreground shrink-0 opacity-60">
              {new Date(log.timestamp).toLocaleTimeString()}
            </span>
            <span
              className={cn(
                log.level === "error" && "text-destructive",
                log.level === "warn" && "text-yellow-400",
                log.level === "info" && "text-muted-foreground"
              )}
            >
              {log.message}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
