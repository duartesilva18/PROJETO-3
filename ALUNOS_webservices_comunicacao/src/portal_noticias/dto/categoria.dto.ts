import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { ApiProperty } from '@nestjs/swagger';

// dto é como uma replica da tabela da base de dados, mas apenas com os dados que precisamos
// como este dto é para criar um novo livro, não precisamos por exemplo do id, que é automaticamente atribuido pela db
export class CategoriaDto {
    @ApiProperty({
        description: 'Nome da categoria',
        example: 'Nome da categoria'
    })
    @IsString()
    nome: string;

    @ApiProperty({
        description: 'Descrição da categoria',
        example: 'Descrição da categoria'
    })
    @IsString()
    @IsOptional()
    descricao?: string;

    @ApiProperty({
        description: 'Estado da categoria',
        example: 'Ativo'
    })
    @IsString()
    @IsOptional()
    status?: string;
    
}