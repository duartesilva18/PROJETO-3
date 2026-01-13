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
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';

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
    try {
      return await this.noticiaService.updateNoticia(id, dto);
    } catch (error: any) {
      throw error;
    }
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

  @Get('portal-ipvc/list')
  @ApiOperation({ 
    summary: 'Lista notícias selecionadas para Portal IPVC',
    description: 'Retorna todas as notícias que têm a rede social "Portal IPVC" selecionada. Ideal para integração com WordPress.'
  })
  @ApiQuery({ 
    name: 'apenasPublicadas', 
    required: false, 
    type: Boolean,
    description: 'Se true, retorna apenas notícias com estado "Publicado". Padrão: false'
  })
  async getNoticiasPortalIPVC(
    @Query('apenasPublicadas') apenasPublicadas?: string
  ) {
    const apenasPublicadasBool = apenasPublicadas === 'true' || apenasPublicadas === '1';
    return this.noticiaService.getNoticiasPortalIPVC(apenasPublicadasBool);
  }
}
