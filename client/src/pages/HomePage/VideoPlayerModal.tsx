import { useEffect, useRef, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';

import { Button } from '@client/src/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@client/src/components/ui/dialog';

import type { EpisodeVideoInfo } from '@shared/api.interface';

interface VideoPlayerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  video: EpisodeVideoInfo | null;
  title: string;
  onDownload: () => void;
}

declare global {
  interface Window {
    Hls?: new (config?: Record<string, unknown>) => {
      loadSource: (url: string) => void;
      attachMedia: (video: HTMLVideoElement) => void;
      destroy: () => void;
      on: (event: string, callback: () => void) => void;
    };
  }
}

const HLS_CDN_URL =
  'https://cdn.jsdelivr.net/npm/hls.js@1.5.13/dist/hls.min.js';

function loadHls(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.Hls) return Promise.resolve(true);

  return new Promise((resolve: (v: boolean) => void) => {
    const existing = document.querySelector(
      `script[src="${HLS_CDN_URL}"]`,
    ) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.src = HLS_CDN_URL;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  open,
  onOpenChange,
  video,
  title,
  onDownload,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsInstanceRef = useRef<{ destroy: () => void } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!open || !video || !videoRef.current) return;

    const videoEl = videoRef.current;
    setLoading(true);

    const setupPlayer = async (): Promise<void> => {
      if (hlsInstanceRef.current) {
        hlsInstanceRef.current.destroy();
        hlsInstanceRef.current = null;
      }

      const videoUrl = video.videoUrl;
      const isM3u8 = video.format === 'm3u8' || videoUrl.endsWith('.m3u8');

      if (isM3u8) {
        const canNativePlay =
          videoEl.canPlayType('application/vnd.apple.mpegurl') !== '';

        if (canNativePlay) {
          videoEl.src = videoUrl;
          setLoading(false);
        } else {
          const hlsLoaded = await loadHls();
          if (hlsLoaded && window.Hls) {
            const HlsClass = window.Hls;
            const hls = new HlsClass();
            hlsInstanceRef.current = hls;
            hls.loadSource(videoUrl);
            hls.attachMedia(videoEl);
            hls.on('MANIFEST_PARSED', () => {
              setLoading(false);
              videoEl.play().catch(() => {});
            });
          } else {
            logger.error('hls.js 加载失败');
            setLoading(false);
          }
        }
      } else {
        videoEl.src = videoUrl;
        setLoading(false);
      }
    };

    setupPlayer().catch((err: unknown) => {
      logger.error('播放器初始化失败', err);
      setLoading(false);
    });

    return () => {
      if (hlsInstanceRef.current) {
        hlsInstanceRef.current.destroy();
        hlsInstanceRef.current = null;
      }
      if (videoEl) {
        videoEl.pause();
        videoEl.removeAttribute('src');
        videoEl.load();
      }
    };
  }, [open, video]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-border/60">
          <DialogTitle className="text-base font-semibold">
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="relative bg-black aspect-video w-full">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <Loader2 className="size-8 text-primary animate-spin" />
            </div>
          )}
          <video
            ref={videoRef}
            controls
            playsInline
            className="w-full h-full"
          />
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border/60">
          <Button onClick={onDownload}>
            <Download className="size-4" />
            下载视频
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VideoPlayerModal;
