FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && node dist/main.js"]
