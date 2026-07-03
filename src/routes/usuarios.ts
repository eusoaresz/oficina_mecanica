import { Router } from "express"
import { z } from "zod"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { prisma } from "../../lib/prisma"
import { transporter } from "../../lib/mailer"
import { verificarToken, ReqUsuario } from "../middlewares/auth"

const router = Router()
const JWT_SECRET   = process.env.JWT_SECRET   ?? "segredo_oficina"
const SALT_ROUNDS  = 10

// ── Schemas ───────────────────────────────────────────────────────────────

const senhaSchema = z
  .string()
  .min(8,  "A senha deve ter no mínimo 8 caracteres")
  .regex(/[a-z]/, "A senha deve conter pelo menos uma letra minúscula")
  .regex(/[A-Z]/, "A senha deve conter pelo menos uma letra maiúscula")
  .regex(/[0-9]/, "A senha deve conter pelo menos um número")
  .regex(/[^a-zA-Z0-9]/, "A senha deve conter pelo menos um símbolo")

const cadastroSchema = z.object({
  nome:  z.string().min(3, "Nome deve ter no mínimo 3 caracteres").max(60),
  email: z.string().email("E-mail inválido"),
  senha: senhaSchema,
})

const loginSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(1),
})

const recuperarSchema = z.object({
  email: z.string().email(),
})

const redefinirSchema = z.object({
  email:    z.string().email(),
  codigo:   z.string().min(1),
  novaSenha: senhaSchema,
})

// ── Helpers ───────────────────────────────────────────────────────────────

function gerarCodigo(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

async function registrarLog(
  usuarioId: number,
  acao: string,
  detalhes?: string,
  ip?: string
) {
  try {
    await prisma.log.create({ data: { usuarioId, acao, detalhes, ip } })
  } catch {
    // log nunca deve quebrar a requisição principal
  }
}

// ── POST /usuarios — cadastro ─────────────────────────────────────────────

router.post("/", async (req, res) => {
  const valida = cadastroSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error.flatten().fieldErrors })
    return
  }

  const { nome, email, senha } = valida.data

  // Impede e-mail duplicado
  const existe = await prisma.usuario.findUnique({ where: { email } })
  if (existe) {
    res.status(409).json({ erro: "Já existe um usuário cadastrado com este e-mail" })
    return
  }

  // Criptografa senha
  const hash = await bcrypt.hash(senha, SALT_ROUNDS)

  try {
    const usuario = await prisma.usuario.create({
      data: { nome, email, senha: hash },
      select: { id: true, nome: true, email: true, primeiroAcesso: true },
    })

    await registrarLog(usuario.id, "CADASTRO", `Usuário ${email} cadastrado`, req.ip)

    res.status(201).json(usuario)
  } catch (error) {
    res.status(500).json({ erro: "Erro interno do servidor" })
  }
})

// ── GET /usuarios — listagem (protegida por token) ────────────────────────

router.get("/", verificarToken, async (req: ReqUsuario, res) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: { id: true, nome: true, email: true, ultimoLogin: true, primeiroAcesso: true },
    })
    res.status(200).json(usuarios)
  } catch {
    res.status(500).json({ erro: "Erro interno do servidor" })
  }
})

// ── POST /usuarios/login — gera JWT + Tópico 4 ───────────────────────────

router.post("/login", async (req, res) => {
  const valida = loginSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error.flatten().fieldErrors })
    return
  }

  const { email, senha } = valida.data

  const usuario = await prisma.usuario.findUnique({ where: { email } })

  if (!usuario) {
    res.status(401).json({ erro: "E-mail ou senha inválidos" })
    return
  }

  const senhaCorreta = await bcrypt.compare(senha, usuario.senha)

  if (!senhaCorreta) {
    // Tópico 4 — log de tentativa inválida
    await registrarLog(usuario.id, "LOGIN_FALHOU", "Senha incorreta", req.ip)
    res.status(401).json({ erro: "E-mail ou senha inválidos" })
    return
  }

  // Tópico 4 — salva data/hora do login e marca que não é mais o primeiro acesso
  const ultimoLoginAnterior = usuario.ultimoLogin
  const eraPrimeiroAcesso   = usuario.primeiroAcesso

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { ultimoLogin: new Date(), primeiroAcesso: false },
  })

  // Gera token JWT
  const token = jwt.sign(
    { id: usuario.id, email: usuario.email },
    JWT_SECRET,
    { expiresIn: "8h" }
  )

  await registrarLog(usuario.id, "LOGIN", "Login realizado com sucesso", req.ip)

  // Tópico 4 — mensagem de boas-vindas personalizada
  const mensagemAcesso = eraPrimeiroAcesso
    ? "Bem-vindo! Este é o seu primeiro acesso ao sistema."
    : `Bem-vindo! Seu último acesso foi em ${ultimoLoginAnterior?.toLocaleString("pt-BR")}.`

  res.status(200).json({
    token,
    mensagem: mensagemAcesso,
    usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email },
  })
})

// ── POST /usuarios/recuperar-senha — envia código por e-mail ─────────────

router.post("/recuperar-senha", async (req, res) => {
  const valida = recuperarSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error.flatten().fieldErrors })
    return
  }

  const { email } = valida.data

  const usuario = await prisma.usuario.findUnique({ where: { email } })

  // Sempre retorna 200 para não revelar se o e-mail existe
  if (!usuario) {
    res.status(200).json({ mensagem: "Se o e-mail estiver cadastrado, você receberá o código de recuperação." })
    return
  }

  const codigo    = gerarCodigo()
  const expiracao = new Date(Date.now() + 30 * 60 * 1000) // 30 minutos

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { codigoRecuperacao: codigo, codigoExpiracao: expiracao },
  })

  await registrarLog(usuario.id, "RECUPERACAO_SENHA", "Código de recuperação enviado", req.ip)

  try {
    await transporter.sendMail({
      from:    "Oficina Mecânica <mecanicaOficina@gmail.com>",
      to:      email,
      subject: "Recuperação de senha — Oficina Mecânica",
      html: `
        <p>Olá, <strong>${usuario.nome}</strong>.</p>
        <p>Seu código de recuperação de senha é:</p>
        <h2 style="letter-spacing: 4px;">${codigo}</h2>
        <p>Este código expira em <strong>30 minutos</strong>.</p>
        <p>Se você não solicitou a recuperação de senha, ignore este e-mail.</p>
      `,
    })
  } catch (emailError) {
    console.error("Erro ao enviar e-mail de recuperação:", emailError)
  }

  res.status(200).json({ mensagem: "Se o e-mail estiver cadastrado, você receberá o código de recuperação." })
})

// ── POST /usuarios/redefinir-senha — valida código e salva nova senha ─────

router.post("/redefinir-senha", async (req, res) => {
  const valida = redefinirSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error.flatten().fieldErrors })
    return
  }

  const { email, codigo, novaSenha } = valida.data

  const usuario = await prisma.usuario.findUnique({ where: { email } })

  if (
    !usuario ||
    usuario.codigoRecuperacao !== codigo ||
    !usuario.codigoExpiracao  ||
    usuario.codigoExpiracao < new Date()
  ) {
    res.status(400).json({ erro: "Código inválido ou expirado" })
    return
  }

  const hash = await bcrypt.hash(novaSenha, SALT_ROUNDS)

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: {
      senha:             hash,
      codigoRecuperacao: null,
      codigoExpiracao:   null,
    },
  })

  await registrarLog(usuario.id, "SENHA_REDEFINIDA", "Senha redefinida via código de recuperação", req.ip)

  res.status(200).json({ mensagem: "Senha redefinida com sucesso" })
})

export default router
