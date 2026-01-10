import type { FC } from 'hono/jsx'
import { Layout } from '../components/Layout.js'
import { Header } from '../components/Header.js'

type ErrorPageProps = {
  username?: string
  showAuth: boolean
  title: string
  message: string
  statusCode?: number
}

export const ErrorPage: FC<ErrorPageProps> = ({
  username,
  showAuth,
  title,
  message,
  statusCode
}) => {
  return (
    <Layout title={title}>
      {username && <Header username={username} showAuth={showAuth} />}
      <div class="content">
        <h1 class="section-title">{title}</h1>
        {statusCode && <p><strong>Error {statusCode}</strong></p>}
        <p>{message}</p>
        <p><a href="/" class="btn btn-primary">Go Home</a></p>
      </div>
    </Layout>
  )
}
