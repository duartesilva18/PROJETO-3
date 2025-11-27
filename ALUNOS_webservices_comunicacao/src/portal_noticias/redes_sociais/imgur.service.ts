import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import axios from 'axios';
import * as fs from 'fs';
import * as FormData from 'form-data'; // Use a biblioteca form-data do Node.js

@Injectable()
export class ImgurService {
  private clientId: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.clientId = this.configService.get<string>('IMGUR_CLIENT_ID');
  }

  async uploadVideoToImgur(id_imagem: string): Promise<{ link: string, status: number }> {
    try {
        // Buscar os dados do anexo no banco de dados
        const imagem = await this.prisma.pn_anexos.findUnique({
            where: { id_anexo: id_imagem },
        });

        if (!imagem) {
            throw new Error(`Anexo com ID ${id_imagem} não encontrado`);
        }

        console.log(`Nome do ficheiro: ${imagem.nome_ficheiro}`);
        console.log(`Tipo de ficheiro: ${imagem.tipo}`);

        if (imagem.tipo.substring(0, 5) !== 'video') {
            throw new Error('O anexo não é um vídeo.');
        }

        const filePath = `./uploads/portal_noticias/${imagem.nome_ficheiro}`;
        const fileStream = fs.createReadStream(filePath);

        const formData = new FormData();
        formData.append('video', fileStream, imagem.nome_ficheiro);

        const uploadUrl = 'https://api.imgur.com/3/upload';
        const headers = {
            'Authorization': `Client-ID ${this.clientId}`,
            ...formData.getHeaders(),
        };

        const response = await axios.post(uploadUrl, formData, { headers });

        if (response.data.success && response.data.data.link) {
            console.log('Upload de vídeo concluído:', response.data);

            // Retorne os dados relevantes
            return {
                link: response.data.data.link, // Link do vídeo
                status: response.data.status, // Status HTTP (200)
            };
        } else {
            throw new Error('Falha no upload para Imgur: nenhuma URL encontrada na resposta');
        }
    } catch (error) {
        console.error('Erro ao fazer upload de vídeo para o Imgur:', error);
        throw new Error('Erro ao fazer upload de vídeo para o Imgur');
    }
  }

}
