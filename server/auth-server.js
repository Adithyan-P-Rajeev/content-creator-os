const http = require('http')
const crypto = require('crypto')
const path = require('path')
const { loadLocalEnv } = require('./utils/env')
const { readJson, saveJson } = require('./utils/json')
loadLocalEnv()

const PORT = Number(process.env.AUTH_PORT || 3002)
const USERS_FILE = path.join(__dirname, 'users.json')
const SESSIONS_FILE = path.join(__dirname, 'sessions.json')
const SESSION_LENGTH_MS = 7 * 24 * 60 * 60 * 1000
const RESET_TOKEN_LENGTH = 32
const RESET_TOKEN_LENGTH_MS = 60 * 60 * 1000
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3002/auth/google/calendar/callback'

function saveList(file, data) {
  saveJson(file, data)
}

function readList(file) {
  return readJson(file, [])
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  return `${salt}:${crypto.scryptSync(password, salt, 64).toString('hex')}`
}

function passwordMatches(password, passwordHash) {
  const [salt, savedHash] = (passwordHash || '').split(':')
  if (!salt || !savedHash) return false
  const receivedHash = crypto.scryptSync(password, salt, 64).toString('hex')
  return crypto.timingSafeEqual(Buffer.from(savedHash, 'hex'), Buffer.from(receivedHash, 'hex'))
}

function tokenHash(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, journey: user.journey || '', calendarConnected: Boolean(user.googleCalendar?.refreshToken) }
}

function makeUserId(name, users) {
  const baseId = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'user'
  let userId = baseId
  let number = 2

  while (users.some(user => user.id === userId)) {
    userId = `${baseId}-${number}`
    number += 1
  }

  return userId
}

function send(req, res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': req.headers.origin || 'http://localhost:5173',
    'Vary': 'Origin',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
  })
  res.end(JSON.stringify(body))
}

function getBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    let tooLarge = false
    req.on('data', chunk => {
      if (tooLarge) return
      body += chunk
      if (body.length > 1024 * 1024) tooLarge = true
    })
    req.on('end', () => {
      if (tooLarge) return reject(new Error('Request data is too large.'))
      try { resolve(JSON.parse(body || '{}')) } catch { reject(new Error('Invalid request data.')) }
    })
    req.on('error', () => reject(new Error('Unable to read request data.')))
  })
}

function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex')
  const sessions = readList(SESSIONS_FILE).filter(session => new Date(session.expiresAt) > new Date())
  sessions.push({ id: crypto.randomUUID(), tokenHash: tokenHash(token), userId, createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + SESSION_LENGTH_MS).toISOString() })
  saveList(SESSIONS_FILE, sessions)
  return token
}

