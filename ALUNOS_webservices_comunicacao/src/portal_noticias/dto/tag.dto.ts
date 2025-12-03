import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { ApiProperty } from '@nestjs/swagger';

// dto é como uma replica da tabela da base de dados, mas apenas com os dados que precisamos
// como este dto é para criar um novo livro, não precisamos por exemplo do id, que é automaticamente atribuido pela db
export class TagDto {
    @ApiProperty({
        description: 'Id da tag',
    })
    @IsNotEmpty()
    @IsOptional()
    id_tag: string;

    @ApiProperty({
        description: 'Nome da tag',
        example: 'Nome da tag'
    })
    @IsString()
    nome: string;

    @ApiProperty({
        description: 'Estado da tag',
        example: 'Ativo',
        required: false
    })
    @IsOptional()
    @IsString()
    status?: string;

}