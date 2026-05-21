import { useState } from 'react'
import appIcon from '../../assets/icon/icon.png'

const validateUsername = (username) => {
  const trimmedUsername = username.trim()

  if (!trimmedUsername) {
    return '请输入用户名。'
  }

  if (trimmedUsername.length < 3) {
    return '用户名至少需要 3 个字符。'
  }

  if (trimmedUsername.length > 32) {
    return '用户名最多不能超过 32 个字符。'
  }

  if (!/^[A-Za-z0-9_]+$/.test(trimmedUsername)) {
    return '用户名只能包含字母、数字和下划线。'
  }

  return ''
}

const validatePassword = (password, isRegisterMode) => {
  if (!password) {
    return '请输入密码。'
  }

  if (isRegisterMode && password.length < 6) {
    return '密码至少需要 6 个字符。'
  }

  if (password.length > 128) {
    return '密码最多不能超过 128 个字符。'
  }

  return ''
}

const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword) {
    return '请再次输入密码。'
  }

  if (password !== confirmPassword) {
    return '两次输入的密码不一致。'
  }

  return ''
}

export function AuthPage({ authError, onLogin, onRegister, setAuthError }) {
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isRegisterMode, setIsRegisterMode] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [localError, setLocalError] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')

  const error = localError || authError

  const switchMode = () => {
    setIsRegisterMode((currentMode) => !currentMode)
    setConfirmPassword('')
    setLocalError('')
    setAuthError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const trimmedUsername = username.trim()
    const validationMessage =
      validateUsername(trimmedUsername) ||
      validatePassword(password, isRegisterMode) ||
      (isRegisterMode
        ? validateConfirmPassword(password, confirmPassword)
        : '')

    if (validationMessage) {
      setLocalError(validationMessage)
      return
    }

    setIsSubmitting(true)
    setLocalError('')
    setAuthError('')

    try {
      if (isRegisterMode) {
        await onRegister({ password, username: trimmedUsername })
      } else {
        await onLogin({ password, username: trimmedUsername })
      }
    } catch (submitError) {
      setLocalError(
        submitError instanceof Error
          ? submitError.message
          : isRegisterMode
            ? '注册失败。'
            : '登录失败。',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-label={isRegisterMode ? '注册' : '登录'}>
        <div className="auth-brand">
          <img className="auth-brand-icon" src={appIcon} alt="" />
          <span>KafuHomework</span>
        </div>

        <h1>{isRegisterMode ? '注册' : '登录'}</h1>

        <form className="auth-form" noValidate onSubmit={handleSubmit}>
          <label>
            <span>用户名</span>
            <input
              autoComplete="username"
              onChange={(event) => {
                setUsername(event.target.value)
                setLocalError('')
                setAuthError('')
              }}
              required
              value={username}
            />
          </label>

          <label>
            <span>密码</span>
            <input
              autoComplete={isRegisterMode ? 'new-password' : 'current-password'}
              minLength={isRegisterMode ? 6 : undefined}
              onChange={(event) => {
                setPassword(event.target.value)
                setLocalError('')
                setAuthError('')
              }}
              required
              type="password"
              value={password}
            />
          </label>

          {isRegisterMode && (
            <label>
              <span>确认密码</span>
              <input
                autoComplete="new-password"
                minLength={6}
                onChange={(event) => {
                  setConfirmPassword(event.target.value)
                  setLocalError('')
                  setAuthError('')
                }}
                required
                type="password"
                value={confirmPassword}
              />
            </label>
          )}

          {error && <p className="auth-error">{error}</p>}

          <button className="auth-submit-button" disabled={isSubmitting} type="submit">
            {isSubmitting
              ? isRegisterMode
                ? '注册中...'
                : '登录中...'
              : isRegisterMode
                ? '注册'
                : '登录'}
          </button>
        </form>

        <p className="auth-switch-text">
          {isRegisterMode ? '已有账号？' : '还没有账号？'}
          <button type="button" onClick={switchMode}>
            {isRegisterMode ? '登录' : '注册'}
          </button>
        </p>
      </section>
    </main>
  )
}
