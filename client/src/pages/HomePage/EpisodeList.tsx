import { Play, Download, Loader2, Link2 } from 'lucide-react';

import { Button } from '@client/src/components/ui/button';
import { Card } from '@client/src/components/ui/card';
import { ScrollArea } from '@client/src/components/ui/scroll-area';

import type { DramaEpisode, EpisodeVideoInfo } from '@shared/api.interface';

interface EpisodeListProps {
  episodes: DramaEpisode[];
  parsedVideos: Record<string, EpisodeVideoInfo>;
  parsingEpisodeId: string | null;
  onParseEpisode: (episode: DramaEpisode) => void;
  onPlay: (episode: DramaEpisode) => void;
  onDownload: (episode: DramaEpisode) => void;
}

const EpisodeList: React.FC<EpisodeListProps> = ({
  episodes,
  parsedVideos,
  parsingEpisodeId,
  onParseEpisode,
  onPlay,
  onDownload,
}) => {
  return (
    <Card className="border-transparent hover:border-gray-100 transition-all duration-300">
      <div className="px-6 py-4 border-b border-border/60 flex items-center justify-between">
        <h3 className="font-semibold text-foreground">剧集列表</h3>
        <span className="text-xs text-muted-foreground font-mono tabular-nums">
          {episodes.length} 集
        </span>
      </div>

      <ScrollArea className="max-h-[500px]">
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {episodes.map((episode: DramaEpisode) => {
            const parsed = parsedVideos[episode.episodeId];
            const isParsing = parsingEpisodeId === episode.episodeId;

            return (
              <div
                key={episode.episodeId}
                className="flex items-center gap-3 p-3 rounded-lg border border-transparent hover:border-border hover:bg-muted/30 transition-all duration-200 group"
              >
                <div className="flex-shrink-0 w-12 h-8 rounded bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-mono font-bold text-primary tabular-nums">
                    {String(episode.index).padStart(2, '0')}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate font-medium">
                    {episode.title}
                  </p>
                </div>

                <div className="flex-shrink-0">
                  {parsed ? (
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => onPlay(episode)}
                        aria-label={`播放第 ${episode.index} 集`}
                      >
                        <Play className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => onDownload(episode)}
                        aria-label={`下载第 ${episode.index} 集`}
                      >
                        <Download className="size-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8"
                      onClick={() => onParseEpisode(episode)}
                      disabled={isParsing}
                    >
                      {isParsing ? (
                        <>
                          <Loader2 className="size-3 animate-spin" />
                          解析中
                        </>
                      ) : (
                        <>
                          <Link2 className="size-3" />
                          解析
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </Card>
  );
};

export default EpisodeList;
