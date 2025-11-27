import { IsNotEmpty, IsNumber, IsString ,IsArray, ValidateNested, IsOptional, IsNumberString, IsInt, IsUUID} from "class-validator";
import { Type, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Anexos_Dto} from './anexos.dto';
import { Redes_Sociais_Dto } from './redes_sociais.dto';
import { TagDto } from './tag.dto';


// dto é como uma replica da tabela da base de dados, mas apenas com os dados que precisamos
// como este dto é para criar um novo livro, não precisamos por exemplo do id, que é automaticamente atribuido pela db


export class NoticiaDto {
  @ApiProperty({
    description: 'Título da notícia',
    example: 'Título da notícia'
  })
  @IsString()
  @IsNotEmpty()
  titulo: string;

  @ApiProperty({
    description: 'Texto da notícia',
    example: 'Texto da notícia'
  })
  @IsString()
  @IsNotEmpty()
  texto: string;

  @ApiProperty({
    description: 'Texto da notícia para o Facebook',
    example: 'Texto da notícia para o Facebook'
  })
  @IsString()
  @IsOptional()
  texto_facebook?: string;

  @ApiProperty({
    description: 'Texto da notícia para o Instagram',
    example: 'Texto da notícia para as o Instagram'
  })
  @IsString()
  @IsOptional()
  texto_instagram?: string;

  @ApiProperty({
    description: 'Texto da notícia para o LinkedIn',
    example: 'Texto da notícia para o LinkedIn'
  })

  @IsString()
  @IsOptional()
  texto_linkedin?: string;

  @ApiProperty({
    description: 'Texto da notícia para o Twitter',
    example: 'Texto da notícia para o Twitter'
  })
  @IsString()
  @IsOptional()
  texto_twitter?: string;

  @ApiProperty({
    description: 'Estado da notícia',
    example: 'Ativo'
  })
  @IsString()
  @IsOptional()
  estado?: string;

  @ApiProperty({
    description: 'Id da categoria da notícia',
    example: '1'
  })
  @IsString()
  @IsOptional()
  id_categoria_FK: string;

  @ApiProperty({
    description: 'Anexos da notícia',
    example: 'Anexos da notícia'
  })
  @IsArray()
  @IsOptional()
  //@ValidateNested({ each: true })
  //@Type(() => Anexos_Dto)
  anexos: any[];

  @ApiProperty({
    description: 'Tags da notícia',
    example: 'Tags da notícia'
  })
  @IsArray()
  @IsOptional()
  @Type(() => TagDto)
  tags: TagDto[];

  @ApiProperty({
    description: 'Redes sociais da notícia',
    example: 'Redes sociais da notícia'
  })
  @IsArray()
  @IsOptional()
  @Type(() => Redes_Sociais_Dto)
  redesSociais: Redes_Sociais_Dto[];

  @ApiProperty({
    description: 'Texto da notícia para o tiktok',
    example: 'Texto da notícia para as o tiktok'
  })
  @IsString()
  @IsOptional()
  texto_tiktok?: string;

  @ApiProperty({
    description: 'ID do pedido associado à notícia',
    example: 1
  })
  @IsInt()
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10)) 
  id_pedido?: number;

  @ApiProperty({
    description: 'Lista de e-mails (separados por vírgula)',
    example: 'email1@ex.com,email2@ex.com', // Exemplo sem espaços!
  })
  @IsString() // Valida que é uma string
  @IsOptional()
  emails?: string; 

  @ApiProperty({
    description: 'indica os tipos tipo 0 é só media tipo 1 é so rede social e tipo 2 é misto',
    example: '1',
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  tipo?: number;
  


}