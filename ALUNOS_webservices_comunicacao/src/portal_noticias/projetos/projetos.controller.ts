import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProjetosService } from './projetos.service';
import { ProjetoDto } from '../dto/projeto.dto';

@ApiTags('PortalNoticias')
@Controller('portal_noticias/projetos')
export class ProjetosController {
  constructor(private readonly projetosService: ProjetosService) {}

  @ApiOperation({ summary: 'Listar projetos' })
  @Get()
  async listar() {
    return this.projetosService.listar();
  }

  @ApiOperation({ summary: 'Obter projeto por id' })
  @Get(':id')
  async obter(@Param('id') id: string) {
    return this.projetosService.obter(Number(id));
  }

  @ApiOperation({ summary: 'Criar projeto' })
  @Post()
  async criar(@Body() dto: ProjetoDto) {
    return this.projetosService.criar(dto);
  }

  @ApiOperation({ summary: 'Atualizar projeto' })
  @Put(':id')
  async atualizar(@Param('id') id: string, @Body() dto: ProjetoDto) {
    return this.projetosService.atualizar(Number(id), dto);
  }

  @ApiOperation({ summary: 'Remover projeto' })
  @Delete(':id')
  async remover(@Param('id') id: string) {
    return this.projetosService.remover(Number(id));
  }
}

