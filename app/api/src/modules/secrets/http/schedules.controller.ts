import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/http/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/http/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../../auth/http/decorators/current-user.decorator';
import { CreateScheduleDto } from '../application/dto/create-schedule.dto';
import { ScheduleResponseDto } from '../application/dto/schedule-response.dto';
import { SecretReleaseSchedulerService } from '../application/services/secret-release-scheduler.service';

@ApiTags('scheduling')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('secrets/:id/schedules')
export class SchedulesController {
  constructor(private readonly scheduler: SecretReleaseSchedulerService) {}

  @Post()
  @ApiOperation({ summary: 'Schedule a secret release for a future date/time' })
  @ApiParam({ name: 'id', description: 'Secret ID (uuid)' })
  @ApiCreatedResponse({ description: 'Release scheduled successfully', type: ScheduleResponseDto })
  @ApiResponse({ status: 400, description: 'scheduledFor must be a valid future ISO date' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Not allowed (not the owner)' })
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
