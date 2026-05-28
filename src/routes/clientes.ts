import { prisma } from "../../lib/prisma"
import { Router } from "express"
import { z } from "zod"
import nodemailer from "nodemailer"

const router = Router()

const clienteSchema = z.object({
    nome: z.string()
      .min(3, 'Nome deve possuir no mínimo com 3 caracteres')
      .max(60, 'Nome deve ter no máximo 60 caracteres'),
    telefone: z.string()
      .min(10, 'Telefone deve possuir no mínimo 10 caracteres')
      .max(20, 'Telefone deve ter no máximo 20 caracteres'),
    email: z.string().email('E-mail inválido'),
  })

router.get("/", async (req, res) => {
    try {
        const clientes = await prisma.cliente.findMany()
        res.status(200).json(clientes)
    } catch (error) {
        res.status(500).json({ erro: "Erro no servidor" })
    }
})

router.post("/", async (req, res) => {
    const valida = clienteSchema.safeParse(req.body)
    if (!valida.success) {
        res.status(400).json({ erro: valida.error })
        return
    }

    // Desestrutura os dados validados
    const { nome, telefone, email } = valida.data

    try {
        const cliente = await prisma.cliente.create({
            data: { nome, telefone, email }
        })
        res.status(201).json(cliente)
    } catch (error) {
        res.status(500).json({ error })
    }
})

router.put("/:id", async (req, res) => {
    // recebe o id passado como parâmetro
    const { id } = req.params

    const valida = clienteSchema.safeParse(req.body)
    if (!valida.success) {
        res.status(400).json({ erro: valida.error })
        return
    }

    // Desestrutura os dados validados
    const { nome, telefone, email } = valida.data

    try {
        const cliente = await prisma.cliente.update({
            where: { id: Number(id) },
            data: { nome, telefone, email }
        })
        res.status(200).json(cliente)
    } catch (error) {
        res.status(500).json({ erro: error })
    }
})

router.delete("/:id", async (req, res) => {
    // recebe o id passado como parâmetro
    const { id } = req.params

    // realiza a exclusão da seleção
    try {
        const cliente = await prisma.cliente.delete({
            where: { id: Number(id) }
        })
        res.status(200).json(cliente)
    } catch (error) {
        res.status(500).json({ erro: error })
    }
})

router.get("/email/:id", async (req, res) => {
  const { id } = req.params
  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id: Number(id) },
      include: {
        veiculos: true
      }
    })

    if (!cliente) {
      res.status(404).json({ erro: 'Cliente não cadastrado' })
      return
    }

    await enviaEmail(cliente)

    res.status(200).json(cliente)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

router.get('/:id', async (req, res) => {
    const id = Number(req.params.id)
    if (Number.isNaN(id)) {
        res.status(400).json({ erro: 'Código inválido' })
        return
    }

    try {
        const cliente = await prisma.cliente.findUnique({ 
            where: { id } 
        })

        if (!cliente) {
            res.status(404).json({ erro: 'Cliente não cadastrado' })
            return
        }

        res.status(200).json(cliente)
    } catch (error) {
        console.log(error)
        res.status(500).json({ erro: 'Erro interno do servidor' })
    }
})

function gerarTabelaHTML(dados: any) {
  const veiculos = dados.veiculos ?? []

  let html = `
    <html>
    <body style="font-family: Helvetica, Arial, sans-serif;">
    <h2>Relatório do Cliente</h2>
    <h3>Cliente: ${dados.nome}</h3>
    <p><strong>Telefone:</strong> ${dados.telefone}</p>
    <p><strong>E-mail:</strong> ${dados.email}</p>
    <p><strong>Saldo:</strong> R$ ${Number(dados.saldo ?? 0).toLocaleString("pt-br", { minimumFractionDigits: 2 })}</p>
    <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">
      <thead style="background-color: rgb(195, 191, 191);">
        <tr>
          <th>Modelo</th>
          <th>Marca</th>
          <th>Placa</th>
          <th>Ano</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
  `;

  for (const veiculo of veiculos) {
    html += `
      <tr>
        <td>${veiculo.modelo}</td>
        <td>${veiculo.marca}</td>
        <td>${veiculo.placa}</td>
        <td style="text-align: right;">${Number(veiculo.ano).toLocaleString("pt-br", { maximumFractionDigits: 0 })}</td>
        <td>${veiculo.status ?? "-"}</td>
      </tr>
    `;
  }

  if (veiculos.length === 0) {
    html += `
      <tr>
        <td colspan="5" style="text-align: center;">Nenhum veículo cadastrado</td>
      </tr>
    `;
  }

  html += `
          </tbody>
        </table>
      </body>
    </html>
  `;

  return html;
}

const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.MAILTRAP_EMAIL,
    pass: process.env.MAILTRAP_SENHA
  },
});

async function enviaEmail(dados: any) {

  const mensagem = gerarTabelaHTML(dados)

  const info = await transporter.sendMail({
    from: 'Cantina Escolar <cantina@gmail.com>',
    to: dados.email,
    subject: "Relatório de Vendas e Depósitos",
    text: "Relatório de Vendas...", // plain‑text body
    html: mensagem, // HTML body
  });

  console.log("Message sent:", info.messageId);
}
export default router