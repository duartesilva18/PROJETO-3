import { Injectable, NotFoundException } from '@nestjs/common';
import { TagDto } from "../dto/tag.dto";
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TagsService {
  constructor(private prisma: PrismaService) {}

  async get_Tags() {
    const tags = await this.prisma.pn_tag.findMany({
      select: {
        id_tag: true,
        nome: true,
        status: true,
        pn_noticia_Tag: true,
      }
    });

    if (tags.length === 0) return { message: "Não foram encontrados Tags" };
    return tags;
  }

  async activateTag(id: string) {
    const tag = await this.prisma.pn_tag.findUnique({
      where: { id_tag: id },
    });

    if (!tag) {
      throw new NotFoundException('Tag não encontrada');
    }

    return this.prisma.pn_tag.update({
      where: { id_tag: id },
      data: { status: 'Ativo' },
    });
  }

  async create_Tags(dto: TagDto) {
    try {
      return await this.prisma.pn_tag.create({
        data: {
          nome: dto.nome,
        }
      });
    } catch (error) {
      return {
        message: "Não foi possível concluir o pedido"
      };
    }
  }

  async delete_Tags(id: string) {
    try {
      const tagExist = await this.prisma.pn_tag.findUnique({
        where: { id_tag: id },
      });

      if (!tagExist) {
        throw new NotFoundException("Tag não encontrada.");
      }

      const updatedTag = await this.prisma.pn_tag.update({
        where: { id_tag: id },
        data: { status: "Inativo" },
      });

      return updatedTag;
    } catch (error) {
      console.error("Erro ao alterar o status da tag:", error);
      return { message: "Não foi possível concluir o pedido." };
    }
  }

  async update_Tags(id: string, dto: TagDto) {
    const tagExist = await this.prisma.pn_tag.findUnique({
      where: { id_tag: id },
    });

    if (!tagExist) {
      return {
        message: "Tag não encontrada"
      };
    }

    const data: { nome?: string; status?: string } = {};
    if (dto.nome) {
      data.nome = dto.nome;
    }
    if (dto.status) {
      data.status = dto.status;
    } else if (tagExist.status && tagExist.status.toLowerCase() !== 'ativo') {
      data.status = 'Ativo';
    }

    try {
      return await this.prisma.pn_tag.update({
        data,
        where: {
          id_tag: id,
        }
      });
    } catch (error) {
      return {
        message: "Não foi possível concluir o pedido"
      };
    }
  }

  async get_Tag(id: string) {
    try {
      return await this.prisma.pn_tag.findUnique({
        where: {
          id_tag: id,
        },
      });
    } catch (error) {
      return {
        message: "Não foi possível concluir o pedido"
      };
    }
  }
}
