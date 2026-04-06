import { Badge } from '@/components/ui/badge';
import { ProjectStatus, DocumentStatus } from '@/types';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const statusConfig: Record<string, { label: string; colors: string; dotColor: string }> = {
  idle: { label: 'Idle', colors: 'bg-secondary/50 text-muted-foreground border-border/30', dotColor: 'bg-muted-foreground' },
  processing: { label: 'Processing', colors: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30', dotColor: 'bg-yellow-400' },
  ready: { label: 'Ready', colors: 'bg-green-500/15 text-green-400 border-green-500/30', dotColor: 'bg-green-400' },
  failed: { label: 'Failed', colors: 'bg-red-500/15 text-red-400 border-red-500/30', dotColor: 'bg-red-400' },
  queued: { label: 'Queued', colors: 'bg-secondary/50 text-muted-foreground border-border/30', dotColor: 'bg-muted-foreground' },
  uploading: { label: 'Uploading', colors: 'bg-blue-500/15 text-blue-400 border-blue-500/30', dotColor: 'bg-blue-400' },
  completed: { label: 'Completed', colors: 'bg-green-500/15 text-green-400 border-green-500/30', dotColor: 'bg-green-400' },
  pending: { label: 'Pending', colors: 'bg-secondary/50 text-muted-foreground border-border/30', dotColor: 'bg-muted-foreground' },
  running: { label: 'Running', colors: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30', dotColor: 'bg-yellow-400' },
};

export function StatusBadge({ status }: { status: ProjectStatus | DocumentStatus | string }) {
  const config = statusConfig[status] || { label: status, colors: 'bg-secondary/50 text-muted-foreground border-border/30', dotColor: 'bg-muted-foreground' };
  return (
    <motion.div
      initial={{ scale: 0.9 }}
      animate={{ scale: 1 }}
      className="inline-flex"
    >
      <Badge variant="outline" className={cn('text-xs font-medium capitalize px-2.5 py-0.5 rounded-full flex items-center gap-1.5', config.colors)}>
        {status === 'running' || status === 'processing' || status === 'uploading' ? (
          <motion.span
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className={`h-1.5 w-1.5 rounded-full ${config.dotColor}`}
          />
        ) : (
          status !== 'idle' && status !== 'queued' && status !== 'pending' && status !== 'failed' && (
            <span className={`h-1.5 w-1.5 rounded-full ${config.dotColor}`} />
          )
        )}
        {config.label}
      </Badge>
    </motion.div>
  );
}
