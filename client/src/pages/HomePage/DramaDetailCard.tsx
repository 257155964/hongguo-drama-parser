import { Download, Film } from 'lucide-react';

import { Button } from '@client/src/components/ui/button';
import { Card } from '@client/src/components/ui/card';

import type { DramaInfo } from '@shared/api.interface';
import { Image } from '@client/src/components/ui/image';

interface DramaDetailCardProps {
  drama: DramaInfo;
  onBatchDownload: () => void;
  batchDisabled?: boolean;
}

const DramaDetailCard: React.FC<DramaDetailCardProps> = ({
  drama,
  onBatchDownload,
  batchDisabled = false,
}) => {
  return (
    <Card className="overflow-hidden border-transparent hover:border-gray-100 transition-all duration-300 hover:-translate-y-0.5">
      <div className="flex flex-col sm:flex-row gap-6 p-6">
        <div className="flex-shrink-0 w-full sm:w-40">
          <div className="aspect-[3/4] rounded-lg overflow-hidden bg-muted relative">
            {drama.cover ? (
              <Image
                src={drama.cover}
                alt={drama.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <Film className="size-10" />
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-start justify-between gap-4 mb-2">
            <h2 className="text-2xl font-bold text-foreground tracking-tight truncate">
              {drama.title}
            </h2>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-mono font-medium bg-primary/10 text-primary">
              共 {drama.totalEpisodes} 集
            </span>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-4 flex-1">
            {drama.description || '暂无简介'}
          </p>

          <div className="flex gap-3">
            <Button onClick={onBatchDownload} disabled={batchDisabled}>
              <Download className="size-4" />
              批量下载
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default DramaDetailCard;
