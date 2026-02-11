import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.string().optional(),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    // imprime erros legíveis
    // eslint-disable-next-line no-console
    console.error(parsed.error.format());
    throw new Error('Invalid environment variables');
  }
  return parsed.data;
}
