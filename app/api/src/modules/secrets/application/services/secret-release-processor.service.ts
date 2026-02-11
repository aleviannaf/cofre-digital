import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';
import { RabbitMQPublisher, SecretReleaseMessage } from '../../../../integrations/rabbitmq/rabbitmq.publisher';

type ProcessResult = 'PROCESSED' | 'DELAYED' | 'SKIPPED' | 'FAILED';

@Injectable()
export class SecretReleaseProcessorService {
  private readonly logger = new Logger(SecretReleaseProcessorService.name);
  private readonly maxAttempts = 10;

  constructor(
    private readonly prisma: PrismaService,
    private readonly publisher: RabbitMQPublisher,
  ) {}

  async processOrDelay(message: SecretReleaseMessage): Promise<ProcessResult> {
    const schedule = await this.prisma.prisma.secretReleaseSchedule.findUnique({
      where: { id: message.scheduleId },
      select: {
        id: true,
        secretId: true,
        ownerId: true,
        scheduledFor: true,
        status: true,
        attempts: true,
      },
    });

    if (!schedule) return 'SKIPPED';
    if (schedule.status === 'PROCESSED' || schedule.status === 'CANCELED') return 'SKIPPED';

    if (schedule.attempts >= this.maxAttempts) {
      await this.prisma.prisma.secretReleaseSchedule.update({
        where: { id: schedule.id },
        data: {
          status: 'FAILED',
          lastError: `Max attempts reached (${this.maxAttempts})`,
        },
      });
      return 'FAILED';
    }

    const now = new Date();

    if (schedule.scheduledFor.getTime() > now.getTime()) {
      this.publisher.publishToDelayQueue({ scheduleId: schedule.id });
      return 'DELAYED';
    }

    try {
      await this.prisma.prisma.$transaction(async (tx) => {
        await tx.secret.update({
          where: { id: schedule.secretId },
          data: {
            status: 'AVAILABLE',
            availableAt: now,
          },
        });

        await tx.secretReleaseHistory.create({
          data: {
            secretId: schedule.secretId,
            scheduleId: schedule.id,
            type: 'RELEASED',
            metadataJson: {
              source: 'rabbitmq',
              scheduleId: schedule.id,
              processedAt: now.toISOString(),
            },
          },
        });

        await tx.secretReleaseSchedule.update({
          where: { id: schedule.id },
          data: {
            status: 'PROCESSED',
            processedAt: now,
            lastError: null,
          },
        });
      });

      return 'PROCESSED';
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`Failed processing schedule ${schedule.id}: ${message}`);

      await this.prisma.prisma.secretReleaseSchedule.update({
        where: { id: schedule.id },
        data: {
          status: 'FAILED',
          attempts: { increment: 1 },
          lastError: message,
        },
      });

      this.publisher.publishToDelayQueue({ scheduleId: schedule.id });
      return 'FAILED';
    }
  }
}
