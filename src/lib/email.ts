import nodemailer from 'nodemailer'

export const emailEnabled = Boolean(process.env.SMTP_HOST && process.env.SMTP_FROM)

export async function sendAuthEmail(to: string, subject: string, actionUrl: string) {
  if (!emailEnabled) throw new Error('Email delivery is not configured.')
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
  })
  await transport.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject,
    text: `${subject}\n\nOpen this link to continue:\n${actionUrl}\n\nIf you did not request this, you can ignore this email.`,
  })
}
