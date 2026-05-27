import { prisma } from "../../lib/prisma"
import { Router } from 'express'
import { z } from 'zod'

const router = Router()

const idParamSchema = z.object({
  id: z.coerce.number().int().positive({ message: "O id deve ser um número inteiro positivo" })
})

const veiculoSchema = z.object({
  modelo: z.string()
  .min(4,{ message: "O modelo do veiculo deve possuir, no mínimo, 4 caracteres" })
  .max(30, { message: "O modelo do veiculo deve possuir, no máximo, 30 caracteres" }),
  marca: z.string()
  .min(4,{ message: "A marca do veiculo deve possuir, no mínimo, 4 caracteres" })
  .max(30, { message: "A marca do veiculo deve possuir, no máximo, 30 caracteres" }),
  placa: z.string()
  .max(40, { message: "A placa do veiculo deve possuir, no máximo, 40 caracteres" }),
  ano: z.coerce.number().int()
  .min(1900, { message: "O ano do veiculo deve ser maior ou igual a 1900" })
  .max(new Date().getFullYear(), { message: "O ano do veiculo deve ser menor ou igual ao ano atual" }),
  status: z.string().optional(),
  clienteId: z.coerce.number().int().positive({ message: "clienteId deve ser um número inteiro positivo" })
})

router.get("/", async (req, res) => {
  try {
    const veiculos = await prisma.veiculo.findMany()
    res.status(200).json(veiculos)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

router.post("/", async (req, res) => {

  const valida = veiculoSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const { modelo, marca, placa, ano, status, clienteId } = valida.data

  try {
    const veiculo = await prisma.veiculo.create({
      data: { modelo, marca, placa, ano, status, clienteId }
    })
    res.status(201).json(veiculo)
  } catch (error) {
    res.status(400).json({ erro: error })
  }
})

router.delete("/:id", async (req, res) => {
  const validaParams = idParamSchema.safeParse(req.params)
  if (!validaParams.success) {
    res.status(400).json({ erro: validaParams.error })
    return
  }

  const { id } = validaParams.data

  try {
    const veiculo = await prisma.veiculo.delete({
      where: { id }
    })
    res.status(200).json(veiculo)
  } catch (error) {
    res.status(400).json({ erro: error })
  }
})

router.put("/:id", async (req, res) => {
  const validaParams = idParamSchema.safeParse(req.params)
  if (!validaParams.success) {
    res.status(400).json({ erro: validaParams.error })
    return
  }

  const { id } = validaParams.data

  const valida = veiculoSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const { modelo, marca, placa, ano, status, clienteId } = valida.data

  try {
    const veiculo = await prisma.veiculo.update({
      where: { id },
      data: { modelo, marca, placa, ano, status, clienteId }
    })
    res.status(200).json(veiculo)
  } catch (error) {
    res.status(400).json({ erro: error })
  }
})

export default router
