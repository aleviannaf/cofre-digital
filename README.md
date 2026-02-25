# Cofre Digital de Segredos (NestJS)

Backend para armazenamento de segredos criptografados com autenticação JWT e agendamento de liberação assíncrona via RabbitMQ.

O projeto possui dois entrypoints de execução:

- `API` HTTP (NestJS + Swagger)
- `Worker` NestJS sem servidor HTTP para consumo/processamento da fila

## Visão Geral

O sistema permite:

- cadastrar/autenticar usuários com JWT
- armazenar segredos criptografados (AES-256-GCM)
- agendar liberação futura de segredos
- processar agendamentos de forma assíncrona com RabbitMQ
- registrar histórico de liberação

## Arquitetura

A aplicação é organizada em módulos do NestJS e separa responsabilidades por feature.

- `app/api/src/modules/auth`: autenticação, JWT, guard e estratégia
- `app/api/src/modules/secrets`: criação/leitura de segredos, agendamento e processamento assíncrono
- `app/api/src/modules/users`: persistência de usuários
- `app/api/src/integrations/rabbitmq`: cliente, publisher e configuração de filas
- `app/api/src/database/prisma`: integração Prisma/PostgreSQL
- `app/api/src/shared/crypto`: criptografia AES-256-GCM

### Entrypoints

- `app/api/src/main.ts`
  - sobe a API HTTP
  - habilita Swagger em `/docs`
  - aplica `ValidationPipe` global
- `app/api/src/main-worker.ts`
  - sobe um app Nest para worker (`WorkerModule`)
  - chama apenas `app.init()` (sem `listen()`)
  - não expõe porta HTTP

### Módulos de runtime

- `AppModule`
  - API HTTP com controllers (`auth`, `secrets`, `schedules`)
- `WorkerModule`
  - sem controllers HTTP
  - importa apenas `ConfigModule`, `PrismaModule` e `RabbitMQModule`
  - registra `SecretReleaseConsumerService` e `SecretReleaseProcessorService`

## Funcionalidades Implementadas

### Autenticação

Rotas:

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me` (JWT)

Comportamentos implementados:

- hash de senha com Argon2
- emissão de JWT
- guard `JwtAuthGuard`
- strategy JWT via Passport

### Secrets

Rotas protegidas por JWT:

- `POST /secrets`
- `GET /secrets/:id`
- `POST /secrets/:id/schedules`

Comportamentos implementados:

- criptografia em repouso com `aes-256-gcm`
- persistência de `cipherText`, `iv`, `authTag`, `algorithm`, `keyVersion`
- leitura do segredo com descriptografia no retorno
- validação de ownership (`ownerId`)
- agendamento com validação de data futura

### Processamento Assíncrono (RabbitMQ)

Fluxo atual:

1. criação de agendamento (`PENDING`)
2. publicação em RabbitMQ e atualização para `QUEUED`
3. consumer processa mensagem
4. se ainda não chegou o horário, reenvia para delay queue
5. quando chega o horário, atualiza secret/schedule e cria histórico

Detalhes técnicos implementados:

- exchange `direct`
- queue principal
- delay queue com TTL + DLX (sem plugin externo)
- processamento transacional com Prisma
- controle de tentativas no agendamento
- retry/backoff na conexão com RabbitMQ

## Modos de Execução (`RUN_MODE`)

A variável `RUN_MODE` controla se o consumer de RabbitMQ deve iniciar.

- `RUN_MODE=api` (default)
  - API HTTP sobe normalmente
  - consumer é desabilitado e registra log `Consumer disabled (RUN_MODE=api)`
- `RUN_MODE=worker`
  - worker sobe sem HTTP
  - consumer inicia e passa a consumir a fila

## Tecnologias

- Node.js 22
- NestJS 11
- TypeScript
- Prisma ORM 7
- PostgreSQL 16
- RabbitMQ (amqplib)
- JWT + Passport
- Argon2
- Zod (validação de env)
- Swagger/OpenAPI
- Jest
- Docker / Docker Compose

## Estrutura do Projeto

```text
.
├── docker-compose.yml
├── .env.example
└── app/
    └── api/
        ├── Dockerfile
        ├── prisma/
        ├── src/
        │   ├── main.ts
        │   ├── main-worker.ts
        │   ├── app.module.ts
        │   ├── worker.module.ts
        │   ├── config/
        │   ├── database/
        │   ├── integrations/rabbitmq/
        │   ├── modules/
        │   └── shared/
        ├── test/
        ├── .env.local.example
        └── package.json
