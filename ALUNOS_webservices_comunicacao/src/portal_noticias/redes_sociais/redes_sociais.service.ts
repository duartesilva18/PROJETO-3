import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Redes_Sociais_Dto } from '../dto/redes_sociais.dto';
import { FacebookService } from './facebook.service';
import { TwitterService } from './twitter.service';
import { InstagramService } from './instagram.service';
import { LinkedInService } from './linkedin.service';
import { ImgurService } from './imgur.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { NoticiasService } from '../noticias/noticias.service';
import { AgendarNoticiaRedesDto, AgendamentoStatus, AtualizaAgendamentoDto } from '../dto/agendamento_redes.dto';

@Injectable()
export class RedesSociaisService {
  constructor(
    private prisma: PrismaService,
    private facebookService: FacebookService,
    private twitterService: TwitterService,
    private instagramService: InstagramService,
    private linkedinService: LinkedInService,
    private noticiasService: NoticiasService,
    private imgurService: ImgurService

  ) {}

  private readonly logger = new Logger(RedesSociaisService.name);

  async get_Redes_Sociais() {
    const redes_sociais = await this.prisma.pn_redes_sociais.findMany({
      select: {
        nome: true,
        id_rede_social: true,
        pn_rs_noticia: true,
      },
    });
    if (redes_sociais.length === 0) return { message: "Não foram encontrados Redes sociais" };
    return redes_sociais;
  }

  async create_Redes_Sociais(dto: Redes_Sociais_Dto) {
    try {
      return await this.prisma.pn_redes_sociais.create({
        data: {
          nome: dto.nome,
        },
      });
    } catch (error) {
      return {
        message: "Não foi possível concluir o pedido",
      };
    }
  }

  async delete_Redes_Sociais(id: string) {
    const rede_social_id = String(id);
    const rede_social_Exist = await this.prisma.pn_redes_sociais.findUnique({
      where: {
        id_rede_social: rede_social_id,
      },
    });

    if (!rede_social_Exist) {
      return {
        message: "Rede Social não encontrada",
      };
    }

    try {
      return await this.prisma.pn_redes_sociais.delete({
        where: { id_rede_social: rede_social_id },
      });
    } catch (error) {
      return {
        message: "Não foi possível concluir o pedido",
      };
    }
  }

  async update_Redes_Sociais(id: string, dto: Redes_Sociais_Dto) {
    const rede_social_ID = String(id);
    const rs_Exist = await this.prisma.pn_redes_sociais.findUnique({
      where: {
        id_rede_social: rede_social_ID,
      },
    });

    if (!rs_Exist) {
      return {
        message: "Rede Social não encontrada",
      };
    }

    try {
      return await this.prisma.pn_redes_sociais.update({
        data: {
          nome: dto.nome,
        },
        where: {
          id_rede_social: rede_social_ID,
        },
      });
    } catch (error) {
      return {
        message: "Não foi possível concluir o pedido",
      };
    }
  }

  async get_Redes_Social(id: string) {
    const rede_social_ID = String(id);

    try {
      return await this.prisma.pn_redes_sociais.findUnique({
        where: {
          id_rede_social: rede_social_ID,
        },
      });
    } catch (error) {
      return {
        message: "Não foi possível concluir o pedido",
      };
    }
  }

  // Método para postar no Facebook
  async postToFacebook(message: string,  mediaUrls: string[], id_noticia:string) {
    let res = await this.facebookService.postToFacebook(message, mediaUrls);
    await this.noticiasService.updateNoticiaStatus(id_noticia,"Publicado")
    return res
    
  }

  async postToTwitter(message: string, mediaUrls: string[], id_noticia: string) {
    let res = await this.twitterService.postToTwitter(message, mediaUrls);
    await this.noticiasService.updateNoticiaStatus(id_noticia,"Publicado")
    return res
  }

  async postToInstagram(mediaUrls: string[], caption: string, id_noticia: string) {
    let res = await this.instagramService.postToInstagram(mediaUrls, caption);
    await this.noticiasService.updateNoticiaStatus(id_noticia,"Publicado")
    return res
  }

