import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class CreateScheduleDto {
  @ApiProperty({ example: '2026-02-11T18:30:00.000Z' })
  @IsDateString()
  scheduledFor!: string;
}
