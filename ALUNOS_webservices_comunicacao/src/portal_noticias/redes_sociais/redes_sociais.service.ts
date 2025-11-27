import { Injectable } from '@nestjs/common';
import { Redes_Sociais_Dto } from '../dto/redes_sociais.dto';
import { FacebookService } from './facebook.service';
import { TwitterService } from './twitter.service';
import { InstagramService } from './instagram.service';
import { LinkedInService } from './linkedin.service';
import { ImgurService } from './imgur.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { NoticiasService } from '../noticias/noticias.service';

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
  
  

  
}