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

router.put("/:id", async (req, res) => {
    const { id } = req.params

    const valida = depositoSchema.safeParse(req.body)
    if (!valida.success) {
        res.status(400).json({ erro: valida.error })
        return
    }

    const { clienteId, valor, tipo } = valida.data

    const depositoAtual = await prisma.deposito.findUnique({
        where: { id: Number(id) }
    })

    if (!depositoAtual) {
        res.status(404).json({ erro: 'Depósito não cadastrado' })
        return
    }

    const clienteAtual = await prisma.cliente.findUnique({
        where: { id: depositoAtual.clienteId }
    })

    const clienteNovo = await prisma.cliente.findUnique({
        where: { id: clienteId }
    })

    if (!clienteNovo) {
        res.status(404).json({ erro: 'Cliente não cadastrado' })
        return
    }

    try {
        const mesmoCliente = depositoAtual.clienteId === clienteId
        const saldoAtual = Number(depositoAtual.valor)
        const saldoNovo = Number(valor)

        if (mesmoCliente) {
            const [deposito, cliente] = await prisma.$transaction([
                prisma.deposito.update({
                    where: { id: Number(id) },
                    data: { clienteId, valor, tipo }
                }),
                prisma.cliente.update({
                    where: { id: clienteId },
                    data: { saldo: { increment: saldoNovo - saldoAtual } }
                })
            ])

            res.status(200).json({ deposito, cliente })
            return
        }

        const [deposito, clienteRemovido, cliente] = await prisma.$transaction([
            prisma.deposito.update({
                where: { id: Number(id) },
                data: { clienteId, valor, tipo }
            }),
            prisma.cliente.update({
                where: { id: depositoAtual.clienteId },
                data: { saldo: { decrement: saldoAtual } }
            }),
            prisma.cliente.update({
                where: { id: clienteId },
                data: { saldo: { increment: saldoNovo } }
            })
        ])

        res.status(200).json({ deposito, clienteRemovido, cliente })
    } catch (error) {
        res.status(500).json({ erro: error })
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

        if (!depositoExcluido) {
            res.status(404).json({ erro: 'Depósito não cadastrado' })
            return
        }

        const [deposito, cliente] = await prisma.$transaction([
            prisma.deposito.delete({ where: { id: Number(id)} }),
            prisma.cliente.update({
              data: { saldo: { decrement: depositoExcluido.valor }},
              where: { id: depositoExcluido.clienteId }
           })
        ])

        res.status(200).json({deposito, cliente})
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
        const deposito = await prisma.deposito.findUnique({ 
            where: { id },
            include: { cliente: true }
        })

        if (!deposito) {
            res.status(404).json({ erro: 'Depósito não cadastrado' })
            return
        }

        res.status(200).json(deposito)
    } catch (error) {
        console.log(error)
        res.status(500).json({ erro: 'Erro interno do servidor' })
    }
})

export default router