import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { Anexos_Dto } from '../dto/anexos.dto';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs';
import { PrismaService } from 'src/prisma/prisma.service';
import type { Express } from 'express';

@Injectable()
export class AnexosService {
  constructor(private readonly prisma: PrismaService) {}

  async get_Anexos() {
    const anexos = await this.prisma.pn_anexos.findMany({
      select: {
        id_anexo: true,
        pn_noticia: true,
        tipo: true,
        nome_ficheiro: true,
        nome_original_ficheiro: true,
        code_rede_social: true
      }
    });

    if (anexos.length === 0) {
      return { message: 'Não foram encontrados anexos' };
    }

    return anexos;
  }

  async upload_Anexo(files: Express.Multer.File[], codes: string[]): Promise<any[]> {
    try {
      if (!files || files.length === 0) {
        throw new BadRequestException('Nenhum ficheiro enviado.');
      }

      const uploadedFiles: any[] = [];

      if (!fs.existsSync('./uploads/portal_noticias/')) {
        fs.mkdirSync('./uploads/portal_noticias/', { recursive: true });
      }

      files.forEach((file, index) => {
        const extensao = path.extname(file.originalname);
        const nomeDoArquivo = `${uuidv4()}${extensao}`;

        fs.writeFileSync(`uploads/portal_noticias/${nomeDoArquivo}`, file.buffer);

        uploadedFiles.push({
          nome_ficheiro: nomeDoArquivo,
          tipo: file.mimetype,
          nome_original_ficheiro: file.originalname,
          code_rede_social: codes[index] ?? null
        });
      });

      // aqui só guardas em disco, se quiseres gravar em BD podes fazer um createMany
      // await this.prisma.pn_anexos.createMany({ data: uploadedFiles });

      return uploadedFiles;
    } catch (error) {
      console.error('Erro ao fazer upload do ficheiro:', error);
      throw new BadRequestException('Erro ao fazer upload do ficheiro.');
    }
  }

  async delete_Anexo(id: string) {
    const anexo_id = String(id);

    const anexoExist = await this.prisma.pn_anexos.findUnique({
      where: { id_anexo: anexo_id }
    });

    if (!anexoExist) {
      return { message: 'Anexo não encontrado' };
    }

    try {
      return await this.prisma.pn_anexos.delete({
        where: { id_anexo: anexo_id }
      });
    } catch (error) {
      return { message: 'Não foi possível concluir o pedido' };
    }
  }

  async update_Anexo(id: string, dto: Anexos_Dto) {
    const anexo_ID = String(id);

    const anexoExist = await this.prisma.pn_anexos.findUnique({
      where: { id_anexo: anexo_ID }
    });

    if (!anexoExist) {
      return { message: 'Anexo não encontrado' };
    }

    try {
      return await this.prisma.pn_anexos.update({
        data: {
          nome_ficheiro: dto.caminho,
          tipo: dto.tipo
        },
        where: { id_anexo: anexo_ID }
      });
    } catch (error) {
      return { message: 'Não foi possível concluir o pedido' };
    }
  }

  async get_Anexo(id: string) {
    const anexo_ID = String(id);

    const anexo = await this.prisma.pn_anexos.findUnique({
      where: { id_anexo: anexo_ID }
    });

    if (!anexo) {
      throw new NotFoundException('Anexo não encontrado');
    }

    return anexo;
  }

  async getAnexoById(id_anexo: string) {
    const filePath = await this.get_Anexo(id_anexo);

    const fullPath = `uploads/portal_noticias/${filePath.nome_ficheiro}`;

    if (!fs.existsSync(fullPath)) {
      throw new NotFoundException('Ficheiro físico não encontrado');
    }

    return {
      streamableFile: fs.createReadStream(fullPath),
      fileName: filePath.nome_ficheiro,
      filePath: fullPath,
      nome_original: filePath.nome_original_ficheiro,
      type_file: filePath.tipo,
      code_rede_social: filePath.code_rede_social
    };
  }
}
