import { prisma } from "../../lib/prisma"
import { Router } from "express"
import { z } from "zod"
import { Tipos } from "../../generated/prisma";

const router = Router()

export const depositoSchema = z.object({
    clienteId: z.number().int()
      .positive('ID do cliente deve ser um número positivo'),
    tipo: z.nativeEnum(Tipos),
    valor: z.number()
      .positive('Valor deve ser um número positivo'),
})

router.get("/", async (req, res) => {
    try {
        const depositos = await prisma.deposito.findMany({
            include: { cliente: true }
        })
        res.status(200).json(depositos)
    } catch (error) {
        res.status(500).json({ erro: "Erro no servidor" })
    }
})

router.post("/", async (req, res) => {
    const valida = depositoSchema.safeParse(req.body)

    if (!valida.success) {
        res.status(400).json({ erro: valida.error })
        return
    }

    // Desestrutura os dados validados
    const { clienteId, valor, tipo } = valida.data

    const cliente = await prisma.cliente.findUnique({
        where: { id: clienteId }
    })

    if (!cliente) {
        res.status(404).json({ erro: 'Cliente não cadastrado' })
        return
    }

    try {
        // Transação para incluir o depósito e alterar o saldo do cliente
        const [deposito, cliente] = await prisma.$transaction([
           prisma.deposito.create({ data: { clienteId, tipo, valor }}),
           prisma.cliente.update({
            data: { saldo: { increment: valor }},
            where: { id: clienteId }
           })
        ])        
        res.status(201).json({deposito, cliente})
    } catch (error) {
        res.status(500).json({ error })
    }
})

router.delete("/:id", async (req, res) => {
    // recebe o id passado como parâmetro
    const { id } = req.params

    // realiza a exclusão do depósito
    try {
        // pesquisa / obtém dados do depósito a ser excluído
        const depositoExcluido = await prisma.deposito.findUnique(
            { where: { id: Number(id)} }
        )

        const [deposito, cliente] = await prisma.$transaction([
            prisma.deposito.delete({ where: { id: Number(id)} }),
            prisma.cliente.update({
              data: { saldo: { decrement: depositoExcluido?.valor }},
              where: { id: depositoExcluido?.clienteId }
           })
        ])

        res.status(200).json({deposito, cliente})
    } catch (error) {
        res.status(500).json({ erro: error })
    }
})

export default router