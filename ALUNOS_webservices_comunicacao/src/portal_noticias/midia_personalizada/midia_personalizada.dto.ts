import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, IsUUID } from 'class-validator';

export class MidiaPersonalizadaItemDto {
  @ApiProperty({ description: 'ID do rádio/jornal', example: 'uuid-radio-jornal' })
  @IsUUID()
  id_radio_jornal: string;

  @ApiProperty({
    description: 'Texto personalizado para este rádio/jornal',
    example: 'Versão específica da notícia para este jornal',
    required: false
  })
  @IsString()
  @IsOptional()
  texto_custom?: string;

  @ApiProperty({
    description: 'ID do anexo (imagem) específico para este rádio/jornal',
    example: 'uuid-anexo',
    required: false
  })
  @IsUUID()
  @IsOptional()
  id_anexo?: string;
}

export class MidiaPersonalizadaDto {
  @ApiProperty({ description: 'ID da notícia (mídia) a que estas personalizações pertencem' })
  @IsUUID()
  id_noticia: string;

  @ApiProperty({
    description: 'Lista de personalizações por rádio/jornal',
    type: [MidiaPersonalizadaItemDto]
  })
  @IsArray()
  items: MidiaPersonalizadaItemDto[];
}