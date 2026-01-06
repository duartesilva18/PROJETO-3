import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID } from 'class-validator';

export class MidiaAnexosItemDto {
  @ApiProperty({ description: 'ID do rádio/jornal', example: 'uuid-radio-jornal' })
  @IsUUID()
  id_radio_jornal: string;

  @ApiProperty({
    description: 'Lista de IDs de anexos (imagens) associados a este rádio/jornal',
    type: [String]
  })
  @IsArray()
  ids_anexos: string[];
}

export class MidiaAnexosDto {
  @ApiProperty({ description: 'ID da notícia (mídia) a que estes anexos pertencem' })
  @IsUUID()
  id_noticia: string;

  @ApiProperty({
    description: 'Lista de anexos por rádio/jornal',
    type: [MidiaAnexosItemDto]
  })
  @IsArray()
  items: MidiaAnexosItemDto[];
}



