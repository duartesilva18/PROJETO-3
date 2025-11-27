import { Injectable } from '@nestjs/common';
import { Radio_Jornal_Dto } from '../dto/radio_jornal.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class RadioJornalService {
  constructor(private readonly prisma: PrismaService) {}

  async get_RadiosJornais() {
    const radiosJornais = await this.prisma.pn_radio_jornal.findMany({
      select: {
        id_radio_jornal: true,
        nome: true,
        email: true,
        data_criacao: true
      }
    });

    if (radiosJornais.length === 0) {
      return { message: 'Não foram encontrados rádios/jornais' };
    }

    return radiosJornais;
  }

  async create_RadioJornal(dto: Radio_Jornal_Dto) {
    try {
      const novoRadioJornal = await this.prisma.pn_radio_jornal.create({
        data: {
          nome: dto.nome,
          email: dto.email
        }
      });

      return novoRadioJornal;
    } catch (error) {
      console.error('Erro ao criar RadioJornal:', error);
      return { message: 'Não foi possível concluir o pedido' };
    }
  }

  async delete_RadioJornal(id: string) {
    const radioJornalExist = await this.prisma.pn_radio_jornal.findUnique({
      where: { id_radio_jornal: id }
    });

    if (!radioJornalExist) {
      return { message: 'Rádio/Jornal não encontrado' };
    }

    try {
      return await this.prisma.pn_radio_jornal.delete({
        where: { id_radio_jornal: id }
      });
    } catch (error) {
      console.error('Erro ao apagar RadioJornal:', error);
      return { message: 'Não foi possível concluir o pedido' };
    }
  }

  async update_RadioJornal(id: string, dto: Radio_Jornal_Dto) {
    const radio_id = String(id);

    const radioJornalExist = await this.prisma.pn_radio_jornal.findUnique({
      where: { id_radio_jornal: radio_id }
    });

    if (!radioJornalExist) {
      return { message: 'Rádio/Jornal não encontrado' };
    }

    try {
      return await this.prisma.pn_radio_jornal.update({
        where: { id_radio_jornal: radio_id },
        data: {
          nome: dto.nome,
          email: dto.email
        }
      });
    } catch (error) {
      console.error('Erro ao atualizar RadioJornal:', error);
      return { message: 'Não foi possível concluir o pedido' };
    }
  }

  async get_RadioJornal(id: string) {
    try {
      const radioJornal = await this.prisma.pn_radio_jornal.findUnique({
        where: { id_radio_jornal: id }
      });

      if (!radioJornal) {
        return { message: 'Rádio/Jornal não encontrado' };
      }

      return radioJornal;
    } catch (error) {
      console.error('Erro ao obter RadioJornal:', error);
      return { message: 'Não foi possível concluir o pedido' };
    }
  }
}
