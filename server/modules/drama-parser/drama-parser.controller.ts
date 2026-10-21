import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { DramaParserService } from './drama-parser.service';
import { DramaParseDto } from './dto/drama-parse.dto';
import { EpisodeParseDto } from './dto/episode-parse.dto';
import type {
  DramaParseResponse,
  EpisodeParseResponse,
} from '@shared/api.interface';

@Controller('api/drama')
export class DramaParserController {
  constructor(private readonly dramaParserService: DramaParserService) {}

  @Post('parse')
  async parseDrama(
    @Body() dto: DramaParseDto,
  ): Promise<DramaParseResponse> {
    const drama = await this.dramaParserService.parseShareUrl(dto.shareUrl);
    return { drama };
  }

  @Post('episode')
  async parseEpisode(
    @Body() dto: EpisodeParseDto,
  ): Promise<EpisodeParseResponse> {
    const video = await this.dramaParserService.parseEpisode(
      dto.dramaId,
      dto.episodeId,
      dto.shareUrl,
    );
    return { video };
  }

  @Get('proxy')
  async proxyVideo(
    @Query('url') url: string,
    @Query('filename') filename: string,
    @Res() res: Response,
  ): Promise<void> {
    await this.dramaParserService.proxyVideo(url, filename, res);
  }
}
