import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProjetoDto } from '../dto/projeto.dto';
import axios from 'axios';

@Injectable()
export class ProjetosService {
  constructor(private readonly prisma: PrismaService) {}

  async listar() {
    try {
      // Tentar ir buscar ao webservice real do IPVC
      const externalURL = "https://si-tech.ipvc.pt/api/sitech/application/public_web";
      const response = await axios.get(externalURL);
      
      if (response.data && response.data.status === "success") {
        return (response.data.data || []).map(p => ({
          id_projeto: p.id,
          assunto: p.acronym,
          descricao: p.description,
          estado: 'Ativo',
          data_criacao: p.start_date
        }));
      }
    } catch (error) {
      console.error('Erro ao listar projetos do webservice externo, a carregar locais:', error.message);
    }

    // Fallback para projetos locais se o webservice falhar
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

