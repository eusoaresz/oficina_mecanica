import { Request, Response, NextFunction } from "express"

const HORA_INICIO = 10
const HORA_FIM    = 22

export function validarHorario(req: Request, res: Response, next: NextFunction) {
  const hora = new Date().getHours()

  if (hora < HORA_INICIO || hora >= HORA_FIM) {
    res.status(403).json({
      erro: `Operação não permitida fora do horário de funcionamento (${HORA_INICIO}h às ${HORA_FIM}h).`,
    })
    return
  }

  next()
}
