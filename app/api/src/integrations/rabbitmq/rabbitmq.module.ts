import { Module } from '@nestjs/common';
import { RabbitMQClient } from './rabbitmq.client';
import { RabbitMQPublisher } from './rabbitmq.publisher';

@Module({
  providers: [RabbitMQClient, RabbitMQPublisher],
  exports: [RabbitMQClient, RabbitMQPublisher],
})
export class RabbitMQModule {}
