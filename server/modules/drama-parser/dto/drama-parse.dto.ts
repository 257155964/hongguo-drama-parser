import { IsNotEmpty, IsString } from 'class-validator';
import type { DramaParseRequest } from '@shared/api.interface';

export class DramaParseDto implements DramaParseRequest {
  @IsString()
  @IsNotEmpty()
  shareUrl!: string;
}
