import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Ana Silva' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'ana@email.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'minhaSenhaForte123' })
  @IsString()
  @MinLength(8)
  password!: string;
}
