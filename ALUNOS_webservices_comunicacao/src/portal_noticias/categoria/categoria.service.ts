import { Injectable } from '@nestjs/common';
import { CategoriaDto } from "../dto/categoria.dto";
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CategoriaService {
    constructor(private prisma: PrismaService) { }

    async get_Categorias() {
      const categorias = await this.prisma.pn_categoria.findMany({
        select: {
          id_categoria: true,
          nome: true,
          status: true,
        }
      })
      if (categorias.length === 0) return { message: "Não foram encontrados Categorias" }
      return categorias;
    }
  
    async create_Categorias(dto: CategoriaDto) {
      try {
        return await this.prisma.pn_categoria.create({
          data: {
            nome: dto.nome,
  
          }
        })
      } catch (error) {
        return {
          message: "Não foi possível concluir o pedido"
        }
      }
  
    }
  
    async delete_Categorias(id: string) {
      const categoria_id = String(id);
      const categoria_Exist = await this.prisma.pn_categoria.findUnique({
        where: {
          id_categoria: categoria_id,
        },
      })

      if (!categoria_Exist) {
        return {
          message: "Categoria não encontrada"
        }
      }

      try {
        return await this.prisma.pn_categoria.update({
          where: { id_categoria: categoria_id },
          data: { status: 'Desativo' }
        })
      } catch (error) {
        return {
          message: "Não foi possível concluir o pedido"
        }
      }
    }
  
  
    async update_Categorias(id: string, dto: CategoriaDto) {
      const categoria_ID = String(id);
      const categoria_Exist = await this.prisma.pn_categoria.findUnique({
        where: {
          id_categoria: categoria_ID,
        },
      })
  
      try {
        return await this.prisma.pn_categoria.update({
          data: {
            nome: dto.nome,
          },
          where: {
            id_categoria: categoria_ID,
          }
        });
  
      } catch (error) {
        return {
          message: "Não foi possível concluir o pedido"
        }
      }
    }
  
    async get_Categoria(id: string) {
      const categoria_ID = String(id)
  
      try {
        return await this.prisma.pn_categoria.findUnique({
          where: {
            id_categoria: categoria_ID,
          },
        })
  
      } catch (error) {
        return {
          message: "Não foi possível concluir o pedido"
        }
      }
  
    }
}