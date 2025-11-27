import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { RedesSociaisController } from './redes_sociais.controller';
import { RedesSociaisService } from './redes_sociais.service';
import { FacebookService } from './facebook.service';
import { TwitterService } from './twitter.service';
import { InstagramService } from './instagram.service';
import { LinkedInService } from './linkedin.service';
import { ImgurService } from './imgur.service';
import { NoticiasService } from '../noticias/noticias.service';
import { AnexosService } from '../anexos/anexos.service';

@Module({
  imports: [ConfigModule.forRoot(), HttpModule],
  controllers: [RedesSociaisController],
  providers: [RedesSociaisService, FacebookService, TwitterService, InstagramService, LinkedInService, NoticiasService, AnexosService, ImgurService],
  exports: [RedesSociaisService],
})
export class RedesSociaisModule {}