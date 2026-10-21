import { useState, useCallback, useRef } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@lark-apaas/client-toolkit/logger';

import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { Card } from '@client/src/components/ui/card';

import { dramaApi } from '@client/src/api';

import type {
  DramaInfo,
  DramaEpisode,
  EpisodeVideoInfo,
} from '@shared/api.interface';

import DramaDetailCard from './DramaDetailCard';
import EpisodeList from './EpisodeList';
import VideoPlayerModal from './VideoPlayerModal';
import BatchDownloadPanel from './BatchDownloadPanel';

interface ParsedEpisodeMap {
  [episodeId: string]: EpisodeVideoInfo;
}

type BatchStatus = 'idle' | 'running' | 'cancelled';

interface BatchItemState {
  index: number;
  title: string;
  episodeId: string;
  status: 'pending' | 'parsing' | 'downloading' | 'done' | 'error';
  errorMsg?: string;
}

const HomePage: React.FC = () => {
  const [shareUrl, setShareUrl] = useState<string>('');
  const [dramaInfo, setDramaInfo] = useState<DramaInfo | null>(null);
  const [parsing, setParsing] = useState<boolean>(false);
  const [parsedVideos, setParsedVideos] = useState<ParsedEpisodeMap>({});
  const [parsingEpisodeId, setParsingEpisodeId] = useState<string | null>(null);
  const [playerOpen, setPlayerOpen] = useState<boolean>(false);
  const [currentVideo, setCurrentVideo] = useState<EpisodeVideoInfo | null>(null);
  const [currentEpisodeTitle, setCurrentEpisodeTitle] = useState<string>('');
  const [batchStatus, setBatchStatus] = useState<BatchStatus>('idle');
  const [batchItems, setBatchItems] = useState<BatchItemState[]>([]);

  const batchAbortRef = useRef<boolean>(false);

  const handleParseDrama = useCallback(async () => {
    const url = shareUrl.trim();
    if (!url) {
      toast.warning('请输入分享链接');
      return;
    }

    setParsing(true);
    setDramaInfo(null);
    setParsedVideos({});

    try {
      const response = await dramaApi.parseDrama(url);
      setDramaInfo(response.drama);
      toast.success('解析成功');
    } catch (error: unknown) {
      logger.error('解析短剧失败', error);
      const msg =
        (error as { response?: { data?: { error?: { message?: string } } } })
          .response?.data?.error?.message ?? '解析失败，请检查链接是否正确';
      toast.error(msg);
    } finally {
      setParsing(false);
    }
  }, [shareUrl]);

  const handleParseEpisode = useCallback(
    async (episode: DramaEpisode) => {
      if (!dramaInfo) return;
      if (parsedVideos[episode.episodeId]) return;

      setParsingEpisodeId(episode.episodeId);
      try {
        const response = await dramaApi.parseEpisode(
          dramaInfo.dramaId,
          episode.episodeId,
          shareUrl,
        );
        setParsedVideos((prev) => ({
          ...prev,
          [episode.episodeId]: response.video,
        }));
      } catch (error: unknown) {
        logger.error('解析单集失败', error);
        const msg =
          (error as { response?: { data?: { error?: { message?: string } } } })
            .response?.data?.error?.message ?? '解析失败';
        toast.error(`第 ${episode.index} 集 ${msg}`);
      } finally {
        setParsingEpisodeId(null);
      }
    },
    [dramaInfo, parsedVideos, shareUrl],
  );

  const handlePlay = useCallback(
    (episode: DramaEpisode) => {
      const video = parsedVideos[episode.episodeId];
      if (video) {
        setCurrentVideo(video);
        setCurrentEpisodeTitle(`第 ${episode.index} 集 ${episode.title}`);
        setPlayerOpen(true);
      }
    },
    [parsedVideos],
  );

  const handleDownload = useCallback(
    (episode: DramaEpisode) => {
      const video = parsedVideos[episode.episodeId];
      if (!video || !dramaInfo) return;

      const filename = `${dramaInfo.title}_第${episode.index}集_${episode.title}.${video.format === 'm3u8' ? 'mp4' : video.format}`;
      const proxyUrl = dramaApi.getProxyUrl(video.videoUrl, filename);

      const link = document.createElement('a');
      link.href = proxyUrl;
      link.download = filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    [parsedVideos, dramaInfo],
  );

  const handleBatchDownload = useCallback(async () => {
    if (!dramaInfo || batchStatus === 'running') return;

    const items: BatchItemState[] = dramaInfo.episodes.map(
      (ep: DramaEpisode) => ({
        index: ep.index,
        title: ep.title,
        episodeId: ep.episodeId,
        status: 'pending',
      }),
    );
    setBatchItems(items);
    setBatchStatus('running');
    batchAbortRef.current = false;

    const concurrency = 2;
    let cursor = 0;
    let completedCount = 0;

    const processNext = async (): Promise<void> => {
      while (cursor < items.length && !batchAbortRef.current) {
        const idx = cursor;
        cursor += 1;
        const item = items[idx];

        setBatchItems((prev) => {
          const next = [...prev];
          next[idx] = { ...next[idx], status: 'parsing' };
          return next;
        });

        try {
          const response = await dramaApi.parseEpisode(
            dramaInfo.dramaId,
            item.episodeId,
            shareUrl,
          );

          setParsedVideos((prev) => ({
            ...prev,
            [item.episodeId]: response.video,
          }));

          setBatchItems((prev) => {
            const next = [...prev];
            next[idx] = { ...next[idx], status: 'downloading' };
            return next;
          });

          const filename = `${dramaInfo.title}_第${item.index}集_${item.title}.${response.video.format === 'm3u8' ? 'mp4' : response.video.format}`;
          const proxyUrl = dramaApi.getProxyUrl(
            response.video.videoUrl,
            filename,
          );

          const link = document.createElement('a');
          link.href = proxyUrl;
          link.download = filename;
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          await new Promise((resolve: (v: void) => void) =>
            setTimeout(resolve, 300),
          );

          completedCount += 1;
          setBatchItems((prev) => {
            const next = [...prev];
            next[idx] = { ...next[idx], status: 'done' };
            return next;
          });
        } catch (error: unknown) {
          logger.error('批量下载单集失败', error);
          const msg =
            (
              error as {
                response?: { data?: { error?: { message?: string } } };
              }
            ).response?.data?.error?.message ?? '下载失败';
          setBatchItems((prev) => {
            const next = [...prev];
            next[idx] = { ...next[idx], status: 'error', errorMsg: msg };
            return next;
          });
        }
      }
    };

    const workers: Promise<void>[] = [];
    for (let i = 0; i < concurrency; i += 1) {
      workers.push(processNext());
    }
    await Promise.all(workers);

    if (batchAbortRef.current) {
      setBatchStatus('cancelled');
    } else {
      setBatchStatus('idle');
      toast.success(`批量下载完成，成功 ${completedCount} / ${items.length}`);
    }
  }, [dramaInfo, batchStatus, shareUrl, batchItems]);

  const handleCancelBatch = useCallback(() => {
    batchAbortRef.current = true;
    setBatchStatus('cancelled');
  }, []);

  const handleCloseBatchPanel = useCallback(() => {
    setBatchItems([]);
    setBatchStatus('idle');
  }, []);

  const doneCount = batchItems.filter(
    (item: BatchItemState) => item.status === 'done',
  ).length;
  const batchProgress =
    batchItems.length > 0 ? (doneCount / batchItems.length) * 100 : 0;

  const showBatchPanel = batchStatus === 'running' || batchStatus === 'cancelled';

  return (
    <div className="min-h-screen bg-background pb-12">
      <div className="max-w-4xl mx-auto px-4 md:px-6 pt-8 md:pt-12 pb-6">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium uppercase tracking-widest mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            Hongguo Drama Downloader
          </div>
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-3">
            红果短剧解析下载工具
          </h1>
          <p className="text-base text-muted-foreground">
            粘贴分享链接，一键解析下载
          </p>
        </div>

        <Card className="p-4 md:p-6 mb-8 border-transparent hover:border-gray-100 transition-all duration-300 hover:-translate-y-0.5">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              type="text"
              placeholder="请粘贴红果短剧分享链接..."
              value={shareUrl}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setShareUrl(e.target.value)
              }
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Enter') handleParseDrama();
              }}
              className="h-12 text-base flex-1"
            />
            <Button
              onClick={handleParseDrama}
              disabled={parsing}
              className="h-12 px-4 sm:px-6 sm:min-w-[120px] justify-center"
            >
              {parsing ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span className="hidden sm:inline ml-2">解析中</span>
                </>
              ) : (
                <>
                  <Search className="size-4" />
                  <span className="hidden sm:inline ml-2">解析</span>
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            支持 hongguoduanju.com、hg.snssdk.com 等分享链接
          </p>
        </Card>

        {showBatchPanel && (
          <BatchDownloadPanel
            items={batchItems}
            progress={batchProgress}
            doneCount={doneCount}
            totalCount={batchItems.length}
            isRunning={batchStatus === 'running'}
            onCancel={handleCancelBatch}
            onClose={handleCloseBatchPanel}
          />
        )}

        {dramaInfo && (
          <>
            <DramaDetailCard
              drama={dramaInfo}
              onBatchDownload={handleBatchDownload}
              batchDisabled={batchStatus === 'running'}
            />
            <div className="mt-6">
              <EpisodeList
                episodes={dramaInfo.episodes}
                parsedVideos={parsedVideos}
                parsingEpisodeId={parsingEpisodeId}
                onParseEpisode={handleParseEpisode}
                onPlay={handlePlay}
                onDownload={handleDownload}
              />
            </div>
          </>
        )}
      </div>

      <VideoPlayerModal
        open={playerOpen}
        onOpenChange={setPlayerOpen}
        video={currentVideo}
        title={currentEpisodeTitle}
        onDownload={() => {
          if (!dramaInfo || !currentVideo) return;
          const episode = dramaInfo.episodes.find(
            (ep: DramaEpisode) =>
              parsedVideos[ep.episodeId]?.videoUrl === currentVideo.videoUrl,
          );
          if (!episode) return;
          handleDownload(episode);
        }}
      />
    </div>
  );
};

export default HomePage;
