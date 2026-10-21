import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import type { Response } from 'express';
import type {
  DramaInfo,
  DramaEpisode,
  EpisodeVideoInfo,
} from '@shared/api.interface';

const USER_AGENT =
  'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';
const REQUEST_TIMEOUT = 15000;

@Injectable()
export class DramaParserService {
  private readonly logger = new Logger(DramaParserService.name);

  constructor(private readonly httpService: HttpService) {}

  async parseShareUrl(shareUrl: string): Promise<DramaInfo> {
    try {
      const normalizedUrl = this.normalizeUrl(shareUrl);
      const html = await this.fetchHtml(normalizedUrl);
      const finalUrl = normalizedUrl;

      const seriesData = this.extractSeriesData(html);
      if (seriesData) {
        const drama = this.parseFromSeriesData(seriesData, finalUrl);
        if (drama) return drama;
      }

      const embedded = this.extractInitialState(html);
      if (embedded) {
        const dramaId = this.extractDramaId(finalUrl, html);
        const drama = this.parseFromEmbeddedData(embedded, dramaId, finalUrl);
        if (drama) return drama;
      }

      const dramaId = this.extractDramaId(finalUrl, html);
      const fallback = this.parseFromHtmlMeta(html, dramaId, finalUrl);
      return fallback;
    } catch (error) {
      this.logger.error(
        '解析短剧分享链接失败',
        error instanceof Error ? error.message : String(error),
      );
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('解析失败，请检查链接是否正确');
    }
  }

  async parseEpisode(
    dramaId: string,
    episodeId: string,
    shareUrl?: string,
  ): Promise<EpisodeVideoInfo> {
    try {
      const episodePageUrl =
        shareUrl || this.buildEpisodeUrl(dramaId, episodeId);
      const html = await this.fetchHtml(episodePageUrl);

      const seriesData = this.extractSeriesData(html);
      if (seriesData) {
        const video = this.extractVideoFromSeriesData(seriesData);
        if (video) return video;
      }

      const embedded = this.extractInitialState(html);
      if (embedded) {
        const video = this.extractVideoFromEmbedded(embedded, episodeId);
        if (video) return video;
      }

      const videoUrl = this.extractVideoUrlFromHtml(html);
      if (videoUrl) {
        const format = videoUrl.includes('.m3u8') ? 'm3u8' : 'mp4';
        return {
          videoUrl,
          format,
          title: `第${episodeId}集`,
        };
      }

      throw new BadRequestException('该链接暂不支持直接解析视频地址');
    } catch (error) {
      this.logger.error(
        '解析单集视频地址失败',
        error instanceof Error ? error.message : String(error),
      );
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('解析视频地址失败，请稍后重试');
    }
  }

