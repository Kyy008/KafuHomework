import cookieParser from 'cookie-parser'
import crypto from 'node:crypto'
import { existsSync } from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')
const dataDir = path.join(__dirname, 'data')
const usersFile = path.join(dataDir, 'users.json')
const sessionsFile = path.join(dataDir, 'sessions.json')
const sessionCookieName = 'kafu_session'
const sessionMaxAgeMs = 7 * 24 * 60 * 60 * 1000
const host = process.env.HOST ?? '127.0.0.1'
const port = Number(process.env.PORT ?? 3001)
const isProduction = process.env.NODE_ENV === 'production'

const app = express()

app.use(express.json())
app.use(cookieParser())

const sendError = (response, status, message) =>
  response.status(status).json({ error: message })

const readJsonFile = async (filePath, fallbackValue) => {
  try {
    const content = await fs.readFile(filePath, 'utf8')
    return JSON.parse(content)
  } catch (error) {
    if (error.code === 'ENOENT') {
      return fallbackValue
    }

    throw error
  }
}

const writeJsonFile = async (filePath, value) => {
  await fs.mkdir(dataDir, { recursive: true })
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

const readUsers = () => readJsonFile(usersFile, [])
const writeUsers = (users) => writeJsonFile(usersFile, users)
const readSessions = () => readJsonFile(sessionsFile, [])
const writeSessions = (sessions) => writeJsonFile(sessionsFile, sessions)

const normalizeUsername = (username) => username.trim()

const validateUsername = (username) => {
  const normalizedUsername = normalizeUsername(username)

  if (!normalizedUsername) {
    return '请输入用户名。'
  }

  if (normalizedUsername.length < 3) {
    return '用户名至少需要 3 个字符。'
  }

  if (normalizedUsername.length > 32) {
    return '用户名最多不能超过 32 个字符。'
  }

  if (!/^[A-Za-z0-9_]+$/.test(normalizedUsername)) {
    return '用户名只能包含字母、数字和下划线。'
  }

  return ''
}

const validatePassword = (password) => {
  if (!password) {
    return '请输入密码。'
  }

  if (password.length < 6) {
    return '密码至少需要 6 个字符。'
  }

  if (password.length > 128) {
    return '密码最多不能超过 128 个字符。'
  }

  return ''
}

const hashPassword = async (password) => {
  const salt = crypto.randomBytes(16).toString('hex')
  const derivedKey = await new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (error, key) => {
      if (error) {
        reject(error)
        return
      }

      resolve(key)
    })
  })

  return `${salt}:${derivedKey.toString('hex')}`
}

const verifyPassword = async (password, storedHash) => {
  const [salt, key] = storedHash.split(':')

  if (!salt || !key) {
    return false
  }

  const derivedKey = await new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (error, result) => {
      if (error) {
        reject(error)
        return
      }

      resolve(result)
    })
  })
  const storedKey = Buffer.from(key, 'hex')

  return (
    storedKey.length === derivedKey.length &&
    crypto.timingSafeEqual(storedKey, derivedKey)
  )
}

const getPublicUser = (user) => ({
  id: user.id,
  username: user.username,
})

const createSession = async (userId, response) => {
  const sessions = await readSessions()
  const now = Date.now()
  const session = {
    expiresAt: new Date(now + sessionMaxAgeMs).toISOString(),
    token: crypto.randomBytes(32).toString('hex'),
    userId,
  }
  const activeSessions = sessions.filter(
    (currentSession) => new Date(currentSession.expiresAt).getTime() > now,
  )

  activeSessions.push(session)
  await writeSessions(activeSessions)

  response.cookie(sessionCookieName, session.token, {
    httpOnly: true,
    maxAge: sessionMaxAgeMs,
    sameSite: 'lax',
    secure: isProduction,
  })

  return session
}

const clearSessionCookie = (response) => {
  response.clearCookie(sessionCookieName, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
  })
}

const getSessionUser = async (request) => {
  const token = request.cookies[sessionCookieName]

  if (!token) {
    return null
  }

  const [sessions, users] = await Promise.all([readSessions(), readUsers()])
  const now = Date.now()
  const session = sessions.find(
    (currentSession) =>
      currentSession.token === token &&
      new Date(currentSession.expiresAt).getTime() > now,
  )

  if (!session) {
    return null
  }

  return users.find((user) => user.id === session.userId) ?? null
}

app.post('/api/auth/register', async (request, response, next) => {
  try {
    const username = normalizeUsername(String(request.body?.username ?? ''))
    const password = String(request.body?.password ?? '')
    const usernameError = validateUsername(username)
    const passwordError = validatePassword(password)

    if (usernameError || passwordError) {
      sendError(response, 400, usernameError || passwordError)
      return
    }

    const users = await readUsers()
    const usernameExists = users.some(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    )

    if (usernameExists) {
      sendError(response, 409, '该用户名已被注册。')
      return
    }

    const user = {
      createdAt: new Date().toISOString(),
      id: crypto.randomUUID(),
      passwordHash: await hashPassword(password),
      username,
    }

    users.push(user)
    await writeUsers(users)
    await createSession(user.id, response)
    response.status(201).json({ user: getPublicUser(user) })
  } catch (error) {
    next(error)
  }
})

app.post('/api/auth/login', async (request, response, next) => {
  try {
    const username = normalizeUsername(String(request.body?.username ?? ''))
    const password = String(request.body?.password ?? '')

    if (!username || !password) {
      sendError(response, 400, !username ? '请输入用户名。' : '请输入密码。')
      return
    }

    const users = await readUsers()
    const user = users.find(
      (currentUser) =>
        currentUser.username.toLowerCase() === username.toLowerCase(),
    )
    const passwordIsValid = user
      ? await verifyPassword(password, user.passwordHash)
      : false

    if (!user || !passwordIsValid) {
      sendError(response, 401, '用户名或密码错误。')
      return
    }

    await createSession(user.id, response)
    response.json({ user: getPublicUser(user) })
  } catch (error) {
    next(error)
  }
})

app.get('/api/auth/session', async (request, response, next) => {
  try {
    const user = await getSessionUser(request)

    if (!user) {
      response.json({ authenticated: false })
      return
    }

    response.json({ authenticated: true, user: getPublicUser(user) })
  } catch (error) {
    next(error)
  }
})

app.post('/api/auth/logout', async (request, response, next) => {
  try {
    const token = request.cookies[sessionCookieName]

    if (token) {
      const sessions = await readSessions()
      await writeSessions(
        sessions.filter((session) => session.token !== token),
      )
    }

    clearSessionCookie(response)
    response.json({ ok: true })
  } catch (error) {
    next(error)
  }
})

if (isProduction) {
  const distDir = path.join(rootDir, 'dist')

  if (existsSync(distDir)) {
    app.use(express.static(distDir))
    app.get(/.*/, (request, response) => {
      response.sendFile(path.join(distDir, 'index.html'))
    })
  }
}

app.use((error, request, response, _next) => {
  console.error(error)
  sendError(response, 500, '服务器暂时不可用。')
})

app.listen(port, host, () => {
  console.log(`KafuHomework auth server running on http://${host}:${port}`)
})
