import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { DtoCorpoEmail } from './dto/corpo_email_dto';
import { TIPOS_EMAIL } from './static/emails_templates';
import * as nodemailer from 'nodemailer';
import * as path from 'path';

@Injectable()
export class service {
    constructor(private prisma: PrismaService) {}

    async enviarNotificacaoEmail(corpo: DtoCorpoEmail){
        console.log('[NOTIFICACAO] Pedido de envio de email recebido', corpo);

        if(!Object.keys(TIPOS_EMAIL).includes(corpo.tipo)){
            console.warn('[NOTIFICACAO] Tipo de email inválido', { tipo: corpo.tipo });
            return {status: false, message: "Tipo inválido."}
        }

        let info_tipo = TIPOS_EMAIL[corpo.tipo];
        let cumpre_campos = true;
        Object.values(info_tipo.campos).forEach((campo: any) => {
            if(campo.obrigatorio && !Object.keys(corpo.dados_tipo).includes(campo.nome)){
                cumpre_campos = false;
                return;
            }
            if(campo.com_valor && !corpo.dados_tipo[campo.nome]){
                cumpre_campos = false;
                return;
            }
        });
        /*if(!cumpre_campos){
            console.warn('[NOTIFICACAO] Dados em falta para o tipo selecionado', {
                tipo: corpo.tipo,
                dados_tipo: corpo.dados_tipo
            });
            return {status: false, message: "Dados em falta para o tipo selecionado."}
        }*/
        let mesagem_enviar = info_tipo.template(...Object.values(corpo.dados_tipo))

        console.log('[NOTIFICACAO] Mensagem gerada para envio', {
            email: corpo.email,
            assunto: corpo.assunto,
            tipo: corpo.tipo
        });

        // Anexos opcionais (imagens) para emails de mídia do portal de notícias
        const attachments: nodemailer.Attachment[] = [];

        if (
            corpo.tipo === 'portal_noticias_midia' &&
            corpo.dados_tipo &&
            corpo.dados_tipo.id_noticia
        ) {
            try {
                const idNoticia = String(corpo.dados_tipo.id_noticia);

                // Para simplificar: anexar todas as imagens da notícia como ficheiros anexos
                const anexos = await this.prisma.pn_anexos.findMany({
                    where: { id_noticia_FK: idNoticia },
                    select: {
                        nome_ficheiro: true,
                        nome_original_ficheiro: true,
                        tipo: true
                    }
                });

                anexos
                    .filter((a) => (a.tipo || '').startsWith('image/'))
                    .forEach((a) => {
                        const filename = a.nome_original_ficheiro || a.nome_ficheiro;
                        const fullPath = path.join(
                            process.cwd(),
                            'uploads',
                            'portal_noticias',
                            a.nome_ficheiro
                        );

                        attachments.push({
                            filename,
                            path: fullPath
                        });
                    });
            } catch (e) {
                console.error(
                    '[NOTIFICACAO] Erro ao preparar anexos de mídia para email',
                    e
                );
            }
        }

        try{
            // 1) Registar notificação na BD (como já estava)
            let envio = await this.prisma.not_notificacao.create({
                data: {
                    data_criacao: new Date(),
                    email_destinatario: corpo.email,
                    assunto: corpo.assunto,
                    mensagem: mesagem_enviar,
                    // deixar id_tipo_notificacao nulo para evitar FK inválida
                    estado: 1,
                    periodicidade: "instantanea"
                }
            })

            console.log('[NOTIFICACAO] Notificação criada com sucesso', envio);

            // 2) Envio direto por SMTP (configurado por variáveis de ambiente)
            const {
                SMTP_HOST,
                SMTP_PORT,
                SMTP_USER,
                SMTP_PASS,
                SMTP_SECURE,
                SMTP_FROM
            } = process.env;

            if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
                console.warn(
                    '[NOTIFICACAO] SMTP não configurado (SMTP_HOST/PORT/USER/PASS em falta). Email não enviado diretamente.'
                );
                return envio;
            }

            const portNumber = Number(SMTP_PORT) || 587;
            const secureFlag =
                SMTP_SECURE === 'true' || SMTP_SECURE === '1' || portNumber === 465;

            const transporter = nodemailer.createTransport({
                host: SMTP_HOST,
                port: portNumber,
                secure: secureFlag,
                auth: {
                    user: SMTP_USER,
                    pass: SMTP_PASS
                }
            });

            const fromAddress = SMTP_FROM && SMTP_FROM.trim().length > 0
                ? SMTP_FROM
                : SMTP_USER;

            try {
                const info = await transporter.sendMail({
                    from: fromAddress,
                    to: corpo.email,
                    subject: corpo.assunto,
                    html: mesagem_enviar,
                    attachments: attachments.length > 0 ? attachments : undefined
                });

                console.log('[NOTIFICACAO] Email enviado via SMTP com sucesso', {
                    messageId: info.messageId,
                    envelope: info.envelope
                });
            } catch (smtpErr) {
                console.error('[NOTIFICACAO] Erro ao enviar email via SMTP', smtpErr);
            }

            return envio;
        }catch(err){
            console.error('[NOTIFICACAO] Erro ao criar notificação de email', err);
            return { status: false, message: 'Erro ao criar notificação de email', detalhe: err?.message };
        }
    }



}
