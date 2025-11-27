import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class LinkedInService {
  constructor(private readonly configService: ConfigService,
    private prisma: PrismaService
  ) {}

  

  private async uploadImageToLinkedIn(accessToken: string, linkedInId: string, imagePath: string): Promise<string> {
    const initUploadUrl = 'https://api.linkedin.com/v2/assets?action=registerUpload';
    const initUploadData = {
      registerUploadRequest: {
        recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
        owner: `urn:li:person:${linkedInId}`,
        serviceRelationships: [
          {
            relationshipType: 'OWNER',
            identifier: 'urn:li:userGeneratedContent',
          },
        ],
      },
    };

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    try {
      console.log('Initial upload request data:', JSON.stringify(initUploadData, null, 2));
      const initResponse = await axios.post(initUploadUrl, initUploadData, { headers });
      const uploadInfo = initResponse.data;
      console.log('Initial upload response:', uploadInfo);

      const uploadUrl = uploadInfo.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
      const asset = uploadInfo.value.asset;

      const imageFile = fs.readFileSync(imagePath);
      const uploadHeaders = {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/octet-stream', // Ensure correct content type
      };

      console.log('Uploading image to URL:', uploadUrl);
      const uploadResponse = await axios.put(uploadUrl, imageFile, { headers: uploadHeaders });

      if (uploadResponse.status !== 201) {
        throw new Error(`Error uploading image: ${uploadResponse.status}, ${uploadResponse.statusText}`);
      }

      return asset;
    }catch (error) {
      if (error.response) {
        const responseData = typeof error.response.data === 'string' 
          ? error.response.data.substring(0, 1000) 
          : JSON.stringify(error.response.data, null, 2);
    
        console.error('Error uploading image to LinkedIn:', {
          status: error.response.status,
          statusText: error.response.statusText,
          headers: error.response.headers,
          data: responseData,
        });
      } else {
        console.error('Error uploading image to LinkedIn:', error.message);
      }
      throw error;
    }
  }

  public async createPostWithImage(id_imagem: string, caption: string): Promise<any> {
    const accessToken = this.configService.get<string>('LINKEDIN_ACCESS_TOKEN');
    const linkedInId = this.configService.get<string>('LINKEDIN_ID');

    let media = [];
    if (id_imagem) {
      const imagem = await this.prisma.pn_anexos.findUnique({
        where:{
          id_anexo : id_imagem
        }
      })
      const asset = await this.uploadImageToLinkedIn(accessToken, linkedInId, `./uploads/portal_noticias/${imagem.nome_ficheiro}`);

      media = [
        {
          status: 'READY',
          description: {
            text: 'This is an image description.',
          },
          media: asset,
        },
      ];
    }
    const organizationId = '105713335';
    const postData = {
      author: `urn:li:organization:${organizationId}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: caption,
          },
          shareMediaCategory: id_imagem ? 'IMAGE' : 'NONE',
          media: media,
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    };

    const postUrl = 'https://api.linkedin.com/v2/ugcPosts';

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    };

    try {
      console.log('Creating post with data:', JSON.stringify(postData, null, 2));
      const response = await axios.post(postUrl, postData, { headers });

      if (response.status !== 201) {
        throw new Error(`Error creating post: ${response.status}, ${response.statusText}`);
      }

      return response.data;
    } catch (error) {
      if (error.response) {
        const responseData = typeof error.response.data === 'string' 
          ? error.response.data.substring(0, 1000) 
          : JSON.stringify(error.response.data, null, 2);
    
        console.error('Error creating post on LinkedIn:', {
          status: error.response.status,
          statusText: error.response.statusText,
          headers: error.response.headers,
          data: responseData,
        });
      } else {
        console.error('Error creating post on LinkedIn:', error.message);
      }
      throw error;
    }
  }
}