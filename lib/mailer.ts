// src/lib/mailer.ts
import nodemailer from "nodemailer"

export const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: process.env.MAILTRAP_USER ?? process.env.MAILTRAP_EMAIL,
    pass: process.env.MAILTRAP_PASS ?? process.env.MAILTRAP_SENHA,
  },
})