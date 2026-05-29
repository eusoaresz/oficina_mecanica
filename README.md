# Sistema de Controle de Oficina

API backend em Node.js com Express, TypeScript, Prisma e MySQL para gerenciamento de clientes, veículos, ordens de serviço e depósitos.

## Tecnologias

- Node.js
- Express
- TypeScript
- Prisma 7
- MySQL/MariaDB
- Zod
- Nodemailer

## Estrutura do projeto

- `src/` contém a API e as rotas HTTP.
- `lib/` contém a inicialização do Prisma Client.
- `prisma/` contém schema, seed e migrations.
- `generated/` é a saída do Prisma Client gerado (não versionar).

## Pré-requisitos

- Node.js 20+
- NPM 10+
- MySQL ou MariaDB em execução

## Passo a passo para executar

### 1) Instalar dependências

```bash
npm install
```

### 2) Criar o arquivo `.env`

Na raiz do projeto, crie um arquivo chamado `.env`.

Exemplo:

```env
# Prisma (usado em prisma.config.ts)
DATABASE_URL="mysql://root:senha@localhost:3306/oficina_mecanica"

# Adapter MariaDB (usado em lib/prisma.ts)
DATABASE_HOST="localhost"
DATABASE_USER="root"
DATABASE_PASSWORD="senha"
DATABASE_NAME="oficina_mecanica"

# Mailtrap (usado no envio de e-mail em src/routes/clientes.ts)
MAILTRAP_EMAIL="seu_usuario_mailtrap"
MAILTRAP_SENHA="sua_senha_mailtrap"
```

> Importante: mantenha `DATABASE_URL` e as variáveis `DATABASE_*` apontando para o mesmo banco.

### 3) Gerar o Prisma Client

```bash
npx prisma generate
```

### 4) Criar/aplicar as tabelas no banco

Se estiver iniciando o projeto pela primeira vez:

```bash
npx prisma migrate dev --name init
```

Se já existirem migrations no projeto e você só quer aplicar:

```bash
npx prisma migrate deploy
```

### 5) (Opcional) Popular o banco com seed

```bash
npx prisma db seed
```

### 6) Iniciar a API em modo desenvolvimento

```bash
npm run dev
```

Servidor padrão: `http://localhost:3000`

## Comandos úteis

```bash
npx prisma studio
npx prisma migrate status
```

## Solução rápida de problemas

- Erro de import em `generated/prisma/client`: execute `npx prisma generate`.
- Erro de conexão com banco: revise `DATABASE_URL` e variáveis `DATABASE_*` no `.env`.
- O Prisma usa a configuração de `prisma.config.ts`; mantenha o `.env` na raiz do projeto.