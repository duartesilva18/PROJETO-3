import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { readFile } from 'fs/promises';
import ImgurClient from 'imgur';
import { PrismaService } from 'src/prisma/prisma.service';
import { readFileIntoBuffer } from 'twitter-api-v2/dist/esm/v1/media-helpers.v1';

@Injectable()
export class FacebookService {
  private imgurClient: ImgurClient;
  private pageId: string;

  constructor(private readonly configService: ConfigService,
    private prisma: PrismaService
  ) {
    const clientId = this.configService.get<string>('IMGUR_CLIENT_ID');
    this.imgurClient = new ImgurClient({ clientId });
    this.pageId = this.configService.get<string>('FACEBOOK_PAGE_ID');
  }

  async uploadMediaToHosting(nome_ficheiro: string, tipo: string): Promise<string> {
    try {
      
      console.log(`Nome do ficheiro: ${nome_ficheiro}`);
      console.log(`tipo de file: ${tipo}`);
      //const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      

      
      let imgurResponse;

      if (tipo.substring(0, 5) === 'image') {
        const imageData = (await readFile(`./uploads/portal_noticias/${nome_ficheiro}`)).toString('base64');
        imgurResponse = await this.imgurClient.upload({
          image: imageData,
          type: 'base64',
        });
        console.log('Upload de imagem concluído:', imgurResponse);
      } /*else if (tipo.substring(0, 5) === 'video') {
        const videoData = (await readFile(`./uploads/portal_noticias/${nome_ficheiro}`)).toString('base64');
        imgurResponse = await this.imgurClient.upload({
            video: videoData, 
            type: 'base64',
        });
      }*/else {
        throw new Error('Tipo de ficheiro não suportado.');
      }
      if (imgurResponse.success && imgurResponse.data && imgurResponse.data.link) {
        return imgurResponse.data.link;
      } else {
        throw new Error('Imgur upload failed: no link in response');
      }
    } catch (error) {
      console.error('Error uploading image to hosting service:', error);
      throw new Error('Error uploading image to hosting service');
    }
  }




  
async postToFacebook(message: string, mediaUrls: string[] = []): Promise<any> {
  
  let url: string;
  let payload: any;
  const pageAccessToken = this.configService.get<string>('META_PAGE_ACCESS_TOKEN');
  const mediaIds: { media_fbid: string }[] = [];

  if(mediaUrls.length == 1){

  
    const dados_anexo = await this.prisma.pn_anexos.findUnique({
      where:{
        id_anexo: mediaUrls[0]
      }
    })


    if(dados_anexo.tipo.substring(0, 5) === 'image') {

      const hostedImageUrl = await this.uploadMediaToHosting(dados_anexo.nome_ficheiro, dados_anexo.tipo);
      console.log('Hosted Image URL:', hostedImageUrl);

      // Use o endpoint /photos para postar a imagem
      url = `https://graph.facebook.com/${this.pageId}/photos`;
      payload = {
        url: hostedImageUrl,
        caption: message,
        access_token: pageAccessToken,
      };

    }else {

      const hostedVideoUrl = await this.uploadMediaToHosting(dados_anexo.nome_ficheiro, dados_anexo.tipo);
      console.log('Hosted Image URL:', hostedVideoUrl);
      await new Promise(resolve => setTimeout(resolve, 5000));

      const teste2 = 'https://i.imgur.com/uY45g7a.mp4';
      const teste = 'https://cristovao.portugalinteractivo.com/teste.mp4';
      url = `https://graph.facebook.com/${this.pageId}/videos`;
      payload = {
          file_url: hostedVideoUrl, 
          description: message, 
          access_token: pageAccessToken, 
      };



    }
    
    try {
      const response = await axios.post(url, payload);
      return response.data;
    } catch (error) {
      console.error('Erro ao postar no Facebook:', error.response?.data);
      throw new Error(`Erro ao postar no Facebook: ${error.message}`);
    }




  } else if(mediaUrls.length == 0){

    // Use o endpoint /feed para postar a mensagem
    url = `https://graph.facebook.com/${this.pageId}/feed`;
    payload = {
      message,
      access_token: pageAccessToken,
    };





  } else if(mediaUrls.length > 1) {

    for (const mediaUrl of mediaUrls) {

      let payload: any;
  
      const dados_anexo = await this.prisma.pn_anexos.findUnique({
        where:{
          id_anexo: mediaUrl
        }
      })
     
        // Upload de imagem
        const hostedImageUrl = await this.uploadMediaToHosting(dados_anexo.nome_ficheiro, dados_anexo.tipo); 
        console.log('Hosted Image URL:', hostedImageUrl);
  
        url = `https://graph.facebook.com/${this.pageId}/photos`;
        payload = {
          url: hostedImageUrl, 
          published: false,  
          access_token: pageAccessToken,
        };
    
  
      try {
        // Faz o upload da mídia e armazena o ID resultante
        const response = await axios.post(url, payload);
        console.log(`Uploaded Media: ${JSON.stringify(response.data)}`);
        mediaIds.push({ media_fbid: response.data.id });
      } catch (error) {
        console.error('Erro ao fazer upload da mídia:', error.response?.data);
        throw new Error(`Erro ao fazer upload da mídia: ${error.message}`);
      }
    }
  
    // Criação do post com as mídias associadas
    const feedUrl = `https://graph.facebook.com/${this.pageId}/feed`;
    const feedPayload = {
      message,
      attached_media: mediaIds,
      access_token: pageAccessToken,
    };
  
    try {
      const response = await axios.post(feedUrl, feedPayload);
      console.log('Post Created:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar o post no Facebook:', error.response?.data);
      throw new Error(`Erro ao criar o post no Facebook: ${error.message}`);
    }



  }
  
 
}





}