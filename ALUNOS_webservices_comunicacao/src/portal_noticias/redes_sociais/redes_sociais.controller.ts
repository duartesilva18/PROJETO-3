import { Body, Controller, Delete, Get, Param, Post, Put } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { AgendarNoticiaRedesDto, AtualizaAgendamentoDto } from "../dto/agendamento_redes.dto";
import { Redes_Sociais_Dto } from "../dto/redes_sociais.dto";
import { RedesSociaisService } from "./redes_sociais.service";

@ApiTags('Portal Notícias - Redes Sociais')
@Controller('portal_noticias/redessociais')
export class RedesSociaisController {
  constructor(private readonly rs_service: RedesSociaisService) {}

  @Get()
  @ApiOperation({ summary: 'Lista todas as redes sociais configuradas' })
  async get() {
    return this.rs_service.get_Redes_Sociais();
  }

  @Post()
  @ApiOperation({ summary: 'Cria uma nova rede social' })
  async create_Rede_Social(@Body() dto: Redes_Sociais_Dto) {
    return this.rs_service.create_Redes_Sociais(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza os dados de uma rede social existente' })
  async update(@Param('id') id: string, @Body() dto: Redes_Sociais_Dto) {
    return this.rs_service.update_Redes_Sociais(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove uma rede social' })
  async delete(@Param('id') id: string) {
    return this.rs_service.delete_Redes_Sociais(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtém detalhes de uma rede social' })
  async get_Rede_Social(@Param('id') id: string) {
    return this.rs_service.get_Redes_Social(id);
  }

  @Post('facebook')
  @ApiOperation({ summary: 'Publica imediatamente numa página do Facebook' })
  async postToFacebook(
    @Body('message') message: string,
    @Body('mediaUrls') mediaUrls: string[],
    @Body('noticia_id') id_noticia: string,
  ) {
    return this.rs_service.postToFacebook(message, mediaUrls, id_noticia);
  }

  @Post('publicar/:id')
  @ApiOperation({ summary: 'Publica automaticamente uma notícia nas redes selecionadas' })
  async autoPublish(@Param('id') id: string) {
    return this.rs_service.publicarNoticia(id);
  }

  @Post('twitter')
  @ApiOperation({ summary: 'Publica imediatamente no Twitter' })
  async postToTwitter(
    @Body('message') message: string,
    @Body('mediaUrls') mediaUrls: string[],
    @Body('noticia_id') id_noticia: string,
  ) {
    return this.rs_service.postToTwitter(message, mediaUrls, id_noticia);
  }

  @Post('instagram')
  @ApiOperation({ summary: 'Publica imediatamente no Instagram' })
  async postToInstagram(
    @Body('mediaUrls') mediaUrls: string[],
    @Body('caption') caption: string,
    @Body('noticia_id') id_noticia: string,
  ) {
    return this.rs_service.postToInstagram(mediaUrls, caption, id_noticia);
  }

  @Post('linkedin')
  @ApiOperation({ summary: 'Publica imediatamente no LinkedIn' })
  async postToLinkedIn(
    @Body('imageUrl') imageUrl: string,
    @Body('caption') caption: string,
    @Body('noticia_id') id_noticia: string,
  ) {
    return this.rs_service.postToLinkedIn(imageUrl, caption, id_noticia);
  }

  @Post('imgur')
  @ApiOperation({ summary: 'Envia um ficheiro para o Imgur (apoio interno)' })
  async postToImgur(@Body('image_id') id_image: string) {
    return this.rs_service.postToImgur(id_image);
  }

  @Post('agendamentos')
  @ApiOperation({ summary: 'Cria ou atualiza agendamentos por rede social para uma notícia' })
  async agendarNoticia(@Body() dto: AgendarNoticiaRedesDto) {
    return this.rs_service.agendarRedes(dto);
  }

  @Get('agendamentos')
  @ApiOperation({ summary: 'Lista todos os agendamentos configurados' })
  async listarTodosAgendamentos() {
    return this.rs_service.listarTodosAgendamentos();
  }

  @Get('agendamentos/:id_noticia')
  @ApiOperation({ summary: 'Lista os agendamentos configurados para uma notícia' })
  async listarAgendamentos(@Param('id_noticia') id_noticia: string) {
    return this.rs_service.listarAgendamentosPorNoticia(id_noticia);
  }

  @Put('agendamentos/:id_agendamento')
  @ApiOperation({ summary: 'Atualiza um agendamento existente' })
  async atualizarAgendamento(
    @Param('id_agendamento') id_agendamento: string,
    @Body() dto: AtualizaAgendamentoDto,
  ) {
    return this.rs_service.atualizarAgendamento(id_agendamento, dto);
  }

  @Delete('agendamentos/:id_agendamento')
  @ApiOperation({ summary: 'Remove um agendamento através do seu identificador' })
  async removerAgendamentoPorId(@Param('id_agendamento') id_agendamento: string) {
    return this.rs_service.removerAgendamentoPorId(id_agendamento);
  }

  @Delete('agendamentos/:id_noticia/:id_rede_social')
  @ApiOperation({ summary: 'Remove o agendamento de uma rede social específica' })
  async removerAgendamento(
    @Param('id_noticia') id_noticia: string,
    @Param('id_rede_social') id_rede_social: string,
  ) {
    return this.rs_service.removerAgendamento(id_noticia, id_rede_social);
  }
}

