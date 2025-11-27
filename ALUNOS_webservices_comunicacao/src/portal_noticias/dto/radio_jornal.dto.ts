import { IsNotEmpty, IsNumber, IsString } from "class-validator";
import { ApiProperty } from '@nestjs/swagger';

// dto é como uma replica da tabela da base de dados, mas apenas com os dados que precisamos
// como este dto é para criar um novo livro, não precisamos por exemplo do id, que é automaticamente atribuido pela db
export class Radio_Jornal_Dto {
  @ApiProperty({
    description: 'Nome do radio/jornal',
    example: 'radio da onipvc'
  })
  @IsString()       // decorators servem para garantir que os dados que vamos inserir estão do tipo que pretendemos
  @IsNotEmpty()
  nome: string

  @ApiProperty({
    description: 'Email do radio/jornal',
    example: 'radiojornalonivpc@ipvc.pt'
  })
  @IsString()       // decorators servem para garantir que os dados que vamos inserir estão do tipo que pretendemos
  @IsNotEmpty()
  email: string
}