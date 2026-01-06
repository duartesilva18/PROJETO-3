import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MidiaAnexosDto } from './midia_anexos.dto';
import { MidiaAnexosService } from './midia_anexos.service';

@ApiTags('PortalNoticias')
@Controller('portal_noticias/midia_anexos')
export class MidiaAnexosController {
  constructor(private readonly service: MidiaAnexosService) {}

  @Post()
  async save(@Body() dto: MidiaAnexosDto) {
    return this.service.save(dto);
  }

  @Get(':id_noticia')
  async get(@Param('id_noticia') id_noticia: string) {
    return this.service.get(id_noticia);
  }
}



