import { Body, Controller, Delete, Get, Param, Post, Put } from "@nestjs/common";
import { CategoriaDto } from "../dto/categoria.dto";
import { CategoriaService } from "./categoria.service";
import { ApiTags } from "@nestjs/swagger";

@ApiTags('PortalNoticias')  // aparece este grupo no Swagger
@Controller('portal_noticias/categorias') // PLURAL, igual ao frontend
export class CategoriaController {
  constructor(private categoriaService: CategoriaService) {}

  @Get()
  async getCategorias() {
    return this.categoriaService.get_Categorias();
  }

  @Post()
  async createCategoria(@Body() dto: CategoriaDto) {
    return this.categoriaService.create_Categorias(dto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: CategoriaDto) {
    return this.categoriaService.update_Categorias(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.categoriaService.delete_Categorias(id);
  }

  @Get(':id')
  async getCategoria(@Param('id') id: string) {
    return this.categoriaService.get_Categoria(id);
  }
}
