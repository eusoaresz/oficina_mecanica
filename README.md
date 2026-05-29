# Sistema de Controle de Oficina

API backend em Node.js com Express, TypeScript, Prisma e MySQL/MariaDB para gerenciamento de clientes, veículos, ordens de serviços, serviços e depósitos.

## Tecnologias

- Node.js
- Express 5
- TypeScript
- Prisma 7
- MySQL/MariaDB
- Zod
- Nodemailer

## Estrutura atual do projeto

- `src/server.ts` é o ponto de entrada da API.
- `src/routes/` concentra as rotas HTTP.
- `lib/prisma.ts` centraliza a instância do Prisma Client com o adapter MariaDB.
- `prisma/schema.prisma` define o schema do banco.
- `prisma/seed.ts` contém os dados de seed.
- `prisma/migrations/` guarda as migrations.
- `generated/prisma/` é a saída gerada do Prisma Client e não deve ser versionada.

## Principais rotas

A API sobe em `http://localhost:3000` e expõe os seguintes recursos:

- `GET /`
- `/clientes`
- `/depositos`
- `/veiculos`
- `/ordemServico`

## Pré-requisitos

- Node.js 20+
- NPM 10+
- MySQL ou MariaDB em execução

## Como executar o projeto

### 1) Instalar dependências

```bash
npm install
```

### 2) Criar o arquivo `.env`

Na raiz do projeto, crie um arquivo chamado `.env`.

Exemplo:

```env
# Prisma / banco
DATABASE_URL="mysql://root:senha@localhost:3306/oficina_mecanica"

# Adapter MariaDB usado em lib/prisma.ts
DATABASE_HOST="localhost"
DATABASE_USER="root"
DATABASE_PASSWORD="senha"
DATABASE_NAME="oficina_mecanica"

# Envio de e-mail
MAILTRAP_EMAIL="seu_usuario_mailtrap"
MAILTRAP_SENHA="sua_senha_mailtrap"
```

> Importante: mantenha `DATABASE_URL` e as variáveis `DATABASE_*` apontando para o mesmo banco.

### 3) Gerar o Prisma Client

```bash
npx prisma generate
```

### 4) Aplicar as migrations

Se estiver iniciando o projeto pela primeira vez:

```bash
npx prisma migrate dev --name init
```

Se as migrations já existirem e você só quiser aplicar no banco:

```bash
npx prisma migrate deploy
```

### 5) Popular o banco com seed

```bash
npx prisma db seed
```

### 6) Iniciar a API em modo desenvolvimento

```bash
npm run dev
```

Servidor padrão: `http://localhost:3000`

## Scripts disponíveis

```bash
npm run dev
```

## Comandos úteis do Prisma

```bash
npx prisma studio
npx prisma migrate status
npx prisma generate
```

## Observações importantes

- O projeto usa `src/server.ts` como entrypoint.
- O Prisma Client é importado de `generated/prisma/client`.
- Sempre que alterar o schema, execute novamente `npx prisma generate`.
- Se houver erro de conexão, revise as variáveis do `.env` e a configuração do banco.

## Solução rápida de problemas

- Erro de import em `generated/prisma/client`: execute `npx prisma generate`.
- Erro de conexão com banco: revise `DATABASE_URL` e variáveis `DATABASE_*` no `.env`.
- Se o Prisma não reconhecer alterações no schema, verifique `prisma/schema.prisma` e rode novamente `npx prisma generate`.