  async proxyVideo(url: string, filename: string, res: Response): Promise<void> {
    if (!/^https?:\/\//i.test(url)) {
      throw new BadRequestException('无效的视频地址协议');
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          responseType: 'stream',
          timeout: REQUEST_TIMEOUT,
          headers: { 'User-Agent': USER_AGENT },
        }),
      );

      const contentType =
        (response.headers['content-type'] as string) || 'video/mp4';
      const contentLength = response.headers['content-length'] as
        | string
        | undefined;

      res.setHeader('Content-Type', contentType);
      if (contentLength) {
        res.setHeader('Content-Length', contentLength);
      }
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(filename)}"`,
      );
      res.setHeader('Accept-Ranges', 'bytes');

      response.data.pipe(res);
    } catch (error) {
      this.logger.error(
        '代理视频流失败',
        error instanceof Error ? error.message : String(error),
      );
      throw new BadRequestException('视频代理失败');
    }
  }

  private normalizeUrl(rawUrl: string): string {
    let url = rawUrl.trim();
    const urlMatch = url.match(/https?:\/\/[^\s]+/i);
    if (urlMatch) {
      url = urlMatch[0];
    }
    if (!/^https?:\/\//i.test(url)) {
      throw new BadRequestException('请输入有效的分享链接');
    }
    return url;
  }

  private async fetchHtml(url: string): Promise<string> {
    const response = await firstValueFrom(
      this.httpService.get(url, {
        timeout: REQUEST_TIMEOUT,
        maxRedirects: 10,
        headers: {
          'User-Agent': USER_AGENT,
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        },
      }),
    );
    return response.data;
  }

  private extractDramaId(shareUrl: string, html: string): string {
    const patterns = [
      /drama[/_-]([a-zA-Z0-9]+)/i,
      /[?&]id=([a-zA-Z0-9]+)/i,
      /hongguoduanju.*?[?&]id=([a-zA-Z0-9]+)/i,
      /hg\.snssdk\.com\/[^?]*[?&].*?id=?([a-zA-Z0-9]{6,})/i,
      /novelquickapp\.com\/s\/([a-zA-Z0-9_-]+)/i,
      /[?&]vid=([a-zA-Z0-9]+)/i,
      /[?&]video_id=([a-zA-Z0-9]+)/i,
    ];

    for (const pattern of patterns) {
      const match = shareUrl.match(pattern);
      if (match && match[1]) return match[1];
    }

    const htmlMatch = html.match(/dramaId["'\s:]+["']([^"']+)["']/i);
    if (htmlMatch && htmlMatch[1]) return htmlMatch[1];

    const seriesIdMatch = html.match(/series_id["'\s:]+["']([^"']+)["']/i);
    if (seriesIdMatch && seriesIdMatch[1]) return seriesIdMatch[1];

    try {
      const urlObj = new URL(shareUrl);
      const vid = urlObj.searchParams.get('vid');
      if (vid) return vid;
      const videoId = urlObj.searchParams.get('video_id');
      if (videoId) return videoId;
    } catch {
      // ignore
    }

    const urlObj = new URL(shareUrl);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    if (pathParts.length > 0) {
      const lastPart = pathParts[pathParts.length - 1];
      if (lastPart.length >= 4) return lastPart;
    }

    return `drama_${Date.now()}`;
  }

  private extractSeriesData(html: string): Record<string, unknown> | null {
    const patterns = [
      /series_data(?:&quot;|"|:)*[:=]\s*(&quot;|"|\{)/,
      /"series_data"\s*:\s*(\{[\s\S]*?\})\s*[,}]/,
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (!match) continue;

      const startIdx = match.index ?? 0;
      const chunk = html.slice(startIdx, startIdx + 10000);
      const decoded = chunk.replace(/&quot;/g, '"').replace(/&amp;/g, '&');

      const braceStart = decoded.indexOf('{');
      if (braceStart < 0) continue;

      let depth = 0;
      let endIdx = braceStart;
      let inString = false;
      let escapeNext = false;

      for (let i = braceStart; i < decoded.length; i += 1) {
        const ch = decoded[i];
        if (escapeNext) {
          escapeNext = false;
          continue;
        }
        if (ch === '\\') {
          escapeNext = true;
          continue;
        }
        if (ch === '"') {
          inString = !inString;
          continue;
        }
        if (inString) continue;
        if (ch === '{') depth += 1;
        else if (ch === '}') {
          depth -= 1;
          if (depth === 0) {
            endIdx = i + 1;
            break;
          }
        }
      }

      if (depth !== 0) continue;

      const jsonStr = decoded.slice(braceStart, endIdx);
      try {
        const parsed = JSON.parse(jsonStr) as Record<string, unknown>;
        if (parsed.title && typeof parsed.title === 'string') {
          return parsed;
        }
      } catch {
        continue;
      }
    }

    return null;
  }

  private parseFromSeriesData(
    data: Record<string, unknown>,
    finalUrl: string,
  ): DramaInfo | null {
    const title = data.title as string;
    if (!title || typeof title !== 'string') return null;

    const cover =
      (data.series_cover as string) ||
      (data.cover as string) ||
      (data.cover_url as string) ||
      '';

    const description =
      (data.series_intro as string) ||
      (data.intro as string) ||
      (data.description as string) ||
      '';

    const serialCount =
      (data.serial_count as number) ||
      (data.total_episodes as number) ||
      (data.episode_count as number) ||
      (data.episodeCount as number) ||
      0;

    const playUrl =
      (data.play_url as string) ||
      (data.playUrl as string) ||
      (data.video_url as string) ||
      '';

    const dramaId =
      (data.series_id as string) ||
      (data.id as string) ||
      this.extractDramaId(finalUrl, '');

    const episodes: DramaEpisode[] = [];
    const itemList = data.item_list as unknown[] | undefined;
    if (Array.isArray(itemList) && itemList.length > 0) {
      itemList.forEach((item: unknown, idx: number) => {
        if (!item || typeof item !== 'object') return;
        const ep = item as Record<string, unknown>;
        const epId =
          (ep.episode_id as string) ||
          (ep.episodeId as string) ||
          (ep.id as string) ||
          (ep.vid as string) ||
          String(idx + 1);
        const epTitle =
          (ep.title as string) ||
          (ep.episode_title as string) ||
          `第${idx + 1}集`;
        const index =
          (ep.index as number) ||
          (ep.episode_index as number) ||
          idx + 1;
        episodes.push({
          index,
          title: epTitle,
          episodeId: epId,
          cover:
            typeof ep.cover === 'string'
              ? ep.cover
              : typeof ep.cover_url === 'string'
                ? ep.cover_url
                : undefined,
        });
      });
    }

    if (episodes.length === 0 && serialCount > 0) {
      for (let i = 1; i <= serialCount; i += 1) {
        episodes.push({
          index: i,
          title: `第${i}集`,
          episodeId: `${dramaId}_${i}`,
        });
      }
    }

    if (episodes.length === 0 && playUrl) {
      episodes.push({
        index: 1,
        title: '第1集',
        episodeId: dramaId,
      });
    }

    const totalEpisodes =
      episodes.length > 0
        ? Math.max(episodes.length, serialCount)
        : serialCount || 1;

    return {
      title,
      cover,
      description,
      totalEpisodes,
      episodes: episodes.length > 0 ? episodes : [],
      dramaId,
    };
  }

  private extractVideoFromSeriesData(
    data: Record<string, unknown>,
  ): EpisodeVideoInfo | null {
    const playUrl =
      (data.play_url as string) ||
      (data.playUrl as string) ||
      (data.video_url as string) ||
      (data.videoUrl as string) ||
      '';

    if (!playUrl || typeof playUrl !== 'string') return null;
    if (!playUrl.startsWith('http')) return null;

    const format = playUrl.includes('.m3u8') ? 'm3u8' : 'mp4';
    const title = (data.title as string) || '视频';

    return {
      videoUrl: playUrl,
      format,
      title,
    };
  }

  private extractInitialState(html: string): unknown | null {
    const patterns = [
      /window\.__INITIAL_STATE__\s*=\s*(\{.*?\});?\s*<\/script>/s,
      /window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\});?\s*(?:<\/script>|$)/i,
      /window\.initialState\s*=\s*(\{[\s\S]*?\});/i,
      /window\.__NEXT_DATA__\s*=\s*(\{[\s\S]*?\});/i,
      /<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i,
      /window\._SSR_DATA\s*=\s*(\{[\s\S]*?\});/i,
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        try {
          return JSON.parse(match[1].trim());
        } catch {
          continue;
        }
      }
    }

    return null;
  }

  private parseFromEmbeddedData(
    data: unknown,
    dramaId: string,
    shareUrl: string,
  ): DramaInfo | null {
    if (!data || typeof data !== 'object') return null;

    const obj = data as Record<string, unknown>;
    const candidates: unknown[] = [];

    const collectCandidates = (val: unknown): void => {
      if (!val || typeof val !== 'object') return;
      candidates.push(val);
      const v = val as Record<string, unknown>;
      for (const key of Object.keys(v)) {
        const child = v[key];
        if (child && typeof child === 'object') {
          if (Array.isArray(child)) {
            child.forEach(item => collectCandidates(item));
          } else {
            collectCandidates(child);
          }
        }
      }
    };
    collectCandidates(obj);

    for (const candidate of candidates) {
      const c = candidate as Record<string, unknown>;
      const hasTitle =
        typeof c.title === 'string' && c.title.length > 0;
      const hasCover =
        typeof c.cover === 'string' ||
        typeof c.coverUrl === 'string' ||
        typeof c.cover_image === 'string' ||
        typeof c.series_cover === 'string';
      const hasEpisodes =
        Array.isArray(c.episodes) ||
        Array.isArray(c.episodeList) ||
        Array.isArray(c.episode_list) ||
        Array.isArray(c.item_list);
      const hasTotal =
        typeof c.totalEpisodes === 'number' ||
        typeof c.total_episodes === 'number' ||
        typeof c.episodeCount === 'number' ||
        typeof c.serial_count === 'number';

      if (hasTitle && (hasCover || hasEpisodes || hasTotal)) {
        return this.buildDramaInfoFromObject(c, dramaId, shareUrl);
      }
    }

    return null;
  }

  private buildDramaInfoFromObject(
    obj: Record<string, unknown>,
    dramaId: string,
    shareUrl: string,
  ): DramaInfo {
    const title = (obj.title as string) || '未知短剧';
    const cover =
      (obj.cover as string) ||
      (obj.coverUrl as string) ||
      (obj.cover_image as string) ||
      (obj.series_cover as string) ||
      '';
    const description =
      (obj.description as string) ||
      (obj.desc as string) ||
      (obj.introduction as string) ||
      (obj.series_intro as string) ||
      '';

    const episodesRaw =
      (obj.episodes as unknown[]) ||
      (obj.episodeList as unknown[]) ||
      (obj.episode_list as unknown[]) ||
      (obj.item_list as unknown[]) ||
      [];

    const episodes: DramaEpisode[] = episodesRaw
      .map((ep: unknown, idx: number): DramaEpisode | null => {
        if (!ep || typeof ep !== 'object') return null;
        const e = ep as Record<string, unknown>;
        const epId =
          (e.episodeId as string) ||
          (e.episode_id as string) ||
          (e.id as string) ||
          (e.vid as string) ||
          String(idx + 1);
        const epTitle =
          (e.title as string) ||
          (e.episodeTitle as string) ||
          `第${idx + 1}集`;
        const epIndex =
          typeof e.index === 'number'
            ? e.index
            : typeof e.episode_index === 'number'
              ? e.episode_index
              : typeof e.sort === 'number'
                ? e.sort
                : idx + 1;
        return {
          index: epIndex,
          title: epTitle,
          episodeId: epId,
          duration:
            typeof e.duration === 'string' ? e.duration : undefined,
          cover:
            typeof e.cover === 'string'
              ? e.cover
              : typeof e.coverUrl === 'string'
                ? e.coverUrl
                : typeof e.cover_url === 'string'
                  ? e.cover_url
                  : undefined,
        };
      })
      .filter((ep): ep is DramaEpisode => ep !== null);

    const totalEpisodes =
      (typeof obj.totalEpisodes === 'number'
        ? obj.totalEpisodes
        : typeof obj.total_episodes === 'number'
          ? obj.total_episodes
          : typeof obj.episodeCount === 'number'
            ? obj.episodeCount
            : typeof obj.serial_count === 'number'
              ? obj.serial_count
              : episodes.length) || episodes.length || 0;

    return {
      title,
      cover,
      description,
      totalEpisodes,
      episodes,
      dramaId: obj.dramaId ? String(obj.dramaId) : dramaId,
    };
  }

  private parseFromHtmlMeta(
    html: string,
    dramaId: string,
    shareUrl: string,
  ): DramaInfo {
    const title =
      this.extractMetaContent(html, 'og:title') ||
      this.extractMetaContent(html, 'title') ||
      this.extractTagContent(html, 'title') ||
      '红果短剧';

    const cover =
      this.extractMetaContent(html, 'og:image') ||
      this.extractMetaContent(html, 'image') ||
      '';

    const description =
      this.extractMetaContent(html, 'og:description') ||
      this.extractMetaContent(html, 'description') ||
      '';

    const totalEpisodes = this.extractTotalEpisodes(html);
    const episodes = this.buildMockEpisodes(dramaId, totalEpisodes);

    return {
      title: title.trim(),
      cover,
      description: description.trim(),
      totalEpisodes,
      episodes,
      dramaId,
    };
  }

  private extractMetaContent(html: string, name: string): string {
    const patterns = [
      new RegExp(
        `<meta[^>]+(?:property|name)=["']${name}["'][^>]+content=["']([^"']*)["']`,
        'i',
      ),
      new RegExp(
        `<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${name}["']`,
        'i',
      ),
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1]) return match[1];
    }

    return '';
  }

  private extractTagContent(html: string, tag: string): string {
    const pattern = new RegExp(
      `<${tag}[^>]*>([\\s\\S]*?)</${tag}>`,
      'i',
    );
    const match = html.match(pattern);
    return match ? match[1].trim() : '';
  }

  private extractTotalEpisodes(html: string): number {
    const patterns = [
      /共\s*(\d+)\s*集/,
      /(\d+)\s*集全/,
      /serial_count["'\s:]+(\d+)/i,
      /totalEpisodes["'\s:]+(\d+)/i,
      /total_episodes["'\s:]+(\d+)/i,
      /episode_count["'\s:]+(\d+)/i,
      /集数["'\s:]+["']?(\d+)/,
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > 0) return num;
      }
    }

    const episodeMatches = html.match(
      /episode(_id|Id|Id)[^}]{0,200}/g,
    );
    if (episodeMatches && episodeMatches.length > 0) {
      return Math.min(episodeMatches.length, 100);
    }

    return 0;
  }

  private buildMockEpisodes(
    dramaId: string,
    total: number,
  ): DramaEpisode[] {
    const count = total > 0 ? total : 1;
    const episodes: DramaEpisode[] = [];
    for (let i = 1; i <= count; i += 1) {
      episodes.push({
        index: i,
        title: `第${i}集`,
        episodeId: `${dramaId}_${i}`,
      });
    }
    return episodes;
  }

  private extractVideoFromEmbedded(
    data: unknown,
    episodeId: string,
  ): EpisodeVideoInfo | null {
    if (!data || typeof data !== 'object') return null;

    const videoUrls: string[] = [];
    const collectVideos = (val: unknown): void => {
      if (!val || typeof val !== 'object') return;
      const v = val as Record<string, unknown>;

      const urlFields = [
        'videoUrl',
        'video_url',
        'playUrl',
        'play_url',
        'src',
        'url',
        'mp4Url',
        'm3u8Url',
        'videoSrc',
      ];
      for (const field of urlFields) {
        const fieldVal = v[field];
        if (
          typeof fieldVal === 'string' &&
          (fieldVal.includes('.mp4') ||
            fieldVal.includes('.m3u8') ||
            fieldVal.startsWith('http')) &&
          fieldVal.length > 10
        ) {
          videoUrls.push(fieldVal);
        }
      }

      for (const key of Object.keys(v)) {
        const child = v[key];
        if (child && typeof child === 'object') {
          if (Array.isArray(child)) {
            child.forEach(item => collectVideos(item));
          } else {
            collectVideos(child);
          }
        }
      }
    };
    collectVideos(data);

    if (videoUrls.length === 0) return null;

    const m3u8Url = videoUrls.find(u => u.includes('.m3u8'));
    const videoUrl = m3u8Url || videoUrls[0];
    const format = videoUrl.includes('.m3u8') ? 'm3u8' : 'mp4';

    return {
      videoUrl,
      format,
      title: `第${episodeId}集`,
    };
  }

  private extractVideoUrlFromHtml(html: string): string {
    const patterns = [
      /videoUrl["'\s:]+["']([^"']+\.(?:mp4|m3u8)[^"']*)["']/i,
      /playUrl["'\s:]+["']([^"']+\.(?:mp4|m3u8)[^"']*)["']/i,
      /play_url["'\s:]+["']([^"']+\.(?:mp4|m3u8)[^"']*)["']/i,
      /src=["']([^"']+\.(?:mp4|m3u8)[^"']*)["']/i,
      /<video[^>]+src=["']([^"']+)["']/i,
      /"url"\s*:\s*"([^"]+\.(?:mp4|m3u8)[^"]*)"/i,
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1]) return match[1];
    }

    return '';
  }

  private buildEpisodeUrl(dramaId: string, episodeId: string): string {
    return `https://hg.snssdk.com/drama/${dramaId}/${episodeId}`;
  }
}
