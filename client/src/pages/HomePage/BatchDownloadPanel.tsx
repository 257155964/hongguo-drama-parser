import {
  Download,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';

import { Button } from '@client/src/components/ui/button';
import { Card } from '@client/src/components/ui/card';
import { Progress } from '@client/src/components/ui/progress';
import { ScrollArea } from '@client/src/components/ui/scroll-area';

interface BatchItemState {
  index: number;
  title: string;
  status: 'pending' | 'parsing' | 'downloading' | 'done' | 'error';
  errorMsg?: string;
}

interface BatchDownloadPanelProps {
  items: BatchItemState[];
  progress: number;
  doneCount: number;
  totalCount: number;
  isRunning: boolean;
  onCancel: () => void;
  onClose: () => void;
}

const statusConfig: Record<
  BatchItemState['status'],
  { label: string; icon: React.ReactNode; color: string }
> = {
  pending: {
    label: '等待中',
    icon: <Clock className="size-3.5" />,
    color: 'text-muted-foreground',
  },
  parsing: {
    label: '解析中',
    icon: <Loader2 className="size-3.5 animate-spin" />,
    color: 'text-primary',
  },
  downloading: {
    label: '下载中',
    icon: <Download className="size-3.5" />,
    color: 'text-primary',
  },
  done: {
    label: '完成',
    icon: <CheckCircle2 className="size-3.5" />,
    color: 'text-primary',
  },
  error: {
    label: '失败',
    icon: <AlertCircle className="size-3.5" />,
    color: 'text-destructive',
  },
};

const BatchDownloadPanel: React.FC<BatchDownloadPanelProps> = ({
  items,
  progress,
  doneCount,
  totalCount,
  isRunning,
  onCancel,
  onClose,
}) => {
  return (
    <Card className="mb-6 border-primary/30 border-transparent hover:border-gray-100">
      <div className="px-6 py-4 border-b border-border/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Download className="size-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm">
              批量下载
            </h3>
            <p className="text-xs text-muted-foreground font-mono tabular-nums">
              {doneCount} / {totalCount} 已完成
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isRunning ? (
            <Button size="sm" variant="outline" onClick={onCancel}>
              取消下载
            </Button>
          ) : (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={onClose}
              aria-label="关闭批量下载面板"
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="px-6 py-3">
        <Progress value={progress} className="h-1.5" />
      </div>

      <ScrollArea className="max-h-60">
        <div className="px-4 pb-2 space-y-1">
          {items.map((item: BatchItemState, idx: number) => {
            const cfg = statusConfig[item.status];
            return (
              <div
                key={idx}
                className="flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-muted/30"
              >
                <span className="w-8 text-xs font-mono text-muted-foreground tabular-nums text-center flex-shrink-0">
                  {String(item.index).padStart(2, '0')}
                </span>
                <span className="flex-1 text-sm text-foreground truncate">
                  {item.title}
                </span>
                <span
                  className={`flex items-center gap-1 text-xs font-medium flex-shrink-0 ${cfg.color}`}
                >
                  {cfg.icon}
                  {cfg.label}
                </span>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </Card>
  );
};

export default BatchDownloadPanel;
