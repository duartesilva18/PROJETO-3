import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { ApiProperty } from '@nestjs/swagger';

// dto é como uma replica da tabela da base de dados, mas apenas com os dados que precisamos
// como este dto é para criar um novo livro, não precisamos por exemplo do id, que é automaticamente atribuido pela db
export class Anexos_Dto {
  @ApiProperty({
    description: 'caminho do anexo',
    example: 'pastadeficheiros/anexo.jpg'
  })
  @IsString()
  @IsOptional()       // decorators servem para garantir que os dados que vamos inserir estão do tipo que pretendemos
  caminho: string

  @ApiProperty({
    description: 'Tipo do anexo',
    example: 'Imagem/png'
  })
  @IsString() 
  @IsOptional()      // decorators servem para garantir que os dados que vamos inserir estão do tipo que pretendemos
  tipo: string

  

}