import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.string().optional(),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1),

  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN_SECONDS: z.coerce.number().default(900),

  ENCRYPTION_KEY_BASE64: z.string().min(1),

  RABBITMQ_URL: z.string().min(1),
  RABBITMQ_EXCHANGE: z.string().min(1).default('secret-release-ex'),
  RABBITMQ_QUEUE: z.string().min(1).default('secret-release'),
  RABBITMQ_DELAY_QUEUE: z.string().min(1).default('secret-release.delay'),
  RABBITMQ_DELAY_MS: z.coerce.number().int().positive().default(30000),

});

export type Env = z.infer<typeof envSchema>;

export function validateEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    // eslint-disable-next-line no-console
    console.error(parsed.error.format());
    throw new Error('Invalid environment variables');
  }
  return parsed.data;
}