  async postToLinkedIn(imageUrl: string, caption: string,id_noticia:string
  ) {
    let res = await this.linkedinService.createPostWithImage(imageUrl, caption);
    await this.noticiasService.updateNoticiaStatus(id_noticia,"Publicado")
    return res
  }
  
  async postToImgur(id_imagem: string) {
    let res = await this.imgurService.uploadVideoToImgur(id_imagem);
    return res
  }

  async agendarRedes(dto: AgendarNoticiaRedesDto) {
    if (!dto.agendamentos?.length) {
      throw new BadRequestException('É necessário indicar pelo menos um agendamento.');
    }

    const noticia = await this.prisma.pn_noticia.findUnique({
      where: { id_noticia: dto.id_noticia },
      select: { id_noticia: true },
    });

    if (!noticia) {
      throw new NotFoundException('Notícia não encontrada.');
    }

    const redeIds = dto.agendamentos.map((agendamento) => agendamento.id_rede_social);
    const redesValidas = await this.prisma.pn_redes_sociais.findMany({
      where: { id_rede_social: { in: redeIds } },
      select: { id_rede_social: true },
    });
    const redesEncontradas = new Set(redesValidas.map((rede) => rede.id_rede_social));
    const redesEmFalta = redeIds.filter((id) => !redesEncontradas.has(id));
    if (redesEmFalta.length > 0) {
      throw new BadRequestException(`Rede(s) social(is) inválida(s): ${redesEmFalta.join(', ')}`);
    }

    const normalizados = dto.agendamentos.map((agendamento) => {
      const horario = new Date(agendamento.horario_agendado);
      if (Number.isNaN(horario.getTime())) {
        throw new BadRequestException(`Horário inválido para a rede ${agendamento.id_rede_social}`);
      }

      return {
        ...agendamento,
        horario,
        fuso: agendamento.fuso_horario ?? 'Europe/Lisbon',
        status: agendamento.status ?? AgendamentoStatus.PENDENTE,
      };
    });

    const operations = normalizados.map((agendamento) =>
      this.prisma.pn_agendamento_rede.upsert({
        where: {
          id_noticia_id_rede_social: {
            id_noticia: dto.id_noticia,
            id_rede_social: agendamento.id_rede_social,
          },
        },
        update: {
          horario_agendado: agendamento.horario,
          fuso_horario: agendamento.fuso,
          status: agendamento.status,
        },
        create: {
          id_noticia: dto.id_noticia,
          id_rede_social: agendamento.id_rede_social,
          horario_agendado: agendamento.horario,
          fuso_horario: agendamento.fuso,
          status: agendamento.status,
        },
      }),
    );

    const agendamentos = await this.prisma.$transaction(operations);
    return {
      id_noticia: dto.id_noticia,
      total: agendamentos.length,
      agendamentos,
    };
  }

  async listarTodosAgendamentos() {
    const agendamentos = await this.prisma.pn_agendamento_rede.findMany({
      include: {
        pn_redes_sociais: {
          select: {
            id_rede_social: true,
            nome: true,
          },
        },
        pn_noticia: {
          select: {
            id_noticia: true,
            titulo: true,
            pn_categoria: {
              select: {
                id_categoria: true,
                nome: true,
              },
            },
          },
        },
      },
      orderBy: {
        horario_agendado: 'asc',
      },
    });

    return agendamentos.map((agendamento) => ({
      id_agendamento: agendamento.id_agendamento,
      id_noticia: agendamento.id_noticia,
      titulo: agendamento.pn_noticia?.titulo ?? '',
      categoria: agendamento.pn_noticia?.pn_categoria?.nome ?? null,
      id_rede_social: agendamento.id_rede_social,
      rede_nome: agendamento.pn_redes_sociais?.nome ?? '',
      horario_agendado: agendamento.horario_agendado,
      fuso_horario: agendamento.fuso_horario,
      status: agendamento.status,
    }));
  }

