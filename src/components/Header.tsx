import type { FC } from 'hono/jsx'

type HeaderProps = {
  username?: string
  showAuth: boolean
}

export const Header: FC<HeaderProps> = ({ username, showAuth }) => {
  return (
    <div class="header">
      <h1>Notes</h1>
      {showAuth && username && (
        <div class="user-info">
          <span class="username">Logged in as {username}</span>
          <a href="/logout" class="logout-btn">
            Logout
          </a>
        </div>
      )}
    </div>
  )
}
