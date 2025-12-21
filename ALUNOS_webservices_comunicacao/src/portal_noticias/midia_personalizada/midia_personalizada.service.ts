import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { MidiaPersonalizadaDto } from './midia_personalizada.dto';

@Injectable()
export class MidiaPersonalizadaService {
  constructor(private readonly prisma: PrismaService) {}

  async savePersonalizacoes(dto: MidiaPersonalizadaDto) {
    const { id_noticia, items } = dto;

    // Apagar personalizações antigas desta notícia
    await this.prisma.$executeRawUnsafe(
      `DELETE FROM [dbo].[pn_noticia_radio_jornal] WHERE id_noticia = @p1`,
      id_noticia
    );

    if (!items || items.length === 0) {
      return { message: 'Personalizações removidas com sucesso.' };
    }

    // Inserir as novas personalizações (apenas texto personalizado por rádio/jornal)
    for (const item of items) {
      await this.prisma.$executeRawUnsafe(
        `INSERT INTO [dbo].[pn_noticia_radio_jornal]
          (id_noticia, id_radio_jornal, texto_custom, data_criacao)
         VALUES (@p1, @p2, @p3, GETDATE())`,
        id_noticia,
        item.id_radio_jornal,
        item.texto_custom ?? null
      );
    }

    return { message: 'Personalizações guardadas com sucesso.' };
  }

  async getPersonalizacoes(id_noticia: string) {
    const rows =
      await this.prisma.$queryRawUnsafe<
        { id_radio_jornal: string; texto_custom: string | null; id_anexo: string | null }[]
      >(
        `SELECT id_radio_jornal, texto_custom, id_anexo
         FROM [dbo].[pn_noticia_radio_jornal]
         WHERE id_noticia = @p1`,
        id_noticia
      );

    return rows;
  }
}