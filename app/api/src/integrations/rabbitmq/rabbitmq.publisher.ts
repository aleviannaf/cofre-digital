import { Injectable } from '@nestjs/common';
import { RabbitMQClient } from './rabbitmq.client';

export type SecretReleaseMessage = {
  scheduleId: string;
};

@Injectable()
export class RabbitMQPublisher {
  constructor(private readonly rabbit: RabbitMQClient) {}

  publishScheduleCreated(message: SecretReleaseMessage): void {
    const ch = this.rabbit.getChannel();
    const { exchange, queue } = this.rabbit.getConfig();

    const payload = Buffer.from(JSON.stringify(message));
    ch.publish(exchange, queue, payload, {
      contentType: 'application/json',
      persistent: true,
    });
  }

  publishToDelayQueue(message: SecretReleaseMessage): void {
    const ch = this.rabbit.getChannel();
    const { delayQueue } = this.rabbit.getConfig();

    const payload = Buffer.from(JSON.stringify(message));
    ch.sendToQueue(delayQueue, payload, {
      contentType: 'application/json',
      persistent: true,
    });
  }
}