```

## Variáveis de Ambiente

### Arquivos de exemplo

- Raiz (Docker Compose): `.env.example`
- API local (host): `app/api/.env.local.example`

### Variáveis principais (API/Worker)

Obrigatórias (sem default no código):

- `DATABASE_URL`
- `JWT_SECRET`
- `ENCRYPTION_KEY_BASE64` (deve decodificar para 32 bytes)
- `RABBITMQ_URL`

Com default no código (`app/api/src/config/env.ts`):

- `RUN_MODE=api`
- `PORT=3000`
- `JWT_EXPIRES_IN_SECONDS=900`
- `RABBITMQ_EXCHANGE=secret-release-ex`
- `RABBITMQ_QUEUE=secret-release`
- `RABBITMQ_DELAY_QUEUE=secret-release.delay`
- `RABBITMQ_DELAY_MS=30000`
- `RABBITMQ_CONNECT_RETRIES=10`
- `RABBITMQ_CONNECT_RETRY_DELAY_MS=1000`

## Executando com Docker Compose (API + Worker)

### 1. Configurar variáveis

Na raiz do projeto:

```bash
cp .env.example .env
```

### 2. Subir o ambiente

```bash
docker compose up --build
```

Serviços iniciados:

- `postgres`
- `rabbitmq`
- `adminer`
- `api` (HTTP, `RUN_MODE=api`)
- `worker` (sem HTTP, `RUN_MODE=worker`)

Observações do estado atual:

- `api` e `worker` usam a mesma imagem base da API no compose
- a imagem da API executa `npm run build` e valida a presença de `dist/main-worker.js`
- o container `api` executa migrations no startup (`prisma migrate deploy`)
- o container `worker` executa `npm run start:worker:prod`

### Endereços úteis

- API: `http://localhost:3000`
- Swagger: `http://localhost:3000/docs`
- RabbitMQ UI: `http://localhost:15672`
- Adminer: `http://localhost:8080`
- PostgreSQL (host): `localhost:5433`

### Logs

Acompanhar logs da API e worker:

```bash
docker compose logs -f api worker
```

## Executando Localmente (desenvolvimento)

A recomendação prática é rodar a infraestrutura via Docker e a API/worker no host.

### 1. Infraestrutura

Na raiz:

```bash
cp .env.example .env
docker compose up -d postgres rabbitmq adminer
```

### 2. Configuração local da API

```bash
cp app/api/.env.local.example app/api/.env.local
```

Ajuste os valores (principalmente `DATABASE_URL` e `RABBITMQ_URL`) para `localhost` se necessário.

### 3. Dependências

```bash
cd app/api
npm install
```

### 4. Prisma (CLI)

O Prisma CLI precisa de `DATABASE_URL` disponível no ambiente ao rodar comandos como `prisma generate` e `migrate`.

Opções comuns:

- exportar `DATABASE_URL` no shell
- manter um `app/api/.env` com a `DATABASE_URL` válida para o ambiente local

Gerar client:

```bash
npx prisma generate
```

Aplicar migrations:

```bash
npm run migrate
```

### 5. Rodar API e worker em dev

Terminal 1 (API HTTP):

```bash
RUN_MODE=api npm run start:dev
```

Terminal 2 (worker):

```bash
RUN_MODE=worker npm run start:worker
```

Observação: o worker usa `main-worker` e não abre porta HTTP.

## Rotas HTTP Disponíveis

### Rota raiz

- `GET /` -> retorna `Hello World!`

### Auth

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me` (Bearer token)

Payloads (resumo):

- `register`: `name`, `email`, `password` (`password` com mínimo de 8)
- `login`: `email`, `password`

### Secrets (Bearer token)

- `POST /secrets`
  - payload: `secret` (obrigatório), `title?`, `description?`
- `GET /secrets/:id`
  - retorna segredo descriptografado para o owner
- `POST /secrets/:id/schedules`
  - payload: `scheduledFor` (ISO date futura)

## RabbitMQ: Resiliência de Conexão

O cliente RabbitMQ implementa retry com backoff linear no `onModuleInit`.

- tentativas: `RABBITMQ_CONNECT_RETRIES` (default `10`)
- atraso base: `RABBITMQ_CONNECT_RETRY_DELAY_MS` (default `1000` ms)
- backoff: `base * tentativa` (1x, 2x, 3x...)

Se todas as tentativas falharem, a aplicação registra erro claro e falha o processo (comportamento útil para restart pelo Docker).

## Testes

Executar na pasta `app/api`:

```bash
npm run test
npm run test:e2e
```

Também disponíveis:

- `npm run test:watch`
- `npm run test:cov`

O projeto possui testes unitários e e2e (ex.: auth, crypto, publisher RabbitMQ, processor de liberação e endpoints principais).

## Scripts (`app/api/package.json`)

Principais scripts:

- `npm run build` (executa `prisma generate` + build Nest)
- `npm run start:dev`
- `npm run start:prod`
- `npm run start:worker`
- `npm run start:worker:prod`
- `npm run migrate`
- `npm run test`
- `npm run test:e2e`

## Observações de Segurança

- segredos são armazenados criptografados (não em texto puro)
- autenticação via JWT Bearer
- validação de payloads com `class-validator`
- validação de variáveis de ambiente com Zod
- controle de acesso por owner nas rotas de segredo/agendamento


