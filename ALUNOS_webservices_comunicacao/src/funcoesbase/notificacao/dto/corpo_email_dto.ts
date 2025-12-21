import { IsEmail, IsNotEmpty } from "@nestjs/class-validator";

export class DtoCorpoEmail {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsNotEmpty()
    assunto: string;

    @IsNotEmpty()
    tipo: string;
    
    // pode conter qualquer estrutura, depende do tipo de email
    dados_tipo: any;
}