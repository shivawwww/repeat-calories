import LoginForm from './LoginForm'

export const metadata = { title: 'Sign In — Repeat Calories' }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>
}) {
  const { callbackUrl } = await searchParams
  return <LoginForm callbackUrl={callbackUrl && callbackUrl.startsWith('/') ? callbackUrl : '/menu'} />
}
