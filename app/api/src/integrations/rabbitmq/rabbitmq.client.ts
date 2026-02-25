import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';

import type { Channel, Connection } from 'amqplib';

type RabbitConfig = {
  url: string;
  exchange: string;
  queue: string;
  delayQueue: string;
  delayMs: number;
};

@Injectable()
export class RabbitMQClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQClient.name);
  private conn?: Connection;
  private ch?: Channel;
  private cfg!: RabbitConfig;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    this.cfg = {
      url: this.config.getOrThrow<string>('RABBITMQ_URL'),
      exchange: this.config.getOrThrow<string>('RABBITMQ_EXCHANGE'),
      queue: this.config.getOrThrow<string>('RABBITMQ_QUEUE'),
      delayQueue: this.config.getOrThrow<string>('RABBITMQ_DELAY_QUEUE'),
      delayMs: this.config.getOrThrow<number>('RABBITMQ_DELAY_MS'),
    };

    const conn = await this.connectWithRetry();
    const ch = await conn.createChannel();

    // Exchange principal
    await ch.assertExchange(this.cfg.exchange, 'direct', { durable: true });

    // Queue principal
    await ch.assertQueue(this.cfg.queue, { durable: true });
    await ch.bindQueue(this.cfg.queue, this.cfg.exchange, this.cfg.queue);

    // Delay queue (TTL + DLX de volta pro exchange principal)
    await ch.assertQueue(this.cfg.delayQueue, {
      durable: true,
      arguments: {
        'x-message-ttl': this.cfg.delayMs,
        'x-dead-letter-exchange': this.cfg.exchange,
        'x-dead-letter-routing-key': this.cfg.queue,
      },
    });

    this.conn = conn;
    this.ch = ch;
  }

  private async connectWithRetry(): Promise<Connection> {
    const maxAttempts = this.config.get<number>('RABBITMQ_CONNECT_RETRIES') ?? 10;
    const baseDelayMs = this.config.get<number>('RABBITMQ_CONNECT_RETRY_DELAY_MS') ?? 1000;

    let lastErrorMessage = 'Unknown error';

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      this.logger.log(`Connecting to RabbitMQ (attempt ${attempt}/${maxAttempts})`);

      let conn: Connection | undefined;
      try {
        conn = await amqp.connect(this.cfg.url);
        this.logger.log('RabbitMQ connection established');
        return conn;
      } catch (error) {
        lastErrorMessage =
          error instanceof Error ? error.message : String(error);
        this.logger.warn(
          `RabbitMQ connection attempt ${attempt}/${maxAttempts} failed: ${lastErrorMessage}`,
        );
        await conn?.close().catch(() => undefined);

        if (attempt === maxAttempts) {
          this.logger.error(
            `RabbitMQ connection failed after ${maxAttempts} attempts`,
          );
          throw new Error(
            `RabbitMQ connection failed after ${maxAttempts} attempts: ${lastErrorMessage}`,
          );
        }

        const delayMs = baseDelayMs * attempt;
        this.logger.log(`Retrying RabbitMQ connection in ${delayMs}ms`);
        await this.sleep(delayMs);
      }
    }

    throw new Error(
      `RabbitMQ connection failed after ${maxAttempts} attempts: ${lastErrorMessage}`,
    );
  }

  private async sleep(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  getChannel(): Channel {
    if (!this.ch) throw new Error('RabbitMQ channel not initialized');
    return this.ch;
  }

  getConfig(): RabbitConfig {
    if (!this.cfg) throw new Error('RabbitMQ config not initialized');
    return this.cfg;
  }

  async onModuleDestroy(): Promise<void> {
    await this.ch?.close().catch(() => undefined);
    await this.conn?.close().catch(() => undefined);
  }
}
