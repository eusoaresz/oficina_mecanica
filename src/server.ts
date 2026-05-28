import express from 'express'
const app = express()
const port = 3000

import routesAlunos from "./routes/clientes"
import routesDepositos from "./routes/depositos"
import routesProdutos from "./routes/veiculo"
import routesVendas from "./routes/vendas"

app.use(express.json())

app.use("/clientes", routesAlunos)
app.use("/depositos", routesDepositos)
app.use("/veiculos", routesProdutos)
app.use("/vendas", routesVendas)

app.get('/', (req, res) => {
  res.send('API: Sistema de uma Oficina Mecânica')
})

app.listen(port, () => {
  console.log(`Servidor Rodando na Porta: ${port}`)
})
