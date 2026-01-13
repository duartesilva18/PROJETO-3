import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class ProjetoDto {
  @ApiProperty({ description: 'Assunto/nome do projeto', example: 'Projeto Comunicação' })
  @IsString()
  assunto: string;

  @ApiProperty({ description: 'Descrição do projeto', example: 'Projeto de divulgação institucional' })
  @IsString()
  @IsOptional()
  descricao?: string;

  @ApiProperty({ description: 'Estado do projeto', example: 'Ativo' })
  @IsString()
  @IsOptional()
  estado?: string;

  @ApiProperty({ description: 'ID (interno) do projeto', example: 1, required: false })
  @IsInt()
  @IsOptional()
  id_projeto?: number;
}

