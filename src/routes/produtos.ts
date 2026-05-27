import { prisma } from "../../lib/prisma"
import { Router } from 'express'
import { z } from 'zod'

const router = Router()

const produtoSchema = z.object({
  nome: z.string().min(4,
    { message: "Nome do produto deve possuir, no mínimo, 4 caracteres" }),
  quant: z.number(),
  preco: z.number().positive({ message: "Preço deve ser um valor positivo"})
})

router.get("/", async (req, res) => {
  try {
    const produtos = await prisma.produto.findMany()
    res.status(200).json(produtos)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

router.post("/", async (req, res) => {

  const valida = produtoSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const { nome, quant, preco } = valida.data

  try {
    const produto = await prisma.produto.create({
      data: { nome, quant, preco }
    })
    res.status(201).json(produto)
  } catch (error) {
    res.status(400).json({ error })
  }
})

router.delete("/:id", async (req, res) => {
  const { id } = req.params

  try {
    const produto = await prisma.produto.delete({
      where: { id: Number(id) }
    })
    res.status(200).json(produto)
  } catch (error) {
    res.status(400).json({ erro: error })
  }
})

router.put("/:id", async (req, res) => {
  const { id } = req.params

  const valida = produtoSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const { nome, quant, preco } = valida.data

  try {
    const produto = await prisma.produto.update({
      where: { id: Number(id) },
      data: { nome, quant, preco }
    })
    res.status(200).json(produto)
  } catch (error) {
    res.status(400).json({ error })
  }
})

export default router
