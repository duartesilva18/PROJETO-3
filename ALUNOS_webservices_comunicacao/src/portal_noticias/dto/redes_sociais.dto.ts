import { IsNotEmpty, IsNumber, IsString } from "class-validator";
import { ApiProperty } from '@nestjs/swagger';

// dto é como uma replica da tabela da base de dados, mas apenas com os dados que precisamos
// como este dto é para criar um novo livro, não precisamos por exemplo do id, que é automaticamente atribuido pela db
export class Redes_Sociais_Dto {
  @ApiProperty({
    description: 'Nome da rede social',
    example: 'Facebook'
  })
  @IsString()       // decorators servem para garantir que os dados que vamos inserir estão do tipo que pretendemos
  @IsNotEmpty()
  nome: string

  @ApiProperty({
    description: 'Id da rede social',
  })
  @IsNotEmpty()
  id_rede_social: string;
}