  async listarAgendamentosPorNoticia(id_noticia: string) {
    const noticia = await this.prisma.pn_noticia.findUnique({
      where: { id_noticia },
      select: { id_noticia: true },
    });

    if (!noticia) {
      throw new NotFoundException('Notícia não encontrada.');
    }

    return this.prisma.pn_agendamento_rede.findMany({
      where: { id_noticia },
      include: {
        pn_redes_sociais: {
          select: {
            id_rede_social: true,
            nome: true,
          },
        },
      },
      orderBy: {
        horario_agendado: 'asc',
      },
    });
  }

  async atualizarAgendamento(id_agendamento: string, dto: AtualizaAgendamentoDto) {
    const agendamento = await this.prisma.pn_agendamento_rede.findUnique({
      where: { id_agendamento },
    });

    if (!agendamento) {
      throw new NotFoundException('Agendamento não encontrado.');
    }

    const data: Prisma.pn_agendamento_redeUpdateInput = {
      horario_agendado: new Date(dto.horario_agendado),
    };

    if (dto.fuso_horario) {
      data.fuso_horario = dto.fuso_horario;
    }

    if (dto.status) {
      data.status = dto.status;
    }

    return this.prisma.pn_agendamento_rede.update({
      where: { id_agendamento },
      data,
    });
  }

