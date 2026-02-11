FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Prisma 7 pode tentar validar env via prisma.config.ts.
# Passamos DATABASE_URL dummy apenas para o generate.
RUN DATABASE_URL="postgresql://postgres:postgres@localhost:5432/cofredigital?schema=public" npx prisma generate

RUN npm run build

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
