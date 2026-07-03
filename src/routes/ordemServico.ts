import { prisma } from "../../lib/prisma"
import { Router } from 'express'
import { z } from 'zod'
import { transporter } from "../../lib/mailer"
import { verificarToken, ReqUsuario } from "../middlewares/auth"
import { validarHorario } from "../middlewares/horario"

const router = Router()

const statusEnum = z.enum(["ABERTA", "EM_ANDAMENTO", "AGUARDANDO_PAGAMENTO", "CONCLUIDA", "CANCELADA"])

const ordemServicoSchema = z.object({
  veiculoId:   z.number({ error: "ID do veículo é obrigatório" }),
  servicoId:   z.number({ error: "ID do serviço é obrigatório" }),
  valor:       z.number().positive({ message: "Valor deve ser positivo" }),
  status:      statusEnum.default("ABERTA"),
  dataEntrada: z.string().datetime().optional(),
  dataSaida:   z.string().datetime().nullable().optional()
})

const atualizarOrdemSchema = z.object({
  valor:     z.number().positive().optional(),
  status:    statusEnum.optional(),
  dataSaida: z.string().datetime().nullable().optional()
})

// ── Helpers ───────────────────────────────────────────────────────────────

function formatarMoeda(valor: unknown) {
  return Number(valor ?? 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

async function registrarLog(usuarioId: number, acao: string, detalhes?: string, ip?: string) {
  try {
    await prisma.log.create({ data: { usuarioId, acao, detalhes, ip } })
  } catch { /* silencia erros de log */ }
}

function gerarEmailOrdemServico(dados: any) {
  const cliente    = dados.veiculo?.cliente
  const veiculo    = dados.veiculo
  const servico    = dados.servico
  const dataEmissao = new Date().toLocaleString("pt-BR")

  return `
    <html>
      <head><meta charset="UTF-8" /></head>
      <body style="font-family: Arial, Helvetica, sans-serif; color: #1f2937;">
        <div style="max-width: 760px; margin: 0 auto; border: 1px solid #c7c7c7; background: #ffffff;">
          <div style="padding: 18px 20px 14px; border-bottom: 1px solid #c7c7c7; background: #f5f5f5;">
            <h2 style="margin: 0; font-size: 20px; color: #111827;">Oficina Mecânica - Ordem de Serviço</h2>
            <p style="margin: 6px 0 0; font-size: 13px; color: #4b5563;">Resumo gerado automaticamente</p>
          </div>
          <div style="padding: 18px 20px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr><td style="padding: 6px 0; width: 170px;"><strong>Cliente:</strong></td><td>${cliente?.nome ?? "-"}</td></tr>
              <tr><td style="padding: 6px 0;"><strong>Email:</strong></td><td>${cliente?.email ?? "-"}</td></tr>
              <tr><td style="padding: 6px 0;"><strong>Emitido em:</strong></td><td>${dataEmissao}</td></tr>
            </table>
            <div style="margin: 18px 0 10px; padding: 10px 12px; background: #ededed; border: 1px solid #c7c7c7; font-weight: bold; font-size: 13px; text-transform: uppercase;">Dados do veículo</div>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr><td style="padding: 6px 0; width: 170px;"><strong>Modelo:</strong></td><td>${veiculo?.modelo ?? "-"}</td></tr>
              <tr><td style="padding: 6px 0;"><strong>Marca:</strong></td><td>${veiculo?.marca ?? "-"}</td></tr>
              <tr><td style="padding: 6px 0;"><strong>Placa:</strong></td><td>${veiculo?.placa ?? "-"}</td></tr>
              <tr><td style="padding: 6px 0;"><strong>Ano:</strong></td><td>${veiculo?.ano ?? "-"}</td></tr>
            </table>
            <div style="margin: 18px 0 10px; padding: 10px 12px; background: #ededed; border: 1px solid #c7c7c7; font-weight: bold; font-size: 13px; text-transform: uppercase;">Detalhes da ordem</div>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr><td style="padding: 6px 0; width: 170px;"><strong>Serviço:</strong></td><td>${servico?.descricao ?? "-"}</td></tr>
              <tr><td style="padding: 6px 0;"><strong>Status:</strong></td><td>${dados.status ?? "-"}</td></tr>
              <tr><td style="padding: 6px 0;"><strong>Valor:</strong></td><td>R$ ${formatarMoeda(dados.valor)}</td></tr>
              <tr><td style="padding: 6px 0;"><strong>Entrada:</strong></td><td>${dados.dataEntrada ? new Date(dados.dataEntrada).toLocaleString("pt-BR") : "-"}</td></tr>
              <tr><td style="padding: 6px 0;"><strong>Saída:</strong></td><td>${dados.dataSaida ? new Date(dados.dataSaida).toLocaleString("pt-BR") : "-"}</td></tr>
            </table>
            <div style="margin-top: 18px; padding: 12px; border-top: 1px solid #c7c7c7; font-size: 12px; color: #6b7280; text-align: center;">
              Este é um e-mail automático referente ao cadastro de uma nova ordem de serviço.
            </div>
          </div>
        </div>
      </body>
    </html>
  `
}

async function enviarEmailOrdemServico(dados: any) {
  await transporter.sendMail({
    from:    "Oficina Mecânica <mecanicaOficina@gmail.com>",
    to:      dados.veiculo?.cliente?.email,
    subject: "Nova ordem de serviço registrada",
    html:    gerarEmailOrdemServico(dados),
  })
}

// ── GET / — lista ordens NÃO excluídas ───────────────────────────────────

router.get("/", async (req, res) => {
  try {
    const ordens = await prisma.ordemServico.findMany({
      // Tópico 7 — exclui registros com soft delete
      where:   { deleted: false },
      include: { veiculo: true, servico: true },
      orderBy: { dataEntrada: "desc" }
    })
    res.status(200).json(ordens)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

// ── GET /:id ──────────────────────────────────────────────────────────────

router.get("/:id", async (req, res) => {
  const { id } = req.params
  try {
    const ordem = await prisma.ordemServico.findFirst({
      where:   { id: Number(id), deleted: false },
      include: { veiculo: true, servico: true }
    })
    if (!ordem) {
      res.status(404).json({ erro: "Ordem de serviço não encontrada" })
      return
    }
    res.status(200).json(ordem)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

// ── POST / — cria ordem (protegido: token + horário) ─────────────────────
// Tópico 5 — validarHorario impede inclusão fora de 10h–22h
// Token obrigatório para registrar o log com o usuário logado

router.post("/", verificarToken, validarHorario, async (req: ReqUsuario, res) => {
  const valida = ordemServicoSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error.flatten() })
    return
  }

  const { veiculoId, servicoId, valor, status, dataEntrada, dataSaida } = valida.data

  const veiculo = await prisma.veiculo.findUnique({ where: { id: veiculoId } })
  if (!veiculo) {
    res.status(400).json({ erro: "Veículo não encontrado" })
    return
  }

  const servico = await prisma.servico.findUnique({ where: { id: servicoId } })
  if (!servico) {
    res.status(400).json({ erro: "Serviço não encontrado" })
    return
  }

  try {
    const novaOrdem = await prisma.ordemServico.create({
      data: {
        veiculoId,
        servicoId,
        valor,
        status,
        dataEntrada: dataEntrada ? new Date(dataEntrada) : new Date(),
        dataSaida:   dataSaida   ? new Date(dataSaida)   : null
      },
      include: {
        veiculo: { include: { cliente: true } },
        servico: true
      }
    })

    // Log da criação
    if (req.usuarioId) {
      await registrarLog(
        req.usuarioId,
        "ORDEM_CRIADA",
        `Ordem #${novaOrdem.id} criada para veículo #${veiculoId}`,
        req.ip
      )
    }

    try {
      await enviarEmailOrdemServico(novaOrdem)
    } catch (emailError) {
      console.error("Erro ao enviar e-mail da ordem:", emailError)
    }

    res.status(201).json(novaOrdem)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

// ── PUT /:id ──────────────────────────────────────────────────────────────

router.put("/:id", async (req, res) => {
  const { id } = req.params

  const valida = atualizarOrdemSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error.flatten() })
    return
  }

  const ordemExistente = await prisma.ordemServico.findFirst({
    where: { id: Number(id), deleted: false }
  })
  if (!ordemExistente) {
    res.status(404).json({ erro: "Ordem de serviço não encontrada" })
    return
  }

  const { valor, status, dataSaida } = valida.data

  try {
    const ordemAtualizada = await prisma.ordemServico.update({
      where: { id: Number(id) },
      data: {
        ...(valor     !== undefined && { valor }),
        ...(status    !== undefined && { status }),
        ...(dataSaida !== undefined && {
          dataSaida: dataSaida ? new Date(dataSaida) : null
        })
      },
      include: {
        veiculo: { include: { cliente: true } },
        servico: true
      }
    })
    res.status(200).json(ordemAtualizada)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

// ── DELETE /:id — Soft Delete (Tópico 7) + validação de horário (Tópico 5)

router.delete("/:id", verificarToken, validarHorario, async (req: ReqUsuario, res) => {
  const { id } = req.params

  const ordemExistente = await prisma.ordemServico.findFirst({
    where: { id: Number(id), deleted: false }
  })
  if (!ordemExistente) {
    res.status(404).json({ erro: "Ordem de serviço não encontrada" })
    return
  }

  try {
    // Tópico 7 — Soft Delete: não exclui fisicamente, apenas marca deleted
    const ordemExcluida = await prisma.ordemServico.update({
      where: { id: Number(id) },
      data:  { deleted: true, deletedAt: new Date() }
    })

    // Log da exclusão lógica
    if (req.usuarioId) {
      await registrarLog(
        req.usuarioId,
        "ORDEM_EXCLUIDA",
        `Ordem #${id} removida (soft delete)`,
        req.ip
      )
    }

    res.status(200).json({
      mensagem: "Ordem de serviço removida com sucesso",
      ordem:    ordemExcluida
    })
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

export default router
