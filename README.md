# Sistema de Controle de Oficina

API backend em Node.js com Express, TypeScript, Prisma e MySQL para gerenciamento de clientes, veículos, ordens de serviço, depósitos e vendas.

## Tecnologias

- Node.js
- Express
- TypeScript
- Prisma 7
- MySQL
- Zod
- Nodemailer

## Estrutura do projeto

- `src/` contém a API e as rotas HTTP.
- `lib/` contém a inicialização do Prisma Client.
- `prisma/` contém o schema, seed e migrations.
- `generated/` é a saída do Prisma Client gerado e não deve ser versionada.

## Principais módulos

- `clientes` para cadastro e consulta de clientes.
- `veiculos` relacionados a cada cliente.
- `ordens de serviço` para controle de atendimento.
- `depositos` e `vendas` para movimentações financeiras.

## Como executar

1. Instale as dependências:

```bash
npm install
```

2. Configure o arquivo `.env` com as credenciais do banco e do Mailtrap.

3. Gere o Prisma Client, se necessário:

```bash
npx prisma generate
```

4. Inicie a aplicação:

```bash
npm run dev
```

## Observações

- O Prisma usa a configuração definida em `prisma.config.ts`.
- O arquivo `.env` não deve ser enviado para o repositório.
- O cliente Prisma gerado em `generated/` também deve ficar fora do Git.