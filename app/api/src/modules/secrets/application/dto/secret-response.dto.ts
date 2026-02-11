import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SecretResponseDto {
  @ApiProperty()
  id!: string;

  @ApiPropertyOptional()
  title!: string | null;

  @ApiPropertyOptional()
  description!: string | null;

  @ApiProperty({ example: 'meu-segredo-super-confidencial' })
  secret!: string;

  @ApiProperty({ enum: ['STORED', 'AVAILABLE'] })
  status!: 'STORED' | 'AVAILABLE';

  @ApiPropertyOptional({ nullable: true })
  availableAt!: string | null;

  @ApiProperty()
  createdAt!: string;
}
