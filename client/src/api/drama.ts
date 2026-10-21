import { logger } from '@lark-apaas/client-toolkit/logger';
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';

import type {
  DramaParseRequest,
  DramaParseResponse,
  EpisodeParseRequest,
  EpisodeParseResponse,
} from '@shared/api.interface';

export async function parseDrama(shareUrl: string): Promise<DramaParseResponse> {
  const body: DramaParseRequest = { shareUrl };
  const response = await axiosForBackend.post('/api/drama/parse', body);
  return response.data;
}

export async function parseEpisode(
  dramaId: string,
  episodeId: string,
  shareUrl?: string,
): Promise<EpisodeParseResponse> {
  const body: EpisodeParseRequest = { dramaId, episodeId, shareUrl };
  const response = await axiosForBackend.post('/api/drama/episode', body);
  return response.data;
}

export function getProxyUrl(videoUrl: string, filename: string): string {
  const params = new URLSearchParams({ url: videoUrl, filename });
  return `/api/drama/proxy?${params.toString()}`;
}
