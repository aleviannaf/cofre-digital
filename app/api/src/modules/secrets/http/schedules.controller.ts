import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/http/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/http/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../../auth/http/decorators/current-user.decorator';
import { CreateScheduleDto } from '../application/dto/create-schedule.dto';
import { SecretReleaseSchedulerService } from '../application/services/secret-release-scheduler.service';

@ApiTags('secrets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('secrets/:id/schedules')
export class SchedulesController {
  constructor(private readonly scheduler: SecretReleaseSchedulerService) {}

  @Post()
  @ApiOkResponse({
    schema: {
      example: {
        id: 'uuid',
        status: 'QUEUED',
        scheduledFor: '2026-02-11T18:30:00.000Z',
        createdAt: '2026-02-11T14:00:00.000Z',
      },
    },
  })
  create(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') secretId: string,
    @Body() dto: CreateScheduleDto,
  ) {
    return this.scheduler.scheduleRelease({
      ownerId: user.sub,
      secretId,
      scheduledForIso: dto.scheduledFor,
    });
  }
}
