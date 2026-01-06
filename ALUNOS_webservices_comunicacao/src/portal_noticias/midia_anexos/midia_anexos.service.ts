import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { MidiaAnexosDto } from './midia_anexos.dto';

@Injectable()
export class MidiaAnexosService {
  constructor(private readonly prisma: PrismaService) {}

  async save(dto: MidiaAnexosDto) {
    const { id_noticia, items } = dto;

    // Remove associações antigas
    await this.prisma.$executeRawUnsafe(
      `DELETE FROM [dbo].[pn_noticia_radio_jornal_anexo] WHERE id_noticia = @p1`,
      id_noticia
    );

    if (!items || items.length === 0) {
      return { message: 'Associações de anexos removidas com sucesso.' };
    }

    for (const item of items) {
      if (!item.ids_anexos || item.ids_anexos.length === 0) continue;
      for (const id_anexo of item.ids_anexos) {
        await this.prisma.$executeRawUnsafe(
          `INSERT INTO [dbo].[pn_noticia_radio_jornal_anexo]
            (id_noticia, id_radio_jornal, id_anexo, data_criacao)
           VALUES (@p1, @p2, @p3, GETDATE())`,
          id_noticia,
          item.id_radio_jornal,
          id_anexo
        );
      }
    }

    return { message: 'Associações de anexos guardadas com sucesso.' };
  }

  async get(id_noticia: string) {
    const rows =
      await this.prisma.$queryRawUnsafe<
        { id_radio_jornal: string; id_anexo: string }[]
      >(
        `SELECT id_radio_jornal, id_anexo
         FROM [dbo].[pn_noticia_radio_jornal_anexo]
         WHERE id_noticia = @p1`,
        id_noticia
      );

    return rows;
  }
}



