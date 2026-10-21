export interface DramaParseRequest {
  shareUrl: string;
}

export interface DramaEpisode {
  index: number;
  title: string;
  episodeId: string;
  duration?: string;
  cover?: string;
}

export interface DramaInfo {
  title: string;
  cover: string;
  description: string;
  totalEpisodes: number;
  episodes: DramaEpisode[];
  dramaId: string;
}

export interface DramaParseResponse {
  drama: DramaInfo;
}

export interface EpisodeParseRequest {
  dramaId: string;
  episodeId: string;
  shareUrl?: string;
}

export interface EpisodeVideoInfo {
  videoUrl: string;
  format: 'mp4' | 'm3u8';
  title: string;
  duration?: number;
}

export interface EpisodeParseResponse {
  video: EpisodeVideoInfo;
}

export interface BatchDownloadItem {
  index: number;
  title: string;
  status: 'pending' | 'downloading' | 'done' | 'error';
  progress?: number;
  errorMsg?: string;
}
