import LoginForm from './LoginForm'

export const metadata = { title: 'Sign In — Repeat Calories' }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>
}) {
  const { callbackUrl } = await searchParams
  const safeCallbackUrl = callbackUrl && callbackUrl.startsWith('/') ? callbackUrl : undefined
  return <LoginForm callbackUrl={safeCallbackUrl} />
}
