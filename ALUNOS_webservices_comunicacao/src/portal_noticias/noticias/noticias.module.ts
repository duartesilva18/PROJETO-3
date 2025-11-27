import { Module } from '@nestjs/common';
import { NoticiasService } from './noticias.service';
import { NoticiasController } from './noticias.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AnexosModule } from '../anexos/anexos.module';

@Module({
  imports: [PrismaModule, AnexosModule],
  controllers: [NoticiasController],
  providers: [NoticiasService],
  exports: [NoticiasService]
})
export class NoticiasModule {}
