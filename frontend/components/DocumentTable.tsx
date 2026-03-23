import { Document } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/StatusBadge';
import { ContentTypeBadges } from '@/components/ContentTypeBadges';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, RefreshCw, Trash2, RotateCw } from 'lucide-react';
import { toast } from 'sonner';

interface DocumentTableProps {
  documents: Document[];
  onDelete: (docId: string) => void;
}

export function DocumentTable({ documents, onDelete }: DocumentTableProps) {
  const formatSize = (bytes: number) => {
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
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
          {documents.map(doc => (
            <TableRow key={doc.id}>
              <TableCell className="font-medium max-w-50 truncate">{doc.name}</TableCell>
              <TableCell><span className="uppercase text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{doc.fileType}</span></TableCell>
              <TableCell className="text-muted-foreground">{formatSize(doc.size)}</TableCell>
              <TableCell><StatusBadge status={doc.status} /></TableCell>
              <TableCell><ContentTypeBadges types={doc.contentTypes} /></TableCell>
              <TableCell className="text-right">{doc.pages || '—'}</TableCell>
              <TableCell className="text-right">{doc.chunks || '—'}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => toast.info('Document preview coming soon')}>
                      <Eye className="h-4 w-4 mr-2" /> View
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toast.success('Reprocessing started')}>
                      <RefreshCw className="h-4 w-4 mr-2" /> Reprocess
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toast.success('Re-indexing started')}>
                      <RotateCw className="h-4 w-4 mr-2" /> Reindex
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => onDelete(doc.id)}>
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
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
