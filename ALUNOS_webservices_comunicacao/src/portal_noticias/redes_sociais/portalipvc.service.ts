import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PortalIPVCService implements OnModuleInit {
  private readonly logger = new Logger(PortalIPVCService.name);

  constructor(
    private readonly configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  async onModuleInit() {
    this.logger.log('[PortalIPVCService] Serviço inicializado. Conexão ao WordPress será implementada futuramente.');
  }

  /**
   * Publica uma notícia no Portal IPVC (WordPress)
   * Por enquanto, apenas simula a publicação. A integração com WordPress será implementada futuramente.
   * 
   * @param titulo Título da notícia
   * @param conteudo Conteúdo/texto da notícia
   * @param id_imagem ID do anexo de imagem (apenas 1 imagem permitida)
   * @param tags Tags formatadas como string
   * @param id_noticia ID da notícia no sistema
   * @returns Resultado da publicação
   */
  public async postToPortalIPVC(
    titulo: string,
    conteudo: string,
    id_imagem: string | null,
    tags: string,
    id_noticia: string,
  ): Promise<any> {
    // Validar que apenas 1 imagem foi fornecida (se houver)
    if (id_imagem) {
      const imagem = await this.prisma.pn_anexos.findUnique({
        where: {
          id_anexo: id_imagem,
        },
      });

      if (!imagem) {
        throw new Error('Imagem não encontrada');
      }

      if (!imagem.tipo.startsWith('image/')) {
        throw new Error('Apenas imagens são permitidas para o Portal IPVC');
      }
    }

    // TODO: Implementar conexão com WordPress REST API
    // Por enquanto, apenas registamos o log e retornamos sucesso simulado
    this.logger.log(`[PortalIPVCService] Preparando publicação da notícia ${id_noticia} no Portal IPVC`);
    this.logger.log(`[PortalIPVCService] Título: ${titulo}`);
    this.logger.log(`[PortalIPVCService] Imagem: ${id_imagem ? id_imagem : 'Nenhuma'}`);
    this.logger.log(`[PortalIPVCService] Tags: ${tags}`);

    // Simulação de sucesso - será substituído pela integração real com WordPress
    return {
      success: true,
      message: 'Notícia preparada para publicação no Portal IPVC (integração WordPress pendente)',
      postId: null, // Será preenchido quando a integração com WordPress estiver completa
      url: null, // URL do post no WordPress (quando implementado)
    };
  }
}















