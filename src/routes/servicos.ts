import { prisma } from "../../lib/prisma"
import { Router, Request, Response } from "express"
import { z } from "zod"

const router = Router()

const servicoSchema = z.object({
  descricao: z.string().min(2).max(60),
  valor: z.number().positive(),
})

router.get("/", async (req: Request, res: Response) => {
  try {
    const servicos = await prisma.servico.findMany({
      orderBy: { descricao: "asc" },
    })
    res.json(servicos)
  } catch (error) {
    res.status(500).json({ erro: "Erro ao buscar serviços." })
  }
})

router.get("/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id)

  if (isNaN(id)) {
    res.status(400).json({ erro: "ID inválido." })
    return
  }

  try {
    const servico = await prisma.servico.findUnique({
      where: { id },
      include: { ordensServico: true },
    })

    if (!servico) {
      res.status(404).json({ erro: "Serviço não encontrado." })
      return
    }

    res.json(servico)
  } catch (error) {
    res.status(500).json({ erro: "Erro ao buscar serviço." })
  }
})

router.post("/", async (req: Request, res: Response) => {
  const parsed = servicoSchema.safeParse(req.body)

  if (!parsed.success) {
    res.status(400).json({ erro: parsed.error.flatten().fieldErrors })
    return
  }

  const { descricao, valor } = parsed.data

  try {
    const servico = await prisma.servico.create({
      data: { descricao, valor },
    })
    res.status(201).json(servico)
  } catch (error) {
    res.status(500).json({ erro: "Erro ao criar serviço." })
  }
})

router.put("/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id)

  if (isNaN(id)) {
    res.status(400).json({ erro: "ID inválido." })
    return
  }

  const parsed = servicoSchema.safeParse(req.body)

  if (!parsed.success) {
    res.status(400).json({ erro: parsed.error.flatten().fieldErrors })
    return
  }

  const { descricao, valor } = parsed.data

  try {
    const servico = await prisma.servico.update({
      where: { id },
      data: { descricao, valor },
    })
    res.json(servico)
  } catch (error: any) {
    if (error.code === "P2025") {
      res.status(404).json({ erro: "Serviço não encontrado." })
      return
    }
    res.status(500).json({ erro: "Erro ao atualizar serviço." })
  }
})

router.delete("/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id)

  if (isNaN(id)) {
    res.status(400).json({ erro: "ID inválido." })
    return
  }

  try {
    await prisma.servico.delete({ where: { id } })
    res.status(204).send()
  } catch (error: any) {
    if (error.code === "P2025") {
      res.status(404).json({ erro: "Serviço não encontrado." })
      return
    }
    if (error.code === "P2003") {
      res
        .status(409)
        .json({ erro: "Serviço vinculado a ordens de serviço e não pode ser excluído." })
      return
    }
    res.status(500).json({ erro: "Erro ao excluir serviço." })
  }
})

export default router