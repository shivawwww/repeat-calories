import ActivateForm from './ActivateForm'

export const metadata = { title: 'Activate Account — Repeat Calories' }

export default async function ActivatePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>
}) {
  const { token, email } = await searchParams
  return <ActivateForm token={token ?? null} initialEmail={email ?? ''} />
}