  async removerAgendamentoPorId(id_agendamento: string) {
    try {
      await this.prisma.pn_agendamento_rede.delete({
        where: { id_agendamento },
      });
      return { message: 'Agendamento removido com sucesso.' };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('Agendamento não encontrado.');
      }
      throw error;
    }
  }

  async removerAgendamento(id_noticia: string, id_rede_social: string) {
    try {
      await this.prisma.pn_agendamento_rede.delete({
        where: {
          id_noticia_id_rede_social: {
            id_noticia,
            id_rede_social,
          },
        },
      });
      return { message: 'Agendamento removido com sucesso.' };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('Agendamento não encontrado.');
      }
      throw error;
    }
  }
  
  private buildMediaList(
    anexos: { id_anexo: string; tipo: string; code_rede_social?: string | null }[],
    index: number,
    tipo: 'image' | 'video'
  ) {
    return anexos
      .filter(
        (anexo) =>
          anexo.tipo?.startsWith(`${tipo}/`) &&
          anexo.code_rede_social &&
          anexo.code_rede_social[index] === '1'
      )
      .map((anexo) => anexo.id_anexo);
  }

  private chooseMedia(
    imageIds: string[],
    videoIds: string[]
  ): string[] {
    if (imageIds.length === 0 && videoIds.length === 1) {
      return videoIds;
    }
    if (imageIds.length > 0) {
      return imageIds;
    }
    return videoIds;
  }

  private buildMessage(base?: string, tags?: string) {
    return [base?.trim(), tags?.trim()].filter(Boolean).join(' ').trim();
  }

  async publicarNoticia(id_noticia: string) {
    const noticia = await this.prisma.pn_noticia.findUnique({
      where: { id_noticia },
      include: {
        pn_anexos: true,
        pn_noticia_Tag: {
          include: {
            pn_tag: true
          }
        },
        pn_rs_noticia: {
          include: {
            pn_redes_sociais: true
          }
        }
      }
    });

    if (!noticia) {
      throw new NotFoundException('Notícia não encontrada');
    }

    const formattedTags = noticia.pn_noticia_Tag
      .map((tag) => tag.pn_tag?.nome)
      .filter((nome): nome is string => !!nome)
      .map((nome) => `#${nome}`)
      .join(' ')
      .trim();

    const redes = noticia.pn_rs_noticia
      .map((rede) => rede.pn_redes_sociais?.nome)
      .filter((nome): nome is string => !!nome);

    const results: Array<{ rede: string; status: 'success' | 'error'; message?: string }> = [];

    if (redes.length === 0) {
      this.logger.warn(`Notícia ${id_noticia} não possui redes sociais configuradas.`);
      return { id_noticia, results };
    }

    const anexos = noticia.pn_anexos ?? [];

    const imageIndex = { instagram: 0, facebook: 1, twitter: 2 };

    for (const redeNome of redes) {
      const rede = redeNome.toLowerCase();

      try {
        switch (rede) {
          case 'facebook': {
            if (!noticia.texto_facebook) {
              results.push({ rede: 'Facebook', status: 'error', message: 'Texto do Facebook em falta' });
              break;
            }
            const imageIds = this.buildMediaList(anexos, imageIndex.facebook, 'image');
            const videoIds = this.buildMediaList(anexos, imageIndex.facebook, 'video');
            const media = this.chooseMedia(imageIds, videoIds);
            await this.postToFacebook(
              this.buildMessage(noticia.texto_facebook, formattedTags),
              media,
              id_noticia
            );
            this.logger.log(`Notícia ${id_noticia} publicada no Facebook`);
            results.push({ rede: 'Facebook', status: 'success' });
            break;
          }
          case 'twitter': {
            if (!noticia.texto_twitter) {
              results.push({ rede: 'Twitter', status: 'error', message: 'Texto do Twitter em falta' });
              break;
            }
            const imageIds = this.buildMediaList(anexos, imageIndex.twitter, 'image');
            const videoIds = this.buildMediaList(anexos, imageIndex.twitter, 'video');
            const media = this.chooseMedia(imageIds, videoIds);
            await this.postToTwitter(
              this.buildMessage(noticia.texto_twitter, formattedTags),
              media,
              id_noticia
            );
            this.logger.log(`Notícia ${id_noticia} publicada no Twitter`);
            results.push({ rede: 'Twitter', status: 'success' });
            break;
          }
          case 'instagram': {
            if (!noticia.texto_instagram) {
              results.push({ rede: 'Instagram', status: 'error', message: 'Texto do Instagram em falta' });
              break;
            }
            const imageIds = this.buildMediaList(anexos, imageIndex.instagram, 'image');
            const videoIds = this.buildMediaList(anexos, imageIndex.instagram, 'video');
            const media = this.chooseMedia(imageIds, videoIds);
            if (media.length === 0) {
              results.push({ rede: 'Instagram', status: 'error', message: 'Sem anexos configurados para Instagram' });
              break;
            }
            await this.postToInstagram(
              media,
              this.buildMessage(noticia.texto_instagram, formattedTags),
              id_noticia
            );
            this.logger.log(`Notícia ${id_noticia} publicada no Instagram`);
            results.push({ rede: 'Instagram', status: 'success' });
            break;
          }
          case 'linkedin': {
            if (!noticia.texto_linkedin) {
              results.push({ rede: 'LinkedIn', status: 'error', message: 'Texto do LinkedIn em falta' });
              break;
            }
            const firstImage = anexos.find((anexo) => anexo.tipo?.startsWith('image/'));
            if (!firstImage) {
              results.push({ rede: 'LinkedIn', status: 'error', message: 'Nenhuma imagem disponível para LinkedIn' });
              break;
            }
            await this.postToLinkedIn(
              firstImage.id_anexo,
              this.buildMessage(noticia.texto_linkedin, formattedTags),
              id_noticia
            );
            this.logger.log(`Notícia ${id_noticia} publicada no LinkedIn`);
            results.push({ rede: 'LinkedIn', status: 'success' });
            break;
          }
          default:
            this.logger.warn(`Rede social ${redeNome} não suportada para publicação automática.`);
            results.push({ rede: redeNome, status: 'error', message: 'Rede não suportada para publicação automática' });
        }
      } catch (error: any) {
        this.logger.error(
          `Erro ao publicar notícia ${id_noticia} na rede ${redeNome}: ${error?.message ?? error}`,
          error?.stack
        );
        results.push({
          rede: redeNome,
          status: 'error',
          message: error?.message ?? 'Erro inesperado ao publicar'
        });
      }
    }

    if (results.every((result) => result.status === 'error')) {
      throw new BadRequestException({
        message: 'Não foi possível publicar a notícia em nenhuma rede social.',
        results
      });
    }

    return { id_noticia, results };
  }
  

  
}