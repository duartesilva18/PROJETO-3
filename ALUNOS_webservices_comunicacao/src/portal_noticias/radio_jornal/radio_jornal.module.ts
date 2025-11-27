import { Module } from '@nestjs/common';
import { RadioJornalService } from './radio_jornal.service';
import { RadioJornalController } from './radio_jornal.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RadioJornalController],
  providers: [RadioJornalService],
  exports: [RadioJornalService]
})
export class RadioJornalModule {}
