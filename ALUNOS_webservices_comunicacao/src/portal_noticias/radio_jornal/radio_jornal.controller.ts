import { Body, Controller, Delete, Get, Param, Post, Put } from "@nestjs/common";
import { Radio_Jornal_Dto } from "../dto/radio_jornal.dto";
import { RadioJornalService } from "./radio_jornal.service";
import { ApiTags } from "@nestjs/swagger";

@ApiTags('PortalNoticias')
@Controller('portal_noticias/radio_jornal')
export class RadioJornalController {
  constructor(private readonly radioJornalService: RadioJornalService) {}

  @Get()
  async getRadiosJornais() {
    return this.radioJornalService.get_RadiosJornais();
  }

  @Post()
  async createRadioJornal(@Body() dto: Radio_Jornal_Dto) {
    return this.radioJornalService.create_RadioJornal(dto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: Radio_Jornal_Dto) {
    return this.radioJornalService.update_RadioJornal(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.radioJornalService.delete_RadioJornal(id);
  }

  @Get(':id')
  async getRadioJornal(@Param('id') id: string) {
    return this.radioJornalService.get_RadioJornal(id);
  }
}
