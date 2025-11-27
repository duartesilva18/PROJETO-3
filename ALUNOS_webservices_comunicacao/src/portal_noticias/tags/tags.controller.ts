import { Body, Controller, Delete, Get, Param, Post, Put } from "@nestjs/common";
import { TagDto } from "../dto/tag.dto";
import { TagsService } from "./tags.service";

@Controller('portal_noticias/tags')
export class TagsController {
  constructor(private readonly tagService: TagsService) {}

  @Get()
  async getTag() {
    return this.tagService.get_Tags();
  }

  @Post()
  async createCategoria(@Body() dto: TagDto) {
    return this.tagService.create_Tags(dto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: TagDto) {
    return this.tagService.update_Tags(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.tagService.delete_Tags(id);
  }

  @Get(':id')
  async getCategoria(@Param('id') id: string) {
    return this.tagService.get_Tag(id);
  }

  @Put(':id/activate')
  async activateTag(@Param('id') id: string) {
    return this.tagService.activateTag(id);
  }
}
