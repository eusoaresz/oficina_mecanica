import express from 'express'
const app  = express()
const port = 3000

import routesClientes    from "./routes/clientes"
import routesDepositos   from "./routes/depositos"
import routesVeiculos    from "./routes/veiculo"
import routesOrdemServico from "./routes/ordemServico"
import routesServicos    from "./routes/servicos"
import routesUsuarios    from "./routes/usuarios"

app.use(express.json())

app.use("/clientes",    routesClientes)
app.use("/depositos",   routesDepositos)
app.use("/veiculos",    routesVeiculos)
app.use("/ordemServico", routesOrdemServico)
app.use("/servicos",    routesServicos)
app.use("/usuarios",    routesUsuarios)

app.get('/', (req, res) => {
  res.send('API: Sistema de uma Oficina Mecânica')
})

app.listen(port, () => {
  console.log(`Servidor Rodando na Porta: ${port}`)
})
