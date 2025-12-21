import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { MidiaAnexosController } from './midia_anexos.controller';
import { MidiaAnexosService } from './midia_anexos.service';

@Module({
  imports: [PrismaModule],
  controllers: [MidiaAnexosController],
  providers: [MidiaAnexosService],
  exports: [MidiaAnexosService]
})
export class MidiaAnexosModule {}


