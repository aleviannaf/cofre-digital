import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type CurrentUserPayload = { sub: string; email: string; name: string };

export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest<{ user?: CurrentUserPayload }>();
  return req.user;
});
