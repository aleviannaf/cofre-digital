import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'ana@email.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'minhaSenhaForte123' })
  @IsString()
  password!: string;
}
