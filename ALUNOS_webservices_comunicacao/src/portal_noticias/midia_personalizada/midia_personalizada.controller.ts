import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MidiaPersonalizadaDto } from './midia_personalizada.dto';
import { MidiaPersonalizadaService } from './midia_personalizada.service';

@ApiTags('PortalNoticias')
@Controller('portal_noticias/midia_personalizada')
export class MidiaPersonalizadaController {
  constructor(
    private readonly midiaPersonalizadaService: MidiaPersonalizadaService
  ) {}

  @Post()
  async save(@Body() dto: MidiaPersonalizadaDto) {
    return this.midiaPersonalizadaService.savePersonalizacoes(dto);
  }

  @Get(':id_noticia')
  async get(@Param('id_noticia') id_noticia: string) {
    return this.midiaPersonalizadaService.getPersonalizacoes(id_noticia);
  }
}



