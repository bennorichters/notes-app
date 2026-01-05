import type { FC } from 'hono/jsx'
import { Layout } from '../components/Layout.js'

type LoginPageProps = {
  error?: string
}

export const LoginPage: FC<LoginPageProps> = ({ error }) => {
  return (
    <Layout title="Login - Notes">
      <div class="login-container">
        <h1>Notes Login</h1>
        {error && <div class="error">{error}</div>}
        <form method="post" action="/login">
          <div class="form-group">
            <label for="username">Username</label>
            <input type="text" id="username" name="username" required autofocus />
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" name="password" required />
          </div>
          <button type="submit">Login</button>
        </form>
      </div>
    </Layout>
  )
}
