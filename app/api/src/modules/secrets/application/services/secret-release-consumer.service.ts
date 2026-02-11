import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RabbitMQClient } from '../../../../integrations/rabbitmq/rabbitmq.client';
import { RabbitMQPublisher, SecretReleaseMessage } from '../../../../integrations/rabbitmq/rabbitmq.publisher';
import { SecretReleaseProcessorService } from './secret-release-processor.service';

@Injectable()
export class SecretReleaseConsumerService implements OnModuleInit {
  private readonly logger = new Logger(SecretReleaseConsumerService.name);

  constructor(
    private readonly rabbit: RabbitMQClient,
    private readonly publisher: RabbitMQPublisher,
    private readonly processor: SecretReleaseProcessorService,
  ) {}

  async onModuleInit() {
    const ch = this.rabbit.getChannel();
    const { queue } = this.rabbit.getConfig();

    await ch.prefetch(10);

    await ch.consume(queue, async (msg) => {
      if (!msg) return;

      try {
        const data = JSON.parse(msg.content.toString('utf8')) as SecretReleaseMessage;
        await this.processor.processOrDelay(data);
        ch.ack(msg);
      } catch (err) {
        this.logger.error('Failed to consume message', err as any);
        // requeue false para não loopar mensagem inválida
        ch.nack(msg, false, false);
      }
    });
  }
}
