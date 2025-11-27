import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query
} from '@nestjs/common';
import { NoticiaDto } from '../dto/noticia.dto';
import { NoticiasService } from './noticias.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('PortalNoticias')
@Controller('portal_noticias/noticias')
export class NoticiasController {
  constructor(private readonly noticiaService: NoticiasService) {}

  @Get()
  async getNoticias() {
    return this.noticiaService.getNoticias();
  }

  @Get('v2')
  async getNoticiasv2(
    @Query('titulo') titulo = '',
    @Query('categoria') categoria = '',
    @Query('estado') estado = '',
    @Query('data') data = ''
  ) {
    return this.noticiaService.getNoticiasv2(titulo, categoria, estado, data);
  }

  @Post()
  async createNoticia(@Body() dto: NoticiaDto) {
    return this.noticiaService.createNoticias(dto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: NoticiaDto) {
    return this.noticiaService.updateNoticia(id, dto);
  }

  @Put(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('estado') status: string
  ) {
    return this.noticiaService.updateNoticiaStatus(id, status);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.noticiaService.deleteNoticia(id);
  }

  @Get(':id')
  async getNoticia(@Param('id') id: string) {
    return this.noticiaService.getNoticia(id);
  }
}
