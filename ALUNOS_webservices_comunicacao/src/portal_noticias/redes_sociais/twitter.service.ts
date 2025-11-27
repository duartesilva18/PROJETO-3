import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TwitterApi } from 'twitter-api-v2';
import axios from 'axios';
import { readFile } from 'fs/promises';
import { PrismaService } from 'src/prisma/prisma.service';
import * as ffmpeg from 'fluent-ffmpeg'; 

@Injectable()
export class TwitterService {
  private clientV1: TwitterApi;
  private clientV2: TwitterApi;

  constructor(private readonly configService: ConfigService,
    private prisma: PrismaService
  ) {
    this.clientV1 = new TwitterApi({
      appKey: this.configService.get<string>('TWITTER_CONSUMER_KEY'),
      appSecret: this.configService.get<string>('TWITTER_CONSUMER_SECRET'),
      accessToken: this.configService.get<string>('TWITTER_ACCESS_TOKEN'),
      accessSecret: this.configService.get<string>('TWITTER_ACCESS_TOKEN_SECRET'),
    });

    this.clientV2 = new TwitterApi({
      appKey: this.configService.get<string>('TWITTER_CONSUMER_KEY'),
      appSecret: this.configService.get<string>('TWITTER_CONSUMER_SECRET'),
      accessToken: this.configService.get<string>('TWITTER_ACCESS_TOKEN'),
      accessSecret: this.configService.get<string>('TWITTER_ACCESS_TOKEN_SECRET'),
    });
  }

  private isValidGuid(guid: string): boolean {
    const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return guidRegex.test(guid);
  }


  private getVideoDuration(filePath: string): Promise<number> {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err, metadata) => {
            if (err) {
                return reject(new Error(`Failed to retrieve video metadata: ${err.message}`));
            }
            const duration = metadata.format.duration;
            resolve(duration);
        });
    });
  }


  async postToTwitter(message: string, mediaUrls: string[] = []): Promise<any> {
    
    let fileIds = mediaUrls;
    let mediaId: string;
    let mediaIds: string[] = [];
    let videoCount = 0;
    let imageUrl = './uploads/portal_noticias/44a3f071-ae4b-4352-ad78-4a3f449892d4.mp4';
    console.log('mediaurls :', mediaUrls);
    

    



    try {
      


      if(mediaUrls.length == 1){

        const dados_anexo = await this.prisma.pn_anexos.findUnique({
          where:{
            id_anexo: mediaUrls[0]
          }
        })
    
    
       


        if(dados_anexo.tipo.substring(0, 5) === 'image') {

          const mediaData = await this.uploadMediaImage(dados_anexo.nome_ficheiro);
          mediaId = mediaData;
          console.log('Media uploaded with ID:', mediaId);

        }else {

          const mediaData = await this.uploadMediaVideo(`./uploads/portal_noticias/${dados_anexo.nome_ficheiro}`, dados_anexo.tipo)
          mediaId = mediaData;
          console.log('Media uploaded with ID:', mediaId);


        }



      } else {

        if (fileIds.length > 4) {
          console.warn('Twitter allows only 4 media files per tweet. Uploading the first 4 files.');
          fileIds = fileIds.slice(0, 4);  
        }

        for (const fileId of fileIds) {
          console.log(`Processing file with ID: ${fileId}`);

          const dados_anexo = await this.prisma.pn_anexos.findUnique({
              where: { id_anexo: fileId }
          });

          if (!dados_anexo) {
              throw new Error(`File with ID ${fileId} not found in the database`);
          }

          const mimeType = dados_anexo.tipo;

          if (mimeType.startsWith('video/')) {
              if (videoCount >= 1) {
                  throw new Error('Only one video is allowed per tweet.');
              }
              videoCount++;

              const filePath = `./uploads/portal_noticias/${dados_anexo.nome_ficheiro}`;
              const mediaId = await this.uploadMediaVideo(filePath, mimeType);
              mediaIds.push(mediaId);
          } else {
              // Upload images
              const mediaIdsForImages = await this.uploadMedia([fileId]); 
              mediaIds.push(...mediaIdsForImages); 
          }
        }



      }
      


      
   
      const tweetPayload: any = { text: message };
      
      if (mediaIds.length > 0) {
        tweetPayload.media = { media_ids: mediaIds };
      } else{

        if (mediaId) {
          tweetPayload.media = { media_ids: [mediaId] };
        }


      }

      

      const response = await this.clientV2.v2.tweet(tweetPayload);
      console.log('Tweet posted:', response);
      return response;
    } catch (error) {
      console.error('Error posting to Twitter:', error);
      throw new Error(`Erro ao postar no Twitter: ${error.response?.data?.errors?.[0]?.message || error.message}`);
    }
  }

  


  private async uploadMediaVideo(videoPath: string, mimeType: string, mediaCategory = 'tweet_video'): Promise<string> {
    const fs = require('fs');
    const { readFileSync } = fs;

    try {
        console.log('Iniciando upload do vídeo...');

        // Preparação do vídeo
        const videoBuffer = readFileSync(videoPath);
        const options = {
            mediaCategory,
            mimeType,
            chunkLength: 5 * 1024 * 1024, // 5 MB
        };

        // Upload usando o método 'uploadMedia'
        const fullMediaData = await this.clientV1.v1.uploadMedia(videoBuffer, options, true);

        console.log('Upload do vídeo concluído com sucesso! Media ID:', fullMediaData.media_id_string);
        return fullMediaData.media_id_string;
    } catch (error) {
        console.error('Erro ao fazer upload do vídeo no Twitter:', error);
        throw new Error(`Erro ao enviar vídeo para o Twitter: ${error.message}`);
    }
}



