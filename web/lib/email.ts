import nodemailer, { type Transporter } from 'nodemailer'

const FROM = process.env.EMAIL_FROM ?? 'repeatcalories@gmail.com'

let transporter: Transporter | undefined
// Lazily created on first send (not at module-load) so `next build`'s page-data
// collection — which imports every route module — doesn't require real credentials.
function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
    })
  }
  return transporter
}

function wrapper(bodyHtml: string): string {
  return `
  <div style="font-family: Arial, sans-serif; background:#F5EFE7; padding:32px;">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;">
      <div style="background:#E87722;padding:20px 24px;">
        <span style="color:#fff;font-size:20px;font-weight:bold;">Repeat Calories</span>
        <div style="color:#fff;font-size:12px;opacity:0.9;">Rep. Eat. Repeat.</div>
      </div>
      <div style="padding:28px 24px;color:#333333;font-size:14px;line-height:1.6;">
        ${bodyHtml}
      </div>
      <div style="background:#2D6A4F;color:#fff;text-align:center;padding:12px;font-size:12px;">
        Repeat Calories &middot; Coimbatore
      </div>
    </div>
  </div>`
}

export async function sendWelcomeEmail(params: {
  to: string
  name: string
  tempPassword: string
  activationLink: string
}) {
  const { to, name, tempPassword, activationLink } = params
  const html = wrapper(`
    <h2 style="color:#2D6A4F;">Welcome, ${name}!</h2>
    <p>Your Repeat Calories account has been created. Here's your temporary password:</p>
    <p style="font-size:20px;font-weight:bold;letter-spacing:2px;background:#F5EFE7;padding:10px 16px;border-radius:8px;display:inline-block;">${tempPassword}</p>
    <p>Click below to activate your account and set your own password:</p>
    <p><a href="${activationLink}" style="background:#E87722;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">Activate Account</a></p>
    <p style="color:#777;font-size:12px;">This link expires in 48 hours. If it expires, you can request a new one from the login page.</p>
  `)
  return getTransporter().sendMail({
    from: `Repeat Calories <${FROM}>`,
    to,
    subject: 'Welcome to Repeat Calories — Activate your account',
    html,
  })
}

export async function sendResetPasswordEmail(params: { to: string; name: string; resetLink: string }) {
  const { to, name, resetLink } = params
  const html = wrapper(`
    <h2 style="color:#2D6A4F;">Reset your password</h2>
    <p>Hi ${name}, we received a request to reset your Repeat Calories password.</p>
    <p><a href="${resetLink}" style="background:#E87722;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">Reset Password</a></p>
    <p style="color:#777;font-size:12px;">This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
  `)
  return getTransporter().sendMail({
    from: `Repeat Calories <${FROM}>`,
    to,
    subject: 'Reset your Repeat Calories password',
    html,
  })
}
