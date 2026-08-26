import fs from 'node:fs'
import path from 'node:path'
import { Resend } from 'resend'
import { v4 as uuidv4 } from 'uuid'

const FROM = process.env.EMAIL_FROM ?? 'orders@repeatcalories.com'
const LOGO_CID = 'repeat-calories-logo'
const LOGO_PATH = path.join(process.cwd(), 'public', 'logo.png')

let resend: Resend | undefined
// Lazily created on first send (not at module-load) so `next build`'s page-data
// collection — which imports every route module — doesn't require a real API key.
function getResend(): Resend {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY)
  }
  return resend
}

// Table-based layout (not flexbox/grid) and inline styles throughout — Outlook
// desktop renders email HTML with Word's engine, which ignores most modern CSS.
// The logo is a cid: inline attachment rather than a remote <img src>, so it
// renders immediately without the recipient needing to approve "show images".
function wrapper(bodyHtml: string): string {
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5EFE7;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;">
          <tr>
            <td bgcolor="#E87722" style="background:#E87722;padding:18px 24px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-right:12px;">
                    <img src="cid:${LOGO_CID}" width="40" height="40" alt="Repeat Calories" style="display:block;border:0;border-radius:9px;" />
                  </td>
                  <td>
                    <span style="color:#ffffff;font-size:19px;font-weight:bold;">Repeat Calories</span>
                    <div style="color:#ffffff;font-size:11px;opacity:0.9;letter-spacing:0.5px;">REP. EAT. REPEAT.</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 24px;color:#333333;font-size:14px;line-height:1.6;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td bgcolor="#2D6A4F" style="background:#2D6A4F;color:#ffffff;text-align:center;padding:12px;font-size:12px;">
              Repeat Calories &middot; Coimbatore
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`
}

const LOGO_ATTACHMENT = {
  filename: 'logo.png',
  content: fs.readFileSync(LOGO_PATH).toString('base64'),
  contentId: LOGO_CID,
}

function fallbackLinkHtml(url: string): string {
  return `<p style="color:#777777;font-size:12px;word-break:break-all;">If the button above doesn't work, copy and paste this link into your browser: <a href="${url}" style="color:#2D6A4F;">${url}</a></p>`
}

function sendOptions() {
  return {
    replyTo: FROM,
    headers: { 'X-Entity-Ref-ID': uuidv4() },
  }
}

export async function sendWelcomeEmail(params: {
  to: string
  name: string
  tempPassword: string
  activationLink: string
}) {
  const { to, name, tempPassword, activationLink } = params
  const html = wrapper(`
    <h2 style="color:#2D6A4F;margin-top:0;">Welcome, ${name}!</h2>
    <p>Your Repeat Calories account has been created. Here's your temporary password:</p>
    <p style="font-size:20px;font-weight:bold;letter-spacing:2px;background:#F5EFE7;padding:10px 16px;border-radius:8px;display:inline-block;">${tempPassword}</p>
    <p>Click below to activate your account and set your own password:</p>
    <p><a href="${activationLink}" style="background:#E87722;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">Activate Account</a></p>
    <p style="color:#777777;font-size:12px;">This link expires in 48 hours. If it expires, you can request a new one from the login page.</p>
    ${fallbackLinkHtml(activationLink)}
  `)
  const text = [
    `Welcome, ${name}!`,
    '',
    `Your Repeat Calories account has been created. Your temporary password is: ${tempPassword}`,
    '',
    `Activate your account: ${activationLink}`,
    '',
    'This link expires in 48 hours. If it expires, you can request a new one from the login page.',
    '',
    'Repeat Calories · Coimbatore',
  ].join('\n')
  return getResend().emails.send({
    ...sendOptions(),
    from: `Repeat Calories <${FROM}>`,
    to,
    subject: 'Welcome to Repeat Calories — Activate your account',
    html,
    text,
    attachments: [LOGO_ATTACHMENT],
  })
}

export async function sendResetPasswordEmail(params: { to: string; name: string; resetLink: string }) {
  const { to, name, resetLink } = params
  const html = wrapper(`
    <h2 style="color:#2D6A4F;margin-top:0;">Reset your password</h2>
    <p>Hi ${name}, we received a request to reset your Repeat Calories password.</p>
    <p><a href="${resetLink}" style="background:#E87722;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">Reset Password</a></p>
    <p style="color:#777777;font-size:12px;">This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
    ${fallbackLinkHtml(resetLink)}
  `)
  const text = [
    `Reset your password`,
    '',
    `Hi ${name}, we received a request to reset your Repeat Calories password.`,
    '',
    `Reset it here: ${resetLink}`,
    '',
    "This link expires in 1 hour. If you didn't request this, you can ignore this email.",
    '',
    'Repeat Calories · Coimbatore',
  ].join('\n')
  return getResend().emails.send({
    ...sendOptions(),
    from: `Repeat Calories <${FROM}>`,
    to,
    subject: 'Reset your Repeat Calories password',
    html,
    text,
    attachments: [LOGO_ATTACHMENT],
  })
}
