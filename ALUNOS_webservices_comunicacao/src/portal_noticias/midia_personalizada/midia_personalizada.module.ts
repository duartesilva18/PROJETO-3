import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { MidiaPersonalizadaController } from './midia_personalizada.controller';
import { MidiaPersonalizadaService } from './midia_personalizada.service';

@Module({
  imports: [PrismaModule],
  controllers: [MidiaPersonalizadaController],
  providers: [MidiaPersonalizadaService],
  exports: [MidiaPersonalizadaService]
})
export class MidiaPersonalizadaModule {}



