import { useCallback, useState } from 'react';
import { Upload, FileUp, X, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import axios from 'axios';
import { toast } from 'sonner';

const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000';

interface UploadDropzoneProps {
  projectId: string;
  onUpload: (files: File[]) => void;
  className?: string;
}

export function UploadDropzone({ projectId, onUpload, className }: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{ file: File; status: 'queued' | 'uploading' | 'done' | 'error' }[]>([]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) {
      setUploadedFiles(prev => [...prev, ...files.map(f => ({ file: f, status: 'queued' as const }))]);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length) {
      setUploadedFiles(prev => [...prev, ...files.map(f => ({ file: f, status: 'queued' as const }))]);
    }
  }, []);

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    const queued = uploadedFiles.filter(f => f.status === 'queued');
    if (!queued.length) return;

    setUploadedFiles(prev => prev.map(f => f.status === 'queued' ? { ...f, status: 'uploading' } : f));

    const results = await Promise.allSettled(
      queued.map(async ({ file }) => {
        const formData = new FormData();
        formData.append('file', file);
        await axios.post(`${FASTAPI_URL}/upload?project_id=${projectId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        return file;
      })
    );

    const succeeded: File[] = [];
    setUploadedFiles(prev => prev.map(item => {
      const result = results[queued.findIndex(q => q.file === item.file)];
      if (!result) return item;
      if (result.status === 'fulfilled') {
        succeeded.push(item.file);
        return { ...item, status: 'done' };
      }
      return { ...item, status: 'error' };
    }));

    const failed = results.filter(r => r.status === 'rejected').length;
    if (succeeded.length) {
      toast.success(`${succeeded.length} file(s) uploaded — processing in background`);
      onUpload(succeeded);
    }
    if (failed) toast.error(`${failed} file(s) failed to upload`);

    setTimeout(() => setUploadedFiles(prev => prev.filter(f => f.status !== 'done')), 3000);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-10 text-center transition-all cursor-pointer',
          isDragging ? 'border-foreground/40 bg-secondary' : 'border-border hover:border-foreground/30 hover:bg-secondary/40'
        )}
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <input id="file-input" type="file" multiple className="hidden" onChange={handleFileSelect} accept=".pdf,.docx,.xlsx,.txt,.csv,.png,.jpg,.jpeg" />
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-secondary flex items-center justify-center">
            <Upload className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">Drop files here or click to browse</p>
            <p className="text-xs text-muted-foreground mt-1.5">PDF, DOCX, XLSX, TXT, CSV, PNG, JPG — up to 50MB each</p>
          </div>
          <div className="flex gap-2 mt-1">
            {['PDF', 'DOCX', 'XLSX', 'PNG'].map(t => (
              <span key={t} className="text-[10px] font-mono bg-secondary border px-2 py-0.5 rounded">{t}</span>
            ))}
          </div>
        </div>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          {uploadedFiles.map((item, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
              <FileUp className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.file.name}</p>
                <p className="text-xs text-muted-foreground">{formatSize(item.file.size)}</p>
              </div>
              {item.status === 'queued' && (
                <button onClick={(e) => { e.stopPropagation(); removeFile(i); }} className="text-muted-foreground hover:text-destructive">
                  <X className="h-4 w-4" />
                </button>
              )}
              {item.status === 'uploading' && <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />}
              {item.status === 'done' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
              {item.status === 'error' && <AlertCircle className="h-4 w-4 text-destructive" />}
            </div>
          ))}
          {uploadedFiles.some(f => f.status === 'queued') && (
            <Button onClick={handleUpload} className="w-full" size="sm">
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              Upload {uploadedFiles.filter(f => f.status === 'queued').length} file(s)
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
