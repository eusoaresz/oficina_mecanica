import express from 'express'
const app = express()
const port = 3000

import routesAlunos from "./routes/alunos"
import routesDepositos from "./routes/depositos"
import routesProdutos from "./routes/produtos"
import routesVendas from "./routes/vendas"

app.use(express.json())

app.use("/alunos", routesAlunos)
app.use("/depositos", routesDepositos)
app.use("/produtos", routesProdutos)
app.use("/vendas", routesVendas)

app.get('/', (req, res) => {
  res.send('API: Sistema de Controle de Cantina Escolar')
})

app.listen(port, () => {
  console.log(`Servidor Rodando na Porta: ${port}`)
})
