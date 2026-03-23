import { Badge } from '@/components/ui/badge';
import { ProjectStatus, DocumentStatus } from '@/types';
import { cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; className: string }> = {
  idle: { label: 'Idle', className: 'bg-muted text-muted-foreground' },
  processing: { label: 'Processing', className: 'bg-warning/15 text-warning border-warning/30' },
  ready: { label: 'Ready', className: 'bg-success/15 text-success border-success/30' },
  failed: { label: 'Failed', className: 'bg-destructive/15 text-destructive border-destructive/30' },
  queued: { label: 'Queued', className: 'bg-muted text-muted-foreground' },
  uploading: { label: 'Uploading', className: 'bg-info/15 text-info border-info/30' },
  completed: { label: 'Completed', className: 'bg-success/15 text-success border-success/30' },
  pending: { label: 'Pending', className: 'bg-muted text-muted-foreground' },
  running: { label: 'Running', className: 'bg-warning/15 text-warning border-warning/30 animate-pulse-slow' },
};

export function StatusBadge({ status }: { status: ProjectStatus | DocumentStatus | string }) {
  const config = statusConfig[status] || { label: status, className: 'bg-muted text-muted-foreground' };
  return (
    <Badge variant="outline" className={cn('text-xs font-medium capitalize', config.className)}>
      {config.label}
    </Badge>
  );
}
