import { Injectable, BadRequestException } from '@nestjs/common';
import * as dayjs from 'dayjs';
import { PrismaService } from 'src/prisma/prisma.service';
import { AnexosService } from '../anexos/anexos.service';
import { NoticiaDto } from '../dto/noticia.dto';

@Injectable()
export class NoticiasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly anexosService: AnexosService
  ) {}

  async getNoticias() {
    return this.prisma.pn_noticia.findMany({
      select: {
        id_noticia: true,
        titulo: true,
        texto: true,
        texto_facebook: true,
        texto_instagram: true,
        texto_linkedin: true,
        texto_twitter: true,
        texto_tiktok: true,
        texto_portalipvc: true,
        data_criacao: true,
        estado: true,
        emails: true,
        pn_categoria: {
          select: {
            id_categoria: true,
            nome: true,
            descricao: true,
            status: true
          }
        },
        pn_anexos: true,
        pn_noticia_Tag: true,
        pn_rs_noticia: true,
        pn_agendamento_rede: {
          select: {
            id_agendamento: true,
            id_rede_social: true,
            horario_agendado: true,
            fuso_horario: true,
            status: true
          }
        },
        id_pedido: true,
        tipo: true
      }
    });
  }

  async getNoticiasv2(
    titulo: string,
    categoria: string,
    estado: string,
    data: string
  ) {
    const where: any = {};

    if (titulo && titulo.trim().length > 0) {
      where.titulo = { contains: titulo.trim() };
    }

    if (categoria && categoria.trim().length > 0) {
      where.id_categoria_FK = categoria.trim();
    }

    if (estado && estado.trim().length > 0 && estado !== 'Todos') {
      where.estado = estado.trim();
    }

    if (data && data.trim().length > 0) {
      const start = dayjs(data, 'DD/MM/YYYY').startOf('day').toDate();
      const end = dayjs(data, 'DD/MM/YYYY').endOf('day').toDate();
      where.data_criacao = { gte: start, lte: end };
    }

    const noticias = await this.prisma.pn_noticia.findMany({
      select: {
        id_noticia: true,
        titulo: true,
        texto: true,
        texto_facebook: true,
        texto_instagram: true,
        texto_linkedin: true,
        texto_twitter: true,
        texto_tiktok: true,
        texto_portalipvc: true,
        data_criacao: true,
        estado: true,
        emails: true,
        pn_categoria: {
          select: {
            id_categoria: true,
            nome: true,
            descricao: true,
            status: true
          }
        },
        pn_anexos: true,
        pn_noticia_Tag: true,
        pn_rs_noticia: true,
        pn_agendamento_rede: {
          select: {
            id_agendamento: true,
            id_rede_social: true,
            horario_agendado: true,
            fuso_horario: true,
            status: true
          }
        },
        id_pedido: true,
        tipo: true
      },
      where
    });

    const formated = noticias.map((noticia) => {
      return [
        noticia.titulo,
        noticia.estado,
        dayjs(noticia.data_criacao).format('DD/MM/YYYY'),
        noticia.pn_categoria?.descricao ?? null,
        noticia.id_noticia,
        noticia.pn_categoria?.id_categoria ?? null
      ];
    });

    return formated;
  }

  async createNoticias(dto: NoticiaDto) {
    // tratar id_pedido e tipo como numbers (aceita string "1" ou number 1)
    const parsedIdPedido =
      dto.id_pedido !== undefined && dto.id_pedido !== null
        ? Number(dto.id_pedido)
        : NaN;
    const parsedTipo =
      dto.tipo !== undefined && dto.tipo !== null ? Number(dto.tipo) : NaN;

    const hasIdPedido = Number.isFinite(parsedIdPedido);
    const hasTipo = Number.isFinite(parsedTipo);

    return this.prisma.$transaction(async (tx) => {
      return tx.pn_noticia.create({
        data: {
          titulo: dto.titulo,
          texto: dto.texto,
          texto_facebook: dto.texto_facebook,
          texto_instagram: dto.texto_instagram,
          texto_linkedin: dto.texto_linkedin,
          texto_twitter: dto.texto_twitter,
          texto_tiktok: dto.texto_tiktok,
          texto_portalipvc: dto.texto_portalipvc,
          estado: dto.estado,
          emails: dto.emails,
          ...(hasIdPedido ? { id_pedido: parsedIdPedido } : {}),
          ...(hasTipo ? { tipo: parsedTipo } : {}),
          pn_categoria: {
            connect: { id_categoria: dto.id_categoria_FK }
          },
          pn_rs_noticia: {
            createMany: {
              data: (dto.redesSociais || []).map((redeSocial) => ({
                id_rede_social_FK: redeSocial.id_rede_social
              }))
            }
          },
          pn_anexos: {
            createMany: {
              // @ts-ignore
              data: (dto.anexos || []).map((anexo) => ({
                nome_ficheiro: anexo.nome_ficheiro,
                tipo: anexo.tipo,
                nome_original_ficheiro: anexo.nome_original_ficheiro,
                code_rede_social: anexo.code_rede_social
              }))
            }
          },
          pn_noticia_Tag: {
            createMany: {
              data: (dto.tags || []).map((tag) => ({
                id_tag: tag.id_tag
              }))
            }
          }
        }
      });
    });
  }

  async updateNoticiaStatus(id: string, status: string) {
    const noticiaID = String(id);

    const noticiaExist = await this.prisma.pn_noticia.findUnique({
      where: { id_noticia: noticiaID }
    });

    if (!noticiaExist) {
      return { message: 'Notícia não encontrada' };
    }

    try {
      return await this.prisma.pn_noticia.update({
        where: { id_noticia: noticiaID },
        data: { estado: status }
      });
    } catch {
      return { message: 'Não foi possível concluir o pedido' };
    }
  }

  async deleteNoticia(id: string) {
    try {
      const noticiaExist = await this.prisma.pn_noticia.findUnique({
        where: { id_noticia: id }
      });

      if (!noticiaExist) {
        throw new Error('Notícia não encontrada.');
      }

      return await this.prisma.pn_noticia.update({
        where: { id_noticia: id },
        data: { estado: 'eliminada' }
      });
    } catch (error) {
      console.error('Erro ao excluir notícia:', error);
      return { message: 'Não foi possível concluir o pedido.' };
    }
  }

  async updateNoticia(id: string, dto: NoticiaDto) {
    const noticiaID = String(id);

    if (!dto.id_categoria_FK) {
      throw new BadRequestException('ID da categoria é obrigatório');
    }

    const noticiaExist = await this.prisma.pn_noticia.findUnique({
      where: { id_noticia: noticiaID }
    });

    if (!noticiaExist) {
      throw new BadRequestException('Notícia não encontrada');
    }

    const parsedIdPedido =
      dto.id_pedido !== undefined && dto.id_pedido !== null
        ? Number(dto.id_pedido)
        : NaN;
    const parsedTipo =
      dto.tipo !== undefined && dto.tipo !== null ? Number(dto.tipo) : NaN;

    const hasIdPedido = Number.isFinite(parsedIdPedido);
    const hasTipo = Number.isFinite(parsedTipo);

    try {
      const updateData: any = {
        titulo: dto.titulo,
        texto: dto.texto,
        texto_facebook: dto.texto_facebook || null,
        texto_instagram: dto.texto_instagram || null,
        texto_linkedin: dto.texto_linkedin || null,
        texto_twitter: dto.texto_twitter || null,
        texto_tiktok: dto.texto_tiktok || null,
        texto_portalipvc: dto.texto_portalipvc || null,
        estado: dto.estado,
        emails: dto.emails || null,
        ...(hasIdPedido ? { id_pedido: parsedIdPedido } : { id_pedido: null }),
        ...(hasTipo ? { tipo: parsedTipo } : { tipo: null }),
        pn_categoria: {
          connect: { id_categoria: dto.id_categoria_FK }
        }
      };

      // Apenas atualizar redes sociais se fornecidas
      if (dto.redesSociais && Array.isArray(dto.redesSociais) && dto.redesSociais.length > 0) {
        const redesSociaisData = dto.redesSociais
          .filter((rs) => rs && rs.id_rede_social)
          .map((rs) => ({
            id_rede_social_FK: rs.id_rede_social
          }));
        
        if (redesSociaisData.length > 0) {
          updateData.pn_rs_noticia = {
            deleteMany: {},
            createMany: { data: redesSociaisData }
          };
        } else {
          // Se não há redes válidas, apenas deletar as existentes
          updateData.pn_rs_noticia = {
            deleteMany: {}
          };
        }
      } else {
        // Se não fornecido, apenas deletar as existentes
        updateData.pn_rs_noticia = {
          deleteMany: {}
        };
      }

      // Apenas atualizar anexos se fornecidos
      if (dto.anexos && Array.isArray(dto.anexos) && dto.anexos.length > 0) {
        const anexosData = dto.anexos
          .filter((anexo) => anexo && anexo.nome_ficheiro)
          .map((anexo) => ({
            nome_ficheiro: anexo.nome_ficheiro,
            tipo: anexo.tipo || 'application/octet-stream',
            nome_original_ficheiro: anexo.nome_original_ficheiro || anexo.nome_ficheiro,
            code_rede_social: anexo.code_rede_social || '00000'
          }));
        
        if (anexosData.length > 0) {
          updateData.pn_anexos = {
            deleteMany: {},
            createMany: { data: anexosData }
          };
        } else {
          updateData.pn_anexos = {
            deleteMany: {}
          };
        }
      } else {
        // Se não fornecido, apenas deletar os existentes
        updateData.pn_anexos = {
          deleteMany: {}
        };
      }

      // Apenas atualizar tags se fornecidas
      if (dto.tags && Array.isArray(dto.tags) && dto.tags.length > 0) {
        const tagsData = dto.tags
          .filter((tag) => tag && tag.id_tag)
          .map((tag) => ({
            id_tag: tag.id_tag
          }));
        
        if (tagsData.length > 0) {
          updateData.pn_noticia_Tag = {
            deleteMany: {},
            createMany: { data: tagsData }
          };
        } else {
          updateData.pn_noticia_Tag = {
            deleteMany: {}
          };
        }
      } else {
        // Se não fornecido, apenas deletar as existentes
        updateData.pn_noticia_Tag = {
          deleteMany: {}
        };
      }

      const updatedNoticia = await this.prisma.pn_noticia.update({
        where: { id_noticia: noticiaID },
        data: updateData
      });

      return updatedNoticia;
    } catch (error: any) {
      console.error('Erro ao atualizar notícia:', error);
      console.error('Detalhes do erro:', {
        code: error.code,
        meta: error.meta,
        message: error.message
      });
      throw new BadRequestException(
        `Erro ao atualizar notícia: ${error.message || 'Erro desconhecido'}`
      );
    }
  }

  async getNoticia(id: string) {
    const noticiaID = String(id);

    try {
      return await this.prisma.pn_noticia.findUnique({
        where: { id_noticia: noticiaID },
        include: {
          pn_anexos: true,
          pn_categoria: true,
          pn_noticia_Tag: true,
          pn_rs_noticia: true
        }
      });
    } catch {
      return { message: 'Não foi possível concluir o pedido' };
    }
  }
}
