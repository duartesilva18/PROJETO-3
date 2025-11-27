import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as sharp from 'sharp';
import ImgurClient from 'imgur';
import { PrismaService } from 'src/prisma/prisma.service';
import { readFile } from 'fs/promises';

@Injectable()
export class InstagramService {
  private imgurClient: ImgurClient;

  constructor(private readonly configService: ConfigService,
    private prisma: PrismaService
  ) {
    const clientId = this.configService.get<string>('IMGUR_CLIENT_ID');
    this.imgurClient = new ImgurClient({ clientId });
  }

  async resizeImage(id_imagem: string, outputSize = { width: 1080, height: 1080 }): Promise<Buffer> {
    //const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const imagem = await this.prisma.pn_anexos.findUnique({
      where:{
        id_anexo : id_imagem
      }
    })
    const imageBuffer = await readFile(`./uploads/portal_noticias/${imagem.nome_ficheiro}`)
    const resizedImage = await sharp(imageBuffer)
      .resize(outputSize.width, outputSize.height)
      .jpeg()
      .toBuffer();

    return resizedImage;
  }

  async uploadMediaToHosting(imageData: Buffer): Promise<string> {
    try {
      console.log('Uploading image to hosting service...');
      const response = await this.imgurClient.upload({
        image: imageData.toString('base64'),
        type: 'base64',
      });
      console.log('Imgur upload response:', response);
      if (response.success && response.data && response.data.link) {
        return response.data.link;
      } else {
        throw new Error('Imgur upload failed: no link in response');
      }
    } catch (error) {
      console.error('Error uploading image to hosting service:', error);
      throw new Error('Error uploading image to hosting service');
    }
  }

  async uploadMediaVideoToHosting(videoData: string): Promise<string> {
    console.log('videodata na finçao :  ', videoData);
    try {
      console.log('Uploading image to hosting service...');
      const video = (await readFile(`./uploads/portal_noticias/${videoData}`)).toString('base64');
      const response = await this.imgurClient.upload({
        //video: video,
        type: 'base64',
      });
      console.log('Imgur upload response:', response);
      if (response.success && response.data && response.data.link) {
        return response.data.link;
      } else {
        throw new Error('Imgur upload failed: no link in response');
      }
    } catch (error) {
      console.error('Error uploading image to hosting service:', error);
      throw new Error('Error uploading image to hosting service');
    }
  }

  async uploadVideo(igUserId: string, videoUrl: string, caption: string, accessToken: string): Promise<any> {
   
    const url = `https://graph.facebook.com/v14.0/${igUserId}/media`;
   
    const payload = {
      media_type: 'REELS',
      video_url: videoUrl,
      caption: caption,
      access_token: accessToken,
    };

    console.log('Upload Media Request:', payload);

    try {
      const response = await axios.post(url, payload);
      const { id: containerId } = response.data;
      console.log('Upload Media Response:', response.data);

      const status = await this.checkStatus(containerId, accessToken);

      if (status === 'FINISHED') {
        console.log('O vídeo foi carregado com sucesso.');
        return response.data;
      } else {
        throw new Error('O upload do vídeo falhou ou demorou muito para ser concluído.');
      }


      
    } catch (error) {
      console.error('Upload Media Error Response:', error.response?.data);
      throw error;
    }
  }


  async uploadMedia(igUserId: string, imageUrl: string, caption: string, accessToken: string): Promise<any> {
    console.log('imageUrl do insta :', imageUrl);
    const url = `https://graph.facebook.com/v14.0/${igUserId}/media`;
    const payload = {
      image_url: imageUrl,
      caption: caption,
      access_token: accessToken,
    };

    console.log('Upload Media Request:', payload);

    try {
      const response = await axios.post(url, payload);
      return response.data;
    } catch (error) {
      console.error('Upload Media Error Response:', error.response?.data);
      throw error;
    }
  }


  async checkStatus(igContainerId: string, accessToken: string): Promise<any> {

    const statusUrl = `https://graph.facebook.com/v14.0/${igContainerId}`;
    const timeout = 120000; 
    const interval = 10000; 
    const startTime = Date.now();

    console.log('Iniciando a verificação do status do upload...');

    while (Date.now() - startTime < timeout) {
      try {
        const response = await axios.get(statusUrl, {
          params: { access_token: accessToken, fields: 'status_code' },
        });

        const { status_code } = response.data;
        console.log('Status do Upload:', status_code);

        if (status_code === 'FINISHED') {
          return 'FINISHED';
        } else if (status_code === 'ERROR') {
          throw new Error('O upload falhou durante o processamento.');
        }

        // Aguarda 10 segundos antes de verificar novamente
        await new Promise((resolve) => setTimeout(resolve, interval));
      } catch (error) {
        console.error('Erro ao verificar o status:', error.response?.data || error.message);
        throw error;
      }
    }

    throw new Error('O upload do vídeo demorou muito para ser concluído.');
    


  }
  
  async checkMediaReady(mediaIds: string[], accessToken: string): Promise<void> {
    const timeout = 120000; 
    const interval = 5000; 
    const startTime = Date.now();
  
    console.log('Verificando se todas as mídias estão prontas...');
  
    while (Date.now() - startTime < timeout) {
      const notReady = [];
  
      for (const mediaId of mediaIds) {
        const statusUrl = `https://graph.facebook.com/v14.0/${mediaId}`;
        try {
          const response = await axios.get(statusUrl, {
            params: { access_token: accessToken, fields: 'status_code' },
          });
          const { status_code } = response.data;
  
          if (status_code !== 'FINISHED') {
            console.log(`Mídia ${mediaId} ainda não está pronta: ${status_code}`);
            notReady.push(mediaId);
          }
        } catch (error) {
          console.error(`Erro ao verificar status da mídia ${mediaId}:`, error.response?.data || error.message);
          throw error;
        }
      }
  
      if (notReady.length === 0) {
        console.log('Todas as mídias estão prontas!');
        return;
      }
  
      console.log('Aguardando antes de verificar novamente...');
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
  
    throw new Error('O tempo de espera expirou. Algumas mídias ainda não estão prontas.');
  }

  async checkCarouselReady(carouselId: string, accessToken: string): Promise<void> {
    console.log('Verificando se o carrossel está pronto para publicação...');
  
    while (true) { // Loop infinito até que o status seja FINISHED
      try {
        const statusUrl = `https://graph.facebook.com/v14.0/${carouselId}`;
        const response = await axios.get(statusUrl, {
          params: { access_token: accessToken, fields: 'status_code' }, // Somente status_code
        });
        const { status_code } = response.data;
  
        console.log(`Status do carrossel (${carouselId}): ${status_code}`);
        
        if (status_code === 'FINISHED') {
          console.log('O carrossel está pronto para publicação!');
          return; // Retorna quando o status for FINISHED
        }
  
        if (status_code === 'ERROR') {
          // Exibe uma mensagem de erro geral, incluindo a causa possível
          console.error('Erro no processamento do carrossel. A causa pode estar em outra parte do processo.');
          console.error(response.data);
          throw new Error(`Erro no processamento do carrossel. Status: ERROR`);
        }
      } catch (error) {
        // Exibe o erro de forma mais detalhada
        if (error.response && error.response.data) {
          console.error('Erro ao verificar status do carrossel:', error.response.data); 
          const errorDetails = error.response.data.error;
          console.error(`Detalhes do erro:`, errorDetails);
          console.error(`Mensagem do erro: ${errorDetails.message}`);
        } else {
          console.error('Erro desconhecido ao verificar o status do carrossel:', error.message);
        }
        throw error;
      }
  
      console.log('Carrossel ainda não está pronto. Aguardando...');
      await new Promise((resolve) => setTimeout(resolve, 5000)); 
    }
  }
  
  
  
  



  async uploadCarouselPost(igUserId: string, mediaUrls: string[] = [], caption: string, accessToken: string): Promise<any> {
    try {
      const mediaIds: string[] = [];
  
      // Upload de cada mídia no array
      for (const mediaUrl of mediaUrls) {
        const isVideo = mediaUrl.endsWith('.mp4') || mediaUrl.endsWith('.avi') || mediaUrl.endsWith('.mov');
        let response;
  
        if (isVideo) {
          response = await this.uploadVideo(igUserId, mediaUrl, caption, accessToken);
        } else {
          
          let imageData = await this.resizeImage(mediaUrl);
          let hostedImageUrl = await this.uploadMediaToHosting(imageData);
          
          response = await this.uploadMedia(igUserId, hostedImageUrl, caption, accessToken);
        }
  
        const mediaId = response.id;
        console.log(`Mídia carregada com sucesso (${isVideo ? 'VIDEO' : 'IMAGE'}):`, mediaId);
        mediaIds.push(mediaId);
      }
  

      await this.checkMediaReady(mediaIds, accessToken);
  

      console.log('Criando o carrossel com as mídias:', mediaIds);
      const carouselUrl = `https://graph.facebook.com/v14.0/${igUserId}/media`;
      const carouselPayload = {
        media_type: 'CAROUSEL',
        children: mediaIds,
        caption: caption,
        access_token: accessToken,
      };
  
      const carouselResponse = await axios.post(carouselUrl, carouselPayload);
      const carouselCreationId = carouselResponse.data.id;
      console.log('Carrossel criado com sucesso:', carouselCreationId);
  

      await this.checkCarouselReady(carouselCreationId, accessToken);
  

      console.log('Publicando o carrossel...');
      const publishResponse = await this.publishMedia(igUserId, carouselCreationId, accessToken);
      console.log('Carrossel publicado com sucesso:', publishResponse);
  
      return publishResponse;
    } catch (error) {
      console.error('Erro ao criar o carrossel:', error.response?.data || error.message);
      throw error;
    }
  }

  async publishMedia(igUserId: string, creationId: string, accessToken: string): Promise<any> {
    const url = `https://graph.facebook.com/v14.0/${igUserId}/media_publish`;
    const payload = {
      creation_id: creationId,
      access_token: accessToken,
    };

    console.log('Publish Media Request:', payload);

    try {
      const response = await axios.post(url, payload);
      return response.data;
    } catch (error) {
      console.error('Publish Media Error Response:', error.response?.data);
      throw error;
    }
  }

  async postToInstagram(mediaUrls: string[] = [], caption: string): Promise<any> {
    const igUserId = this.configService.get<string>('INSTAGRAM_USER_ID');
    const accessToken = this.configService.get<string>('META_PAGE_ACCESS_TOKEN');

  

    if(mediaUrls.length == 1){

      const dados_anexo = await this.prisma.pn_anexos.findUnique({
        where:{
          id_anexo: mediaUrls[0]
        }
      })

      


      let uploadResponse;

      try {

        if(dados_anexo.tipo.substring(0, 5) === 'image'){

          const imageData = await this.resizeImage(mediaUrls[0]);
          const hostedImageUrl = await this.uploadMediaToHosting(imageData);
          console.log('Hosted Image URL:', hostedImageUrl);
          uploadResponse = await this.uploadMedia(igUserId, hostedImageUrl, caption, accessToken);

        } else {
          const hostedImageUrl = await this.uploadMediaVideoToHosting(dados_anexo.nome_ficheiro);
          await new Promise(resolve => setTimeout(resolve, 5000));

          uploadResponse = await this.uploadVideo(igUserId, hostedImageUrl, caption, accessToken);
            
          
        }

        if (uploadResponse.id) {
          console.error('uploadResponse :',uploadResponse.id);
          const publishResponse = await this.publishMedia(igUserId, uploadResponse.id, accessToken);
          return publishResponse;
        } else {
          throw new Error('Error uploading media to Instagram');
        }

      } catch (error){

        console.error('Error posting to Instagram:', error);

      }

      
    }else {

      try {

        const response = await this.uploadCarouselPost(igUserId, mediaUrls, caption, accessToken);
        console.log('Postagem criada com sucesso:', response);
  
  
      } catch (error) {
  
        console.error('Erro ao criar a postagem:', error);
  
  
      }



    }

    

  
  
  
  }




}