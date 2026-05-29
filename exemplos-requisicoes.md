# Exemplos de Requisições da API

Este arquivo reúne exemplos de `GET`, `POST` e `PUT` para as principais rotas da API da oficina.

Base das rotas conforme o servidor:

- `/clientes`
- `/veiculos`
- `/depositos`
- `/servicos`
- `/ordemServico`

## 1. Cliente

### GET /clientes
Lista todos os clientes.

```http
GET /clientes
```

### GET /clientes/:id
Busca um cliente pelo id.

```http
GET /clientes/1
```

### POST /clientes
Cria um novo cliente.

```http
POST /clientes
Content-Type: application/json

{
  "nome": "Luis Fernando Mattos",
  "telefone": "11999998888",
  "email": "luis@example.com"
}
```

### PUT /clientes/:id
Atualiza um cliente existente.

```http
PUT /clientes/1
Content-Type: application/json

{
  "nome": "Luis Fernando Mattos Silva",
  "telefone": "11988887777",
  "email": "luis.silva@example.com"
}
```

## 2. Veículo

### GET /veiculos
Lista todos os veículos.

```http
GET /veiculos
```

### GET /veiculos/:id
Busca um veículo pelo id.

```http
GET /veiculos/1
```

### POST /veiculos
Cria um novo veículo.

```http
POST /veiculos
Content-Type: application/json

{
  "modelo": "Civic",
  "marca": "Honda",
  "placa": "ABC1D23",
  "ano": 2020,
  "status": "Em manutenção",
  "clienteId": 1
}
```

### PUT /veiculos/:id
Atualiza um veículo existente.

```http
PUT /veiculos/1
Content-Type: application/json

{
  "modelo": "Civic Touring",
  "marca": "Honda",
  "placa": "ABC1D23",
  "ano": 2021,
  "status": "Pronto para entrega",
  "clienteId": 1
}
```

## 3. Depósito

### GET /depositos
Lista todos os depósitos com o cliente relacionado.

```http
GET /depositos
```

### GET /depositos/:id
Busca um depósito pelo id.

```http
GET /depositos/1
```

### POST /depositos
Cria um novo depósito e atualiza o saldo do cliente.

Os valores permitidos para `tipo` são: `PIX`, `Dinheiro` e `Cartao`.

```http
POST /depositos
Content-Type: application/json

{
  "clienteId": 1,
  "tipo": "PIX",
  "valor": 150.00
}
```

### PUT /depositos/:id
Atualiza um depósito existente e ajusta o saldo do cliente.

```http
PUT /depositos/1
Content-Type: application/json

{
  "clienteId": 1,
  "tipo": "Cartao",
  "valor": 200.00
}
```

## 4. Serviço

### GET /servicos
Lista todos os serviços.

```http
GET /servicos
```

### GET /servicos/:id
Busca um serviço pelo id.

```http
GET /servicos/1
```

### POST /servicos
Cria um novo serviço.

```http
POST /servicos
Content-Type: application/json

{
  "descricao": "Troca de óleo",
  "valor": 120.00
}
```

### PUT /servicos/:id
Atualiza um serviço existente.

```http
PUT /servicos/1
Content-Type: application/json

{
  "descricao": "Troca de óleo e filtro",
  "valor": 180.00
}
```

## 5. Ordem de Serviço

### GET /ordemServico
Lista todas as ordens de serviço.

```http
GET /ordemServico
```

### GET /ordemServico/:id
Busca uma ordem de serviço pelo id.

```http
GET /ordemServico/1
```

### POST /ordemServico
Cria uma nova ordem de serviço.

Os valores permitidos para `status` são: `ABERTA`, `EM_ANDAMENTO`, `AGUARDANDO_PAGAMENTO`, `CONCLUIDA` e `CANCELADA`.

```http
POST /ordemServico
Content-Type: application/json

{
  "veiculoId": 1,
  "servicoId": 1,
  "valor": 250.00,
  "status": "ABERTA",
  "dataEntrada": "2026-05-29T10:30:00.000Z",
  "dataSaida": null
}
```

### PUT /ordemServico/:id
Atualiza valor, status ou data de saída de uma ordem.

```http
PUT /ordemServico/1
Content-Type: application/json

{
  "valor": 280.00,
  "status": "EM_ANDAMENTO",
  "dataSaida": null
}
```

## Observações

- Os exemplos de `GET` podem ser usados em cliente REST, navegador ou `curl`.
- Os exemplos de `POST` e `PUT` devem ser enviados com `Content-Type: application/json`.
- Para `clienteId`, `veiculoId` e `servicoId`, use IDs que já existam no banco.
- Em `ordemServico`, se `dataEntrada` não for enviada, o sistema usa a data atual.
