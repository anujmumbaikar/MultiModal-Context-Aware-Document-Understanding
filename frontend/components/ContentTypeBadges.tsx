import { FileText, ImageIcon, Table2, BarChart3, ScanLine } from 'lucide-react';
import { ContentType } from '@/types';
import { cn } from '@/lib/utils';

const contentTypeIcons: Record<ContentType, { icon: typeof FileText; label: string }> = {
  text: { icon: FileText, label: 'Text' },
  table: { icon: Table2, label: 'Table' },
  image: { icon: ImageIcon, label: 'Image' },
  chart: { icon: BarChart3, label: 'Chart' },
  ocr: { icon: ScanLine, label: 'OCR' },
};

export function ContentTypeBadges({ types, className }: { types: ContentType[]; className?: string }) {
  return (
    <div className={cn('flex gap-1.5 flex-wrap', className)}>
      {types.map(type => {
        const { icon: Icon, label } = contentTypeIcons[type];
        return (
          <span key={type} className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
            <Icon className="h-3 w-3" />
            {label}
          </span>
        );
      })}
    </div>
  );
}
