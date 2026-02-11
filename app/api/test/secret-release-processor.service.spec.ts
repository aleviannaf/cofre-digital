import { SecretReleaseProcessorService } from '../src/modules/secrets/application/services/secret-release-processor.service';

describe('SecretReleaseProcessorService', () => {
  const prismaMock: any = {
    prisma: {
      secretReleaseSchedule: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      secret: {
        update: jest.fn(),
      },
      secretReleaseHistory: {
        create: jest.fn(),
      },
      $transaction: jest.fn(async (fn: any) => fn(prismaMock.prisma)),
    },
  };

  const publisherMock = {
    publishToDelayQueue: jest.fn(),
  };

  const service = new SecretReleaseProcessorService(
    prismaMock,
    publisherMock as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should delay if scheduledFor is in the future', async () => {
    prismaMock.prisma.secretReleaseSchedule.findUnique.mockResolvedValue({
      id: 'schedule-1',
      secretId: 'secret-1',
      ownerId: 'user-1',
      scheduledFor: new Date(Date.now() + 60000),
      status: 'QUEUED',
      attempts: 0,
    });

    const result = await service.processOrDelay({ scheduleId: 'schedule-1' });

    expect(publisherMock.publishToDelayQueue).toHaveBeenCalled();
    expect(result).toBe('DELAYED');
  });

  it('should process if scheduledFor is in the past', async () => {
    prismaMock.prisma.secretReleaseSchedule.findUnique.mockResolvedValue({
      id: 'schedule-1',
      secretId: 'secret-1',
      ownerId: 'user-1',
      scheduledFor: new Date(Date.now() - 60000),
      status: 'QUEUED',
      attempts: 0,
    });

    const result = await service.processOrDelay({ scheduleId: 'schedule-1' });

    expect(prismaMock.prisma.secret.update).toHaveBeenCalled();
    expect(prismaMock.prisma.secretReleaseHistory.create).toHaveBeenCalled();
    expect(prismaMock.prisma.secretReleaseSchedule.update).toHaveBeenCalled();
    expect(result).toBe('PROCESSED');
  });
});
