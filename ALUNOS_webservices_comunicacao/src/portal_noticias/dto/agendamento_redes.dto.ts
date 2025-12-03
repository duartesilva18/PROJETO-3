import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum AgendamentoStatus {
  PENDENTE = 'pendente',
  ENVIADO = 'enviado',
  ERRO = 'erro',
  CANCELADO = 'cancelado',
}

export class AgendamentoRedeItemDto {
  @ApiProperty({
    description: 'Identificador da rede social que receberá o conteúdo',
    example: '3b0f2928-2390-4bc8-8185-9534277f5b6d',
  })
  @IsUUID()
  id_rede_social: string;

  @ApiProperty({
    description: 'Data e hora (ISO8601) em que o conteúdo deve ser enviado',
    example: '2025-12-05T09:00:00Z',
  })
  @IsISO8601()
  horario_agendado: string;

  @ApiPropertyOptional({
    description: 'Identificador IANA do fuso horário a aplicar na agenda',
    example: 'Europe/Lisbon',
    default: 'Europe/Lisbon',
  })
  @IsOptional()
  @IsString()
  fuso_horario?: string;

  @ApiPropertyOptional({
    description: 'Estado manual do agendamento',
    enum: AgendamentoStatus,
    default: AgendamentoStatus.PENDENTE,
  })
  @IsOptional()
  @IsEnum(AgendamentoStatus)
  status?: AgendamentoStatus;
}

export class AgendarNoticiaRedesDto {
  @ApiProperty({
    description: 'Identificador da notícia associada ao agendamento',
    example: '95bb1f21-837f-4b9b-b959-cda50f5e0d49',
  })
  @IsUUID()
  id_noticia: string;

  @ApiProperty({
    description: 'Lista de redes sociais e respetivos horários agendados',
    type: [AgendamentoRedeItemDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AgendamentoRedeItemDto)
  agendamentos: AgendamentoRedeItemDto[];
}

export class AtualizaAgendamentoDto {
  @ApiProperty({
    description: 'Data e hora (ISO8601) em que o conteúdo deverá ser enviado',
    example: '2025-12-05T09:00:00Z'
  })
  @IsISO8601()
  horario_agendado: string;

  @ApiPropertyOptional({
    description: 'Identificador IANA do fuso horário',
    example: 'Europe/Lisbon',
    default: 'Europe/Lisbon'
  })
  @IsOptional()
  @IsString()
  fuso_horario?: string;

  @ApiPropertyOptional({
    description: 'Estado do agendamento',
    enum: AgendamentoStatus,
    default: AgendamentoStatus.PENDENTE
  })
  @IsOptional()
  @IsEnum(AgendamentoStatus)
  status?: AgendamentoStatus;
}