async uploadMedia(fileIds: string[]): Promise<string[]> {
  console.log('Received file IDs:', fileIds);

  const mediaIds: string[] = [];
  try {
      for (const fileId of fileIds) {
          console.log(`Processing file with ID: ${fileId}`);

   
          const cleanedFileId = fileId.trim();
          if (!this.isValidGuid(cleanedFileId)) {
              throw new Error(`Invalid GUID format for ID: ${cleanedFileId}`);
          }

   
          const formattedFileId = cleanedFileId.toLowerCase();

    
          const dados_anexo = await this.prisma.pn_anexos.findUnique({
              where: { id_anexo: formattedFileId },
          });

          if (!dados_anexo) {
              throw new Error(`File with ID ${formattedFileId} not found in the database.`);
          }

          const mimeType = dados_anexo.tipo;
          console.log('File MIME type:', mimeType);

          const filePath = `./uploads/portal_noticias/${dados_anexo.nome_ficheiro}`;

          const mediaResponse = await this.clientV1.v1.uploadMedia(filePath, { mimeType });
          console.log('Media upload response:', mediaResponse);

          mediaIds.push(mediaResponse);  
      }

      console.log('All media uploaded successfully:', mediaIds);
      return mediaIds;
  } catch (error) {
      console.error('Error uploading media:', error);
      throw new Error(`Error uploading media: ${error.message}`);
  }
}

  private async uploadMediaImage(file_name: string): Promise<string> {
    try {
      // Upload the image to Twitter using v1.1 API
      //const mediaResponse = await this.clientV1.v1.uploadMedia(imageBuffer, { mimeType });
      const mediaResponse = await this.clientV1.v1.uploadMedia(`./uploads/portal_noticias/${file_name}`);
      console.log('Media upload response:', mediaResponse);

      // Return the media ID
      return mediaResponse;
    } catch (error) {
      console.error('Error uploading media to Twitter:', error);
      throw new Error(`Erro ao fazer upload da mídia no Twitter: ${error.response?.data?.errors?.[0]?.message || error.message}`);
    }
  }
}