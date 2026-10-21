import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { DramaParserController } from './drama-parser.controller';
import { DramaParserService } from './drama-parser.service';

@Module({
  imports: [HttpModule],
  controllers: [DramaParserController],
  providers: [DramaParserService],
})
export class DramaParserModule {}
