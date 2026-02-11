import { RabbitMQPublisher } from '../src/integrations/rabbitmq/rabbitmq.publisher';

describe('RabbitMQPublisher', () => {
  const publishMock = jest.fn();
  const sendToQueueMock = jest.fn();

  const rabbitMock: any = {
    getChannel: () => ({
      publish: publishMock,
      sendToQueue: sendToQueueMock,
    }),
    getConfig: () => ({
      exchange: 'ex',
      queue: 'q',
      delayQueue: 'delay-q',
    }),
  };

  const publisher = new RabbitMQPublisher(rabbitMock);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should publish to main queue', () => {
    publisher.publishScheduleCreated({ scheduleId: '1' });

    expect(publishMock).toHaveBeenCalled();
  });

  it('should publish to delay queue', () => {
    publisher.publishToDelayQueue({ scheduleId: '1' });

    expect(sendToQueueMock).toHaveBeenCalled();
  });
});
