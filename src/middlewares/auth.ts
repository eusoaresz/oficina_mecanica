import { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import { prisma } from "../../lib/prisma"

const JWT_SECRET = process.env.JWT_SECRET ?? "segredo_oficina"

export interface ReqUsuario extends Request {
  usuarioId?: number
  usuarioEmail?: string
}

export async function verificarToken(
  req: ReqUsuario,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ erro: "Token não informado" })
    return
  }

  const token = authHeader.split(" ")[1]

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id: number; email: string }
    req.usuarioId = payload.id
    req.usuarioEmail = payload.email
    next()
  } catch {
    // Tenta identificar o usuário pelo token mesmo inválido para logar a tentativa
    try {
      const decoded = jwt.decode(token) as { id?: number } | null
      if (decoded?.id) {
        await prisma.log.create({
          data: {
            usuarioId: decoded.id,
            acao: "ACESSO_NEGADO",
            detalhes: "Token inválido ou expirado",
            ip: req.ip,
          },
        })
      }
    } catch {
      // silencia erros do log para não bloquear a resposta
    }

    res.status(401).json({ erro: "Token inválido ou expirado" })
  }
}
