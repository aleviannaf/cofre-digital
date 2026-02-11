import { ApiProperty } from '@nestjs/swagger';

export class ScheduleResponseDto {
  @ApiProperty({ example: '7f3c2a0c-9f0e-4a22-9d8d-2fd6b8c9b4c1' })
  id!: string;

  @ApiProperty({ example: 'QUEUED', enum: ['PENDING', 'QUEUED', 'PROCESSED', 'FAILED', 'CANCELED'] })
  status!: string;

  @ApiProperty({ example: '2026-02-11T18:30:00.000Z' })
  scheduledFor!: string;

  @ApiProperty({ example: '2026-02-11T14:00:00.000Z' })
  createdAt!: string;
}
