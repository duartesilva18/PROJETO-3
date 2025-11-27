import {
  Body,
  Controller,
  UseInterceptors,
  UploadedFiles,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Res,
  BadRequestException,
  NotFoundException
} from '@nestjs/common';
import { Response } from 'express';
import { Anexos_Dto } from '../dto/anexos.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AnexosService } from './anexos.service';
import { ApiTags } from '@nestjs/swagger';
import type { Express } from 'express';

@ApiTags('PortalNoticias')
@Controller('portal_noticias/anexos')
export class AnexosController {
  constructor(private readonly anexos_service: AnexosService) {}

  @Get()
  async get() {
    return this.anexos_service.get_Anexos();
  }

  @Get(':id_anexo')
  async getAnexoById(@Param('id_anexo') id_anexo: string, @Res() res: Response) {
    const result = await this.anexos_service.getAnexoById(id_anexo);

    if (!result || !result.filePath) {
      throw new NotFoundException('Arquivo não encontrado');
    }

    const { streamableFile, nome_original, type_file } = result;

    res.setHeader('Content-Type', type_file);
    res.setHeader('Content-Disposition', `inline; filename="${nome_original}"`);

    streamableFile.pipe(res);
  }

  // o upload idealmente será feito em conjunto com a criação da notícia
  @Post('upload')
  @UseInterceptors(FilesInterceptor('files'))
  async uploadFiles(@UploadedFiles() files: Array<Express.Multer.File>, @Body() body: any) {
    try {
      const codes = JSON.parse(body.codes ?? '[]');
      const uploadedFiles = await this.anexos_service.upload_Anexo(files, codes);
      return { success: true, data: uploadedFiles };
    } catch (error: any) {
      throw new BadRequestException(error.message || 'Erro ao fazer upload');
    }
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: Anexos_Dto) {
    return this.anexos_service.update_Anexo(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.anexos_service.delete_Anexo(id);
  }
}
