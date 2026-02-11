# Desafio Técnico — Cofre Digital de Segredos (NestJS)

API desenvolvida como solução para o desafio técnico **Cofre Digital de Segredos – 02/2026**.

O sistema permite que usuários autenticados armazenem segredos criptografados e agendem sua liberação futura, com processamento assíncrono via RabbitMQ.

---

# 📌 Objetivo

Construir uma API backend utilizando NestJS, Prisma, PostgreSQL e RabbitMQ que permita:

- Autenticação de usuários
- Armazenamento seguro de segredos criptografados
- Agendamento de liberação futura
- Processamento assíncrono via fila
- Documentação com Swagger
- Testes unitários das regras centrais

---

# 🧱 Arquitetura

A aplicação segue arquitetura modular baseada em features no NestJS.

```
app/api/
  prisma/
  src/
    config/
    database/
    integrations/
      rabbitmq/
    modules/
      auth/
      users/
      secrets/
```

Cada feature contém:

- http/ → Controllers, Guards, Decorators
- application/ → Serviços e regras de negócio
- domain/ → Contratos e entidades (quando necessário)
- infrastructure/ → Persistência e integrações

---

# 🚀 Tecnologias Utilizadas

- Node.js 22 LTS
- NestJS (TypeScript)
- Prisma ORM (v7)
- PostgreSQL 16
- RabbitMQ
- JWT (Passport Strategy)
- AES-256-GCM (criptografia real)
- Docker & Docker Compose
- Jest
- Swagger (OpenAPI)

---

# ✅ Funcionalidades Implementadas

## 1️⃣ Autenticação

- POST /auth/register
- POST /auth/login
- GET /auth/me (protegido)

Segurança:

- Hash seguro de senha
- JWT Bearer Token
- Passport Strategy
- Guard de autenticação

---

## 2️⃣ Secrets

Usuários autenticados podem:

### ➤ Criar segredo criptografado

- Criptografia simétrica AES-256-GCM
- Armazena:
  - cipherText
  - IV
  - authTag
  - algorithm
  - keyVersion
- Nunca armazena texto puro

### ➤ Recuperar segredo

- Apenas o dono pode acessar
- Descriptografia antes do retorno
- Validação de ownership

### ➤ Agendar liberação futura

- POST /secrets/:id/schedules
- Data/hora futura obrigatória
- Publicação automática em RabbitMQ

---

## 3️⃣ Processamento Assíncrono

Fluxo implementado:

1. Schedule criado → status PENDING
2. Mensagem publicada → status QUEUED
3. Consumer:
   - Se horário ainda não chegou → envia para delay queue (TTL + DLX)
   - Se chegou → processa
4. Ao processar:
   - Secret → AVAILABLE
   - Schedule → PROCESSED
   - Histórico criado em secret_release_history

### Estratégia Técnica

Delay implementado usando:

- x-message-ttl
- x-dead-letter-exchange
- x-dead-letter-routing-key

Sem uso de plugins externos.

Garantias implementadas:

- Idempotência
- Processamento transacional
- Controle de tentativas
- Retry simples via delay queue

---

# 📖 Documentação

Swagger disponível em:

http://localhost:3000/docs

Inclui:

- Autenticação JWT
- Schemas tipados
- Exemplos de request
- Responses 400 / 401 / 403 / 404

---

# 🧪 Testes

Executar:

```
npm run test
```

Cobertura inclui:

- Serviço de criptografia
- Password hashing
- Auth service
- RabbitMQ publisher
- Processor de agendamento
- Regras centrais de negócio

---

# 🐳 Executando com Docker

Na raiz do projeto:

```
docker compose up -d --build
```

Serviços iniciados:

- API
- PostgreSQL
- RabbitMQ

Swagger:
http://localhost:3000/docs

RabbitMQ UI:
http://localhost:15672  
Usuário: guest  
Senha: guest  

---

# 💻 Executando Localmente

1. Instalar dependências:

```
cd app/api
npm install
```

2. Configurar `.env`

3. Rodar migrations:

```
npm run migrate
```

4. Iniciar aplicação:

```
npm run start
```

---

# ⚙️ Variáveis de Ambiente

Exemplo `.env`:

```
PORT=3000

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/cofredigital

JWT_SECRET=supersecret
JWT_EXPIRES_IN_SECONDS=3600

CRYPTO_SECRET=chave-super-secreta-32-bytes
CRYPTO_ALGORITHM=aes-256-gcm

RABBITMQ_URL=amqp://guest:guest@localhost:5672
RABBITMQ_EXCHANGE=secret-release-ex
RABBITMQ_QUEUE=secret-release
RABBITMQ_DELAY_QUEUE=secret-release.delay
RABBITMQ_DELAY_MS=30000
```

---

# 🗄️ Migrations

Aplicar migrations em produção:

```
npx prisma migrate deploy
```

Script disponível:

```
npm run migrate
```

---

# 📦 Scripts Disponíveis

```
"scripts": {
  "start": "nest start",
  "build": "nest build",
  "migrate": "prisma migrate deploy",
  "test": "jest"
}
```

---

# 🔐 Segurança

- JWT com Strategy oficial do Nest
- Guards protegendo rotas
- Validação de DTO com class-validator
- Criptografia AES-256-GCM autenticada
- Segredos nunca armazenados em texto puro
- Validação de variáveis de ambiente com Zod
- Controle de acesso por ownerId

---

# ⭐ Extras Implementados

- Delay queue via TTL + DLX
- Processamento transacional
- Histórico de liberação
- Docker Compose completo
- Estrutura modular organizada
- Testes unitários das regras centrais

---

# 📌 Status Final

Todos os requisitos obrigatórios do desafio foram implementados conforme solicitado:

✔ Autenticação  
✔ Criptografia real  
✔ Agendamento  
✔ RabbitMQ  
✔ Swagger  
✔ Testes  
✔ Docker Compose  
✔ Migrations  

Sistema pronto para execução e avaliação.
