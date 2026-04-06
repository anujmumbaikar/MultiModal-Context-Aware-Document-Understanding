import { Document } from "@/types";
import { motion } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";
import { ContentTypeBadges } from "@/components/ContentTypeBadges";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const MIME_LABELS: Record<string, string> = {
  "application/pdf": "PDF",
  "text/plain": "TXT",
  "text/csv": "CSV",
  "text/html": "HTML",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
  "application/msword": "DOC",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLSX",
  "application/vnd.ms-excel": "XLS",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "PPTX",
  "application/vnd.ms-powerpoint": "PPT",
};

function formatFileType(mimeType: string): string {
  if (MIME_LABELS[mimeType]) return MIME_LABELS[mimeType];
  if (mimeType.startsWith("image/")) return mimeType.split("/")[1].toUpperCase();
  return mimeType.split("/").pop()?.toUpperCase() ?? mimeType;
}

interface DocumentTableProps {
  documents: Document[];
  onDelete: (docId: string) => void;
}

export function DocumentTable({ documents, onDelete }: DocumentTableProps) {
  const formatSize = (bytes: number) => {
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const handleDelete = async (docId: string, docName: string) => {
    if (!confirm(`Delete "${docName}"? This will remove it from the database and vector store.`)) {
      return;
    }

    try {
      await axios.delete(`/api/documents/${docId}`);
      onDelete(docId);
      toast.success("Document deleted successfully");
    } catch (error) {
      toast.error("Failed to delete document");
    }
  };

  if (documents.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-16 border border-border/50 rounded-xl bg-card/30"
      >
        <div className="h-16 w-16 rounded-2xl bg-secondary/50 flex items-center justify-center mx-auto mb-4">
          <FileText className="h-7 w-7 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg mb-2">No documents yet</h3>
        <p className="text-muted-foreground max-w-sm mx-auto">
          Upload documents to start building your knowledge base
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden"
    >
      <Table>
        <TableHeader>
          <TableRow className="bg-secondary/30 border-border/50">
            <TableHead className="font-semibold">Document</TableHead>
            <TableHead className="font-semibold">Type</TableHead>
            <TableHead className="font-semibold">Size</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">Content</TableHead>
            <TableHead className="text-right font-semibold">Pages</TableHead>
            <TableHead className="text-right font-semibold">Chunks</TableHead>
            <TableHead className="w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((doc, idx) => (
            <motion.tr
              key={doc.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="group hover:bg-secondary/20 transition-colors border-border/50"
            >
              <TableCell className="font-medium max-w-48 truncate">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <span className="truncate">{doc.name}</span>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-xs font-medium px-2 py-1 rounded-md bg-secondary/50 border border-border/30">
                  {formatFileType(doc.fileType)}
                </span>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {formatSize(doc.size)}
              </TableCell>
              <TableCell>
                <StatusBadge status={doc.status} />
              </TableCell>
              <TableCell>
                <ContentTypeBadges types={doc.contentTypes} />
              </TableCell>
              <TableCell className="text-right text-sm">{doc.pages || "—"}</TableCell>
              <TableCell className="text-right text-sm">{doc.chunks || "—"}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-secondary/50">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="border-border/50 bg-card">
                    <DropdownMenuItem
                      onClick={() => handleDelete(doc.id, doc.name)}
                      className="text-destructive focus:text-destructive focus:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </motion.tr>
          ))}
        </TableBody>
      </Table>
    </motion.div>
  );
}
