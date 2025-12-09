import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as sharp from 'sharp';
import ImgurClient from 'imgur';
import { PrismaService } from 'src/prisma/prisma.service';
import { readFile } from 'fs/promises';

@Injectable()
export class InstagramService implements OnModuleInit {
  private imgurClient: ImgurClient;
  private readonly logger = new Logger(InstagramService.name);

  constructor(
    private readonly configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const clientId = this.configService.get<string>('IMGUR_CLIENT_ID');
    this.imgurClient = new ImgurClient({ clientId });
  }

  // ✅ CHAMADO AUTOMATICAMENTE AO ARRANCAR A API
  async onModuleInit() {
    try {
      await this.logContaAssociada();
    } catch (error) {
      this.logger.warn(
        `Não foi possível obter a conta do Instagram ao iniciar: ${error?.message ?? error}`,
      );
    }
  }

  // ✅ MÉTODO QUE IDENTIFICA A CONTA DE INSTAGRAM USADA
  async logContaAssociada() {
    const igUserId = this.configService.get<string>('INSTAGRAM_USER_ID');
    const accessToken = this.configService.get<string>('META_PAGE_ACCESS_TOKEN');

    if (!igUserId || !accessToken) {
      throw new Error('INSTAGRAM_USER_ID ou META_PAGE_ACCESS_TOKEN não configurados.');
    }

    const response = await axios.get(
      `https://graph.facebook.com/v14.0/${igUserId}`,
      {
        params: {
          access_token: accessToken,
          fields: 'id,username,name',
        },
      },
    );

    const { id, username, name } = response.data;

    this.logger.log(
      `Conta Instagram autenticada: @${username ?? 'n/a'} (${name ?? id})`,
    );

    return response.data;
  }

  async resizeImage(
    id_imagem: string,
    outputSize = { width: 1080, height: 1080 },
  ): Promise<Buffer> {
    const imagem = await this.prisma.pn_anexos.findUnique({
      where: { id_anexo: id_imagem },
    });

    const imageBuffer = await readFile(
      `./uploads/portal_noticias/${imagem.nome_ficheiro}`,
    );

    return sharp(imageBuffer)
      .resize(outputSize.width, outputSize.height)
      .jpeg()
      .toBuffer();
  }

  async uploadMediaToHosting(imageData: Buffer): Promise<string> {
    const response = await this.imgurClient.upload({
      image: imageData.toString('base64'),
      type: 'base64',
    });

    if (response.success && response.data?.link) {
      return response.data.link;
    }

    throw new Error('Imgur upload failed');
  }

  async uploadVideo(
    igUserId: string,
    videoUrl: string,
    caption: string,
    accessToken: string,
  ): Promise<any> {
    const url = `https://graph.facebook.com/v14.0/${igUserId}/media`;

    const payload = {
      media_type: 'REELS',
      video_url: videoUrl,
      caption,
      access_token: accessToken,
    };

    const response = await axios.post(url, payload);
    return response.data;
  }

  async publishMedia(
    igUserId: string,
    creationId: string,
    accessToken: string,
  ): Promise<any> {
    const url = `https://graph.facebook.com/v14.0/${igUserId}/media_publish`;

    const payload = {
      creation_id: creationId,
      access_token: accessToken,
    };

    const response = await axios.post(url, payload);
    return response.data;
  }

  async postToInstagram(mediaUrls: string[] = [], caption: string): Promise<any> {
    const igUserId = this.configService.get<string>('INSTAGRAM_USER_ID');
    const accessToken = this.configService.get<string>('META_PAGE_ACCESS_TOKEN');

    try {
      const conta = await this.logContaAssociada();
      this.logger.log(`A publicar como @${conta.username}`);
    } catch {
      this.logger.warn('Não foi possível confirmar a conta antes da publicação.');
    }

    // resto da lógica mantém-se igual
  }
}
