import { useCallback, useEffect, useState } from 'react'
import { isGitHubPagesRuntime } from '../utils/runtime'

const staticDemoUser = {
  id: 'github-pages-demo',
  username: 'Demo',
}

// 静态预览允许用户输入任意用户名进入系统，但不写入后端。
const createStaticUser = (username) => ({
  id: 'github-pages-demo',
  username: username.trim() || staticDemoUser.username,
})

const parseApiResponse = async (response) => {
  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    // 后端会返回统一的 error 字段，前端直接抛出给表单展示。
    throw new Error(payload.error || '请求失败。')
  }

  return payload
}

const postAuthRequest = async (url, body = null) => {
  const response = await fetch(url, {
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    method: 'POST',
  })

  return parseApiResponse(response)
}

export function useAuth() {
  // GitHub Pages 无法运行 Express 后端，因此线上静态预览走 demo 登录流程。
  const isStaticDemo = isGitHubPagesRuntime()
  const [authError, setAuthError] = useState('')
  const [isAuthLoading, setIsAuthLoading] = useState(!isStaticDemo)
  const [user, setUser] = useState(isStaticDemo ? staticDemoUser : null)

  const applySessionResponse = useCallback((payload) => {
    setUser(payload.authenticated ? payload.user : null)
  }, [])

  const checkSession = useCallback(async () => {
    setIsAuthLoading(true)
    setAuthError('')

    if (isStaticDemo) {
      setUser(staticDemoUser)
      setIsAuthLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/session', {
        credentials: 'include',
      })
      const payload = await parseApiResponse(response)
      applySessionResponse(payload)
    } catch (error) {
      setUser(null)
      setAuthError(error instanceof Error ? error.message : '会话校验失败。')
    } finally {
      setIsAuthLoading(false)
    }
  }, [applySessionResponse, isStaticDemo])

  useEffect(() => {
    let isMounted = true

    if (isStaticDemo) return undefined

    // 页面刷新后主动询问后端是否仍有有效 Cookie session。
    const loadSession = async () => {
      try {
        const response = await fetch('/api/auth/session', {
          credentials: 'include',
        })
        const payload = await parseApiResponse(response)

        if (isMounted) {
          applySessionResponse(payload)
        }
      } catch (error) {
        if (isMounted) {
          setUser(null)
          setAuthError(
            error instanceof Error ? error.message : '会话校验失败。',
          )
        }
      } finally {
        if (isMounted) {
          setIsAuthLoading(false)
        }
      }
    }

    loadSession()

    return () => {
      isMounted = false
    }
  }, [applySessionResponse, isStaticDemo])

  const login = async ({ password, username }) => {
    setAuthError('')

    if (isStaticDemo) {
      // 静态环境下不校验密码，只用于展示页面和交互效果。
      const staticUser = createStaticUser(username)
      setUser(staticUser)
      return staticUser
    }

    const payload = await postAuthRequest('/api/auth/login', {
      password,
      username,
    })
    setUser(payload.user)
    return payload.user
  }

  const register = async ({ password, username }) => {
    setAuthError('')

    if (isStaticDemo) {
      // 注册在静态环境中同样退化为 demo 登录，不产生真实账号。
      const staticUser = createStaticUser(username)
      setUser(staticUser)
      return staticUser
    }

    const payload = await postAuthRequest('/api/auth/register', {
      password,
      username,
    })
    setUser(payload.user)
    return payload.user
  }

  const logout = async () => {
    setAuthError('')

    if (isStaticDemo) {
      setUser(null)
      return
    }

    await postAuthRequest('/api/auth/logout')
    setUser(null)
  }

  return {
    authError,
    checkSession,
    isAuthLoading,
    login,
    logout,
    register,
    setAuthError,
    user,
  }
}
