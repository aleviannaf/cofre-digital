FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN DATABASE_URL="postgresql://user:pass@dummy:5432/db?schema=public" npx prisma generate && \
    DATABASE_URL="postgresql://user:pass@dummy:5432/db?schema=public" npm run build

RUN test -f dist/main-worker.js

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && npm run start:prod"]
