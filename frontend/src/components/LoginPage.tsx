import { useState } from 'react'

interface Props {
  loading: boolean
  error: string
  onLogin: (username: string, password: string) => Promise<void>
}

export function LoginPage({ loading, error, onLogin }: Props) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  return <main className="login-page">
    <section className="login-card">
      <h1>Asset Management</h1>
      <form onSubmit={(event) => { event.preventDefault(); void onLogin(username, password) }}>
        <label><span>账号</span><input autoFocus autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="请输入登录账号" /></label>
        <label><span>密码</span><input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="请输入登录密码" /></label>
        {error && <div className="login-error" role="alert">{error}</div>}
        <button className="login-submit" disabled={loading || !username.trim() || !password} type="submit">
          <span>{loading ? '正在登录…' : '登录系统'}</span><b aria-hidden="true">↗</b>
        </button>
      </form>
    </section>
  </main>
}
