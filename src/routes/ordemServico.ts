import { prisma } from "../../lib/prisma"
import { Router } from 'express'
import { z } from 'zod'

const router = Router()

// Status possíveis para a ordem de serviço
const statusEnum = z.enum(["ABERTA", "EM_ANDAMENTO", "AGUARDANDO_PAGAMENTO", "CONCLUIDA", "CANCELADA"])

const ordemServicoSchema = z.object({
  veiculoId: z.number({ error: "ID do veículo é obrigatório" }),
  servicoId:  z.number({ error: "ID do serviço é obrigatório" }),
  valor:      z.number().positive({ message: "Valor deve ser positivo" }),
  status:     statusEnum.default("ABERTA"),
  dataEntrada: z.string().datetime().optional(), // se não informado, usa new Date()
  dataSaida:   z.string().datetime().nullable().optional()
})

const atualizarOrdemSchema = z.object({
  valor:    z.number().positive().optional(),
  status:   statusEnum.optional(),
  dataSaida: z.string().datetime().nullable().optional()
})

// ── GET / ── lista todas as ordens de serviço ──────────────────────────────
router.get("/", async (req, res) => {
  try {
    const ordens = await prisma.ordemServico.findMany({
      include: {
        veiculo: true,
        servico: true
      },
      orderBy: { dataEntrada: "desc" }
    })
    res.status(200).json(ordens)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

// ── GET /:id ── busca uma ordem de serviço pelo id ─────────────────────────
router.get("/:id", async (req, res) => {
  const { id } = req.params

  try {
    const ordem = await prisma.ordemServico.findUnique({
      where: { id: Number(id) },
      include: {
        veiculo: true,
        servico: true
      }
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

// ── POST / ── cria uma nova ordem de serviço ───────────────────────────────
router.post("/", async (req, res) => {
  const valida = ordemServicoSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error.flatten() })
    return
  }

  const { veiculoId, servicoId, valor, status, dataEntrada, dataSaida } = valida.data

  // valida se o veículo existe
  const veiculo = await prisma.veiculo.findUnique({ where: { id: veiculoId } })
  if (!veiculo) {
    res.status(400).json({ erro: "Veículo não encontrado" })
    return
  }

  // valida se o serviço existe
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
        veiculo: true,
        servico: true
      }
    })

    res.status(201).json(novaOrdem)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

// ── PUT /:id ── atualiza valor, status ou data de saída ────────────────────
router.put("/:id", async (req, res) => {
  const { id } = req.params

  const valida = atualizarOrdemSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error.flatten() })
    return
  }

  // verifica se a ordem existe antes de atualizar
  const ordemExistente = await prisma.ordemServico.findUnique({
    where: { id: Number(id) }
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
        veiculo: true,
        servico: true
      }
    })

    res.status(200).json(ordemAtualizada)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

// ── DELETE /:id ── remove uma ordem de serviço ─────────────────────────────
router.delete("/:id", async (req, res) => {
  const { id } = req.params

  const ordemExistente = await prisma.ordemServico.findUnique({
    where: { id: Number(id) }
  })

  if (!ordemExistente) {
    res.status(404).json({ erro: "Ordem de serviço não encontrada" })
    return
  }

  try {
    const ordemExcluida = await prisma.ordemServico.delete({
      where: { id: Number(id) }
    })

    res.status(200).json(ordemExcluida)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

export default router