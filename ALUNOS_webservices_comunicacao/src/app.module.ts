import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { ConfigModule } from "@nestjs/config";
import { FuncoesBaseModule } from "./funcoesbase/module";
import { ExemploModule } from "./modulo_exemplo/module";
import { AuthModule } from "./auth/auth.module";
import { PassportModule } from '@nestjs/passport';
import { NoticiasModule } from './portal_noticias/noticias/noticias.module';
import { RadioJornalModule } from './portal_noticias/radio_jornal/radio_jornal.module';
import { MidiaPersonalizadaModule } from './portal_noticias/midia_personalizada/midia_personalizada.module';
import { MidiaAnexosModule } from './portal_noticias/midia_anexos/midia_anexos.module';
import { TagsModule } from "./portal_noticias/tags/tags.module";
import { ProjetosModule } from './portal_noticias/projetos/projetos.module';

import { CategoriaModule } from "./portal_noticias/categoria/categoria.module";
import { AnexosModule } from "./portal_noticias/anexos/anexos.module";

import { RedesSociaisModule } from './portal_noticias/redes_sociais/redes_sociais.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    PassportModule,
    AuthModule,

    CategoriaModule,
    AnexosModule,
    NoticiasModule,
    RadioJornalModule,
    RedesSociaisModule,
    TagsModule,
    MidiaPersonalizadaModule,
    MidiaAnexosModule,
    ProjetosModule,
    FuncoesBaseModule,
  ]
})
export class AppModule {}
