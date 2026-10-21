import { IsOptional, IsString, IsUrl } from 'class-validator';
import type { EpisodeParseRequest } from '@shared/api.interface';

export class EpisodeParseDto implements EpisodeParseRequest {
  @IsString()
  dramaId!: string;

  @IsString()
  episodeId!: string;

  @IsOptional()
  @IsString()
  shareUrl?: string;
}
