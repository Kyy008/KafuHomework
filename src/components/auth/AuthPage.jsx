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

const authPageClass =
  'auth-page grid min-h-screen place-items-center p-6 text-[var(--foreground)] max-md:p-4'
const authCardClass =
  'auth-card w-[min(100%,420px)] rounded-lg border border-[var(--border)] bg-[rgba(36,36,36,0.72)] p-7 shadow-[0_20px_70px_rgba(0,0,0,0.36)] backdrop-blur-lg max-md:p-5'
const authBrandClass =
  'auth-brand inline-flex items-center gap-2 text-lg font-extrabold text-[var(--foreground)]'
const authIconClass = 'auth-brand-icon h-8 w-8 shrink-0 object-contain'
const authTitleClass =
  'mt-6 text-3xl font-extrabold leading-tight text-[var(--foreground)] max-md:text-[1.7rem]'
const authFormClass = 'auth-form mt-6 grid gap-4'
const authLabelClass =
  'grid gap-2 text-sm font-bold text-[var(--foreground)]'
const authInputClass =
  'h-11 w-full rounded-md border border-[var(--border)] bg-[#0f120d] px-3 text-base text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_rgba(207,217,244,0.14)]'
const authErrorClass =
  'auth-error m-0 rounded-md bg-[rgba(255,122,138,0.1)] px-3 py-2 text-sm font-bold text-[var(--danger)]'
const authSubmitClass =
  'auth-submit-button mt-1 min-h-12 rounded-md border-0 bg-[var(--primary)] px-4 text-base font-extrabold text-[var(--primary-foreground)] transition hover:-translate-y-0.5 hover:bg-[#dde6ff] disabled:cursor-not-allowed disabled:opacity-60 active:translate-y-0'
const authSwitchClass =
  'auth-switch-text mt-5 text-sm font-semibold text-[var(--muted-foreground)]'
const authSwitchButtonClass =
  'ml-2 border-0 bg-transparent p-0 font-extrabold text-[var(--primary)] hover:underline'

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
    <main className={authPageClass}>
      <section className={authCardClass} aria-label={isRegisterMode ? '注册' : '登录'}>
        <div className={authBrandClass}>
          <img className={authIconClass} src={appIcon} alt="" />
          <span>KafuHomework</span>
        </div>

        <h1 className={authTitleClass}>{isRegisterMode ? '注册' : '登录'}</h1>

        <form className={authFormClass} noValidate onSubmit={handleSubmit}>
          <label className={authLabelClass}>
            <span>用户名</span>
            <input
              className={authInputClass}
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

          <label className={authLabelClass}>
            <span>密码</span>
            <input
              className={authInputClass}
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
            <label className={authLabelClass}>
              <span>确认密码</span>
              <input
                className={authInputClass}
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

          {error && <p className={authErrorClass}>{error}</p>}

          <button className={authSubmitClass} disabled={isSubmitting} type="submit">
            {isSubmitting
              ? isRegisterMode
                ? '注册中...'
                : '登录中...'
              : isRegisterMode
                ? '注册'
                : '登录'}
          </button>
        </form>

        <p className={authSwitchClass}>
          {isRegisterMode ? '已有账号？' : '还没有账号？'}
          <button className={authSwitchButtonClass} type="button" onClick={switchMode}>
            {isRegisterMode ? '登录' : '注册'}
          </button>
        </p>
      </section>
    </main>
  )
}
