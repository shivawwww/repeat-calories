import ResetPasswordForm from './ResetPasswordForm'

export const metadata = { title: 'Reset Password — Repeat Calories' }

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  return <ResetPasswordForm token={token ?? null} />
}
