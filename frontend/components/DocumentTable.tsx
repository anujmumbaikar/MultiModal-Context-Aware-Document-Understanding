import { Document } from "@/types";

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
import { MoreHorizontal, Eye, RefreshCw, Trash2, RotateCw } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

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

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30">
            <TableHead>Document</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Content</TableHead>
            <TableHead className="text-right">Pages</TableHead>
            <TableHead className="text-right">Chunks</TableHead>
            <TableHead className="w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((doc) => (
            <TableRow key={doc.id}>
              <TableCell className="font-medium max-w-50 truncate">
                {doc.name}
              </TableCell>
              <TableCell>
                <span className="text-xs font-semibold bg-muted px-1.5 py-0.5 rounded">
                  {formatFileType(doc.fileType)}
                </span>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatSize(doc.size)}
              </TableCell>
              <TableCell>
                <StatusBadge status={doc.status} />
              </TableCell>
              <TableCell>
                <ContentTypeBadges types={doc.contentTypes} />
              </TableCell>
              <TableCell className="text-right">{doc.pages || "—"}</TableCell>
              <TableCell className="text-right">{doc.chunks || "—"}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => handleDelete(doc.id, doc.name)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
