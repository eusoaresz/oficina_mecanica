import { prisma } from "../../lib/prisma"
import { Router } from "express"
import { z } from "zod"
import { transporter } from "../../lib/mailer"
import { verificarToken, ReqUsuario } from "../middlewares/auth"

const router = Router()

const clienteSchema = z.object({
  nome: z.string()
    .min(3,  "Nome deve possuir no mínimo 3 caracteres")
    .max(60, "Nome deve ter no máximo 60 caracteres"),
  telefone: z.string()
    .min(10, "Telefone deve possuir no mínimo 10 caracteres")
    .max(20, "Telefone deve ter no máximo 20 caracteres"),
  email: z.string().email("E-mail inválido"),
})

// ── GET / ─────────────────────────────────────────────────────────────────

router.get("/", async (req, res) => {
  try {
    const clientes = await prisma.cliente.findMany()
    res.status(200).json(clientes)
  } catch (error) {
    res.status(500).json({ erro: "Erro no servidor" })
  }
})

// ── POST / — protegido por token ──────────────────────────────────────────

router.post("/", verificarToken, async (req: ReqUsuario, res) => {
  const valida = clienteSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error.flatten().fieldErrors })
    return
  }

  const { nome, telefone, email } = valida.data

  try {
    const cliente = await prisma.cliente.create({
      data: { nome, telefone, email }
    })

    // Log da criação do cliente
    if (req.usuarioId) {
      await prisma.log.create({
        data: {
          usuarioId: req.usuarioId,
          acao:      "CLIENTE_CRIADO",
          detalhes:  `Cliente "${nome}" (${email}) cadastrado`,
          ip:        req.ip,
        }
      })
    }

    res.status(201).json(cliente)
  } catch (error) {
    res.status(500).json({ error })
  }
})

// ── PUT /:id ──────────────────────────────────────────────────────────────

router.put("/:id", async (req, res) => {
  const { id } = req.params

  const valida = clienteSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error.flatten().fieldErrors })
    return
  }

  const { nome, telefone, email } = valida.data

  try {
    const cliente = await prisma.cliente.update({
      where: { id: Number(id) },
      data:  { nome, telefone, email }
    })
    res.status(200).json(cliente)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

// ── DELETE /:id — protegido por token ────────────────────────────────────

router.delete("/:id", verificarToken, async (req: ReqUsuario, res) => {
  const id = Number(req.params.id)

  if (Number.isNaN(id)) {
    res.status(400).json({ erro: "ID inválido" })
    return
  }

  try {
    const cliente = await prisma.cliente.delete({ where: { id } })

    // Log da exclusão
    if (req.usuarioId) {
      await prisma.log.create({
        data: {
          usuarioId: req.usuarioId,
          acao:      "CLIENTE_EXCLUIDO",
          detalhes:  `Cliente #${id} excluído`,
          ip:        req.ip,
        }
      })
    }

    res.status(200).json(cliente)
  } catch (error: any) {
    if (error?.code === "P2025") {
      res.status(404).json({ erro: "Cliente não cadastrado" })
      return
    }
    if (error?.code === "P2003") {
      res.status(409).json({
        erro: "Cliente possui registros vinculados (veículos, depósitos ou ordens) e não pode ser excluído"
      })
      return
    }
    res.status(500).json({ erro: "Erro interno do servidor" })
  }
})

// ── GET /email/:id ────────────────────────────────────────────────────────

router.get("/email/:id", async (req, res) => {
  const { id } = req.params
  try {
    const cliente = await prisma.cliente.findUnique({
      where:   { id: Number(id) },
      include: { veiculos: true }
    })

    if (!cliente) {
      res.status(404).json({ erro: "Cliente não cadastrado" })
      return
    }

    await enviaEmail(cliente)
    res.status(200).json(cliente)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

// ── GET /:id ──────────────────────────────────────────────────────────────

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id)
  if (Number.isNaN(id)) {
    res.status(400).json({ erro: "Código inválido" })
    return
  }

  try {
    const cliente = await prisma.cliente.findUnique({ where: { id } })
    if (!cliente) {
      res.status(404).json({ erro: "Cliente não cadastrado" })
      return
    }
    res.status(200).json(cliente)
  } catch (error) {
    res.status(500).json({ erro: "Erro interno do servidor" })
  }
})

// ── E-mail helpers ────────────────────────────────────────────────────────

function gerarTabelaHTML(dados: any) {
  const veiculos = dados.veiculos ?? []
  let html = `
    <html><body style="font-family: Helvetica, Arial, sans-serif;">
    <h2>Relatório do Cliente</h2>
    <h3>Cliente: ${dados.nome}</h3>
    <p><strong>Telefone:</strong> ${dados.telefone}</p>
    <p><strong>E-mail:</strong> ${dados.email}</p>
    <p><strong>Saldo:</strong> R$ ${Number(dados.saldo ?? 0).toLocaleString("pt-br", { minimumFractionDigits: 2 })}</p>
    <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">
      <thead style="background-color: rgb(195, 191, 191);">
        <tr><th>Modelo</th><th>Marca</th><th>Placa</th><th>Ano</th><th>Status</th></tr>
      </thead>
      <tbody>
  `
  for (const v of veiculos) {
    html += `<tr>
      <td>${v.modelo}</td><td>${v.marca}</td><td>${v.placa}</td>
      <td style="text-align:right;">${Number(v.ano).toLocaleString("pt-br", { maximumFractionDigits: 0 })}</td>
      <td>${v.status ?? "-"}</td>
    </tr>`
  }
  if (veiculos.length === 0) {
    html += `<tr><td colspan="5" style="text-align:center;">Nenhum veículo cadastrado</td></tr>`
  }
  html += `</tbody></table></body></html>`
  return html
}

async function enviaEmail(dados: any) {
  await transporter.sendMail({
    from:    "Oficina Mecânica <mecanicaOficina@gmail.com>",
    to:      dados.email,
    subject: "Relatório de Serviços - Oficina Mecânica",
    text:    "Status dos serviços...",
    html:    gerarTabelaHTML(dados),
  })
}

export default router
