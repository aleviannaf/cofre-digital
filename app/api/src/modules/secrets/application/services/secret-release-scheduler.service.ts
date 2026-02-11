import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';
import { RabbitMQPublisher } from '../../../../integrations/rabbitmq/rabbitmq.publisher';

@Injectable()
export class SecretReleaseSchedulerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly publisher: RabbitMQPublisher,
  ) {}

  async scheduleRelease(input: { ownerId: string; secretId: string; scheduledForIso: string }) {
    const scheduledFor = new Date(input.scheduledForIso);
    if (Number.isNaN(scheduledFor.getTime())) {
      throw new BadRequestException('Invalid scheduledFor');
    }

    const now = new Date();
    if (scheduledFor <= now) {
      throw new BadRequestException('scheduledFor must be in the future');
    }

    const secret = await this.prisma.prisma.secret.findUnique({
      where: { id: input.secretId },
      select: { id: true, ownerId: true },
    });

    if (!secret) throw new NotFoundException('Secret not found');
    if (secret.ownerId !== input.ownerId) throw new ForbiddenException('Not allowed');

    const schedule = await this.prisma.prisma.secretReleaseSchedule.create({
      data: {
        secretId: input.secretId,
        ownerId: input.ownerId,
        scheduledFor,
        status: 'PENDING',
        attempts: 0,
      },
      select: { id: true, scheduledFor: true, createdAt: true },
    });

    // requisito: publicar na fila ao criar agendamento
    this.publisher.publishScheduleCreated({ scheduleId: schedule.id });

    // rastreio: marcou como publicado
    await this.prisma.prisma.secretReleaseSchedule.update({
      where: { id: schedule.id },
      data: { status: 'QUEUED', correlationId: schedule.id },
    });

    return {
      id: schedule.id,
      status: 'QUEUED' as const,
      scheduledFor: schedule.scheduledFor.toISOString(),
      createdAt: schedule.createdAt.toISOString(),
    };
  }
}
