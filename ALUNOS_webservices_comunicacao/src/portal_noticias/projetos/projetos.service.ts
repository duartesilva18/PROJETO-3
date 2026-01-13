import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProjetoDto } from '../dto/projeto.dto';

@Injectable()
export class ProjetosService {
  constructor(private readonly prisma: PrismaService) {}

  async listar() {
    return this.prisma.pn_projeto.findMany({
      select: {
        id_projeto: true,
        assunto: true,
        descricao: true,
        estado: true,
        data_criacao: true
      },
      orderBy: { data_criacao: 'desc' }
    });
  }

  async obter(id: number) {
    const projeto = await this.prisma.pn_projeto.findUnique({
      where: { id_projeto: id }
    });
    if (!projeto) throw new NotFoundException('Projeto não encontrado');
    return projeto;
  }

  async criar(dto: ProjetoDto) {
    return this.prisma.pn_projeto.create({
      data: {
        assunto: dto.assunto,
        descricao: dto.descricao ?? null,
        estado: dto.estado ?? 'Ativo'
      }
    });
  }

  async atualizar(id: number, dto: ProjetoDto) {
    await this.obter(id);
    return this.prisma.pn_projeto.update({
      where: { id_projeto: id },
      data: {
        assunto: dto.assunto,
        descricao: dto.descricao ?? null,
        estado: dto.estado ?? 'Ativo'
      }
    });
  }

  async remover(id: number) {
    await this.obter(id);
    return this.prisma.pn_projeto.delete({ where: { id_projeto: id } });
  }
}

