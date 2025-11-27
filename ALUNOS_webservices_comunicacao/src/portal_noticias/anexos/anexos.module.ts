import { Module } from '@nestjs/common';
import { AnexosService } from './anexos.service';
import { AnexosController } from './anexos.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AnexosController],
  providers: [AnexosService],
  exports: [AnexosService]
})
export class AnexosModule {}
