import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { Redes_Sociais_Dto } from "../dto/redes_sociais.dto";
import { RedesSociaisService } from "./redes_sociais.service";


@Controller('portal_noticias/redessociais')
export class RedesSociaisController {
    constructor(private rs_service: RedesSociaisService) {}

    @Get()
    async get() {
      return this.rs_service.get_Redes_Sociais();
    }

    @Post()
    async create_Rede_Social(@Body() dto: Redes_Sociais_Dto) {
      return this.rs_service.create_Redes_Sociais(dto);
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() dto: Redes_Sociais_Dto) {
      return this.rs_service.update_Redes_Sociais(id, dto);
    }

    @Delete(':id')
    async delete(@Param('id') id: string) {
      return this.rs_service.delete_Redes_Sociais(id);
    }

    @Get(':id')
    async get_Rede_Social(@Param('id') id: string) {
      return this.rs_service.get_Redes_Social(id);
    }

    // Endpoint para postar no Facebook images
    @Post('facebook')
    async postToFacebook(
        @Body('message') message: string,
        @Body('mediaUrls')  mediaUrls: string[],
        @Body('noticia_id') id_noticia: string
    ) {
        return this.rs_service.postToFacebook(message, mediaUrls, id_noticia);
    }

    // Endpoint para postar no Twitter
    @Post('twitter')
    async postToTwitter(
        @Body('message') message: string,
        @Body('mediaUrls') mediaUrls: string[],
        @Body('noticia_id') id_noticia: string
    ) {
        return this.rs_service.postToTwitter(message, mediaUrls, id_noticia);
    }

    @Post('instagram')
    async postToInstagram(
        @Body('mediaUrls') mediaUrls: string[],
        @Body('caption') caption: string,
        @Body('noticia_id') id_noticia: string
    ) {
        return this.rs_service.postToInstagram(mediaUrls, caption, id_noticia);
    }

    @Post('linkedin')
    async postToLinkedIn(
        @Body('imageUrl') imageUrl: string,
        @Body('caption') caption: string,
        @Body('noticia_id') id_noticia: string
    ) {
        return this.rs_service.postToLinkedIn(imageUrl, caption, id_noticia);
    }

    @Post('imgur')
    async postToImgur(
        @Body('image_id') id_image: string
    ) {
        return this.rs_service.postToImgur(id_image);
    }

    



}