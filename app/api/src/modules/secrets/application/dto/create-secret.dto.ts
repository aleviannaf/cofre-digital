import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateSecretDto {
  @ApiPropertyOptional({ example: 'Token do GitHub' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ example: 'Acesso da conta principal' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ example: 'meu-segredo-super-confidencial' })
  @IsString()
  @MinLength(1)
  secret!: string;
}