function getAuthenticatedUser(req) {
  const authorization = req.headers.authorization || ''
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : ''
  if (!token) return null
  const session = readList(SESSIONS_FILE).find(current => current.tokenHash === tokenHash(token) && new Date(current.expiresAt) > new Date())
  const user = session && readList(USERS_FILE).find(current => current.id === session.userId)
  return user ? { user, session } : null
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return send(req, res, 204, {})

  try {
    if (req.method === 'GET' && req.url === '/auth/me') {
      const authenticated = getAuthenticatedUser(req)
      if (!authenticated) return send(req, res, 401, { message: 'Your session has expired. Please sign in again.' })
      return send(req, res, 200, { user: publicUser(authenticated.user) })
    }

    if (req.method === 'POST' && req.url === '/auth/logout') {
      const authenticated = getAuthenticatedUser(req)
      if (authenticated) saveList(SESSIONS_FILE, readList(SESSIONS_FILE).filter(session => session.id !== authenticated.session.id))
      return send(req, res, 200, { message: 'Signed out successfully.' })
    }

    if (req.method === 'GET' && req.url === '/auth/google/calendar') {
      const authenticated = getAuthenticatedUser(req)
      if (!authenticated) return send(req, res, 401, { message: 'Please sign in before connecting Google Calendar.' })
      if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) return send(req, res, 503, { message: 'Google Calendar is not configured yet. Add Google credentials to the server environment.' })
      const state = crypto.randomBytes(24).toString('hex')
      const sessions = readList(SESSIONS_FILE).map(session => session.id === authenticated.session.id ? { ...session, googleCalendarState: state } : session)
      saveList(SESSIONS_FILE, sessions)
      const params = new URLSearchParams({ client_id: GOOGLE_CLIENT_ID, redirect_uri: GOOGLE_REDIRECT_URI, response_type: 'code', access_type: 'offline', prompt: 'consent', scope: 'https://www.googleapis.com/auth/calendar.events', state })
      return send(req, res, 200, { url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` })
    }

    if (req.method === 'GET' && req.url.startsWith('/auth/google/calendar/callback')) {
      const callbackUrl = new URL(req.url, `http://${req.headers.host}`)
      const code = callbackUrl.searchParams.get('code')
      const state = callbackUrl.searchParams.get('state')
      const sessions = readList(SESSIONS_FILE)
      const session = sessions.find(current => current.googleCalendarState === state && new Date(current.expiresAt) > new Date())
      if (!code || !session || !GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
        res.writeHead(400, { 'Content-Type': 'text/html' })
        return res.end('<p>Calendar connection failed. Return to Content Creator OS and try again.</p>')
      }
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ code, client_id: GOOGLE_CLIENT_ID, client_secret: GOOGLE_CLIENT_SECRET, redirect_uri: GOOGLE_REDIRECT_URI, grant_type: 'authorization_code' }) })
      const tokens = await tokenResponse.json()
      if (!tokenResponse.ok) throw new Error(tokens.error_description || 'Google did not authorize Calendar access.')
      const users = readList(USERS_FILE)
      const userIndex = users.findIndex(user => user.id === session.userId)
      if (userIndex === -1) throw new Error('Account no longer exists.')
      users[userIndex] = { ...users[userIndex], googleCalendar: { refreshToken: tokens.refresh_token || users[userIndex].googleCalendar?.refreshToken, accessToken: tokens.access_token, expiresAt: new Date(Date.now() + tokens.expires_in * 1000).toISOString() } }
      saveList(USERS_FILE, users)
      saveList(SESSIONS_FILE, sessions.map(current => { const { googleCalendarState, ...safeSession } = current; return safeSession }))
      res.writeHead(200, { 'Content-Type': 'text/html' })
      return res.end('<script>window.opener?.postMessage({ type: "google-calendar-connected" }, "*"); window.close()</script><p>Google Calendar connected. You can close this window and return to Content Creator OS.</p>')
    }

    const body = await getBody(req)
    const name = (body.name || '').trim()
    const email = (body.email || '').trim().toLowerCase()
    const password = body.password || ''
    const journey = (body.journey || '').trim()
    const users = readList(USERS_FILE)

    if (req.method === 'POST' && req.url === '/auth/google/calendar/disconnect') {
      const authenticated = getAuthenticatedUser(req)
      if (!authenticated) return send(req, res, 401, { message: 'Your session has expired. Please sign in again.' })
      const userIndex = users.findIndex(current => current.id === authenticated.user.id)
      const { googleCalendar, ...userWithoutCalendar } = users[userIndex]
      users[userIndex] = userWithoutCalendar
      saveList(USERS_FILE, users)
      return send(req, res, 200, { user: publicUser(users[userIndex]) })
    }

    if (req.method === 'PATCH' && req.url === '/auth/profile') {
      const authenticated = getAuthenticatedUser(req)
      if (!authenticated) return send(req, res, 401, { message: 'Your session has expired. Please sign in again.' })
      if (!journey || journey.length > 80) return send(req, res, 400, { message: 'Choose a valid creator focus.' })
      const userIndex = users.findIndex(current => current.id === authenticated.user.id)
      users[userIndex] = { ...users[userIndex], journey }
      saveList(USERS_FILE, users)
      return send(req, res, 200, { user: publicUser(users[userIndex]) })
    }

    if (req.method === 'POST' && req.url === '/auth/register') {
      if (!name || !isValidEmail(email) || password.length < 6 || !journey) return send(req, res, 400, { message: 'Name, content journey, valid email, and a password of at least 6 characters are required.' })
      if (users.some(user => user.email === email)) return send(req, res, 409, { message: 'An account already exists for this email.' })
      const user = { id: makeUserId(name, users), name, email, journey, passwordHash: hashPassword(password), createdAt: new Date().toISOString() }
      users.push(user)
      saveList(USERS_FILE, users)
      return send(req, res, 201, { user: publicUser(user), token: createSession(user.id) })
    }

    if (req.method === 'POST' && req.url === '/auth/login') {
      const user = users.find(current => current.email === email)
      if (!user || !passwordMatches(password, user.passwordHash)) return send(req, res, 401, { message: 'Incorrect email or password.' })
      return send(req, res, 200, { user: publicUser(user), token: createSession(user.id) })
    }

    if (req.method === 'POST' && req.url === '/auth/forgot-password') {
      if (!isValidEmail(email)) return send(req, res, 400, { message: 'Please enter a valid email address.' })
      const userIndex = users.findIndex(current => current.email === email)
      if (userIndex === -1) return send(req, res, 200, { message: 'If an account exists for this email, a password reset link will be sent.' })

      const resetToken = crypto.randomBytes(RESET_TOKEN_LENGTH).toString('hex')
      users[userIndex] = {
        ...users[userIndex],
        resetTokenHash: tokenHash(resetToken),
        resetExpiresAt: new Date(Date.now() + RESET_TOKEN_LENGTH_MS).toISOString(),
      }
      saveList(USERS_FILE, users)

      // An email provider should deliver this token in production. Keeping it in the
      // response is deliberately limited to local development so the flow is testable.
      const localReset = process.env.NODE_ENV !== 'production'
      return send(req, res, 200, {
        message: localReset
          ? 'A password-reset link has been created. In this local build, use the code below to continue.'
          : 'If an account exists for this email, a password reset link will be sent.',
        ...(localReset ? { resetToken } : {}),
      })
    }

    if (req.method === 'POST' && req.url === '/auth/reset-password') {
      const resetToken = body.resetToken || ''
      if (password.length < 6) return send(req, res, 400, { message: 'Your new password must be at least 6 characters.' })
      const userIndex = users.findIndex(current => current.resetTokenHash === tokenHash(resetToken) && new Date(current.resetExpiresAt) > new Date())
      if (userIndex === -1) return send(req, res, 400, { message: 'This reset link is invalid or has expired. Request a new one.' })

      const updatedUser = { ...users[userIndex], passwordHash: hashPassword(password) }
      delete updatedUser.resetTokenHash
      delete updatedUser.resetExpiresAt
      users[userIndex] = updatedUser
      saveList(USERS_FILE, users)
      // Password changes revoke every existing login session.
      saveList(SESSIONS_FILE, readList(SESSIONS_FILE).filter(session => session.userId !== updatedUser.id))
      return send(req, res, 200, { message: 'Password reset successfully. You can now sign in.' })
    }

    return send(req, res, 404, { message: 'Route not found.' })
  } catch (error) {
    return send(req, res, 400, { message: error.message || 'Unable to process the request.' })
  }
})

server.listen(PORT, () => console.log(`Authentication server running at http://localhost:${PORT}`))
