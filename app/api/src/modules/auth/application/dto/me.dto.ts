import { ApiProperty } from '@nestjs/swagger';

export class MeDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  email!: string;
}
