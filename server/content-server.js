const http = require('http')
const crypto = require('crypto')
const path = require('path')
const { loadLocalEnv } = require('./utils/env')
const { readJson, saveJson } = require('./utils/json')
const { createCloudinaryService } = require('./services/cloudinaryService')
loadLocalEnv()

const PORT = Number(process.env.CONTENT_PORT || 3001)
const DB_FILE = path.join(__dirname, 'db.json')
const SESSIONS_FILE = path.join(__dirname, 'sessions.json')
const USERS_FILE = path.join(__dirname, 'users.json')
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const cloudinary = createCloudinaryService({ cloudName: CLOUDINARY_CLOUD_NAME, apiKey: CLOUDINARY_API_KEY, apiSecret: CLOUDINARY_API_SECRET })

function saveDb(data) {
  saveJson(DB_FILE, data)
}

function tokenHash(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

function getAuthenticatedUser(req) {
  const authorization = req.headers.authorization || ''
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : ''
  if (!token) return null

  const sessions = readJson(SESSIONS_FILE, [])
  const session = sessions.find(current => current.tokenHash === tokenHash(token) && new Date(current.expiresAt) > new Date())
  if (!session) return null

  return readJson(USERS_FILE, []).find(user => user.id === session.userId) || null
}

function send(req, res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': req.headers.origin || 'http://localhost:5173',
    'Vary': 'Origin',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
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
      if (body.length > 12 * 1024 * 1024) {
        tooLarge = true
      }
    })
    req.on('end', () => {
      if (tooLarge) return reject(new Error('Request data is too large.'))
      try { resolve(JSON.parse(body || '{}')) } catch { reject(new Error('Invalid request data.')) }
    })
    req.on('error', () => reject(new Error('Unable to read request data.')))
  })
}

function getItemId(url) {
  const match = url.match(/^\/items\/([^/?]+)$/)
  return match ? decodeURIComponent(match[1]) : null
}

async function getGoogleAccessToken(user) {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !user.googleCalendar?.refreshToken) throw new Error('Connect Google Calendar in your profile before syncing.')
  if (user.googleCalendar.accessToken && new Date(user.googleCalendar.expiresAt) > new Date(Date.now() + 60000)) return user.googleCalendar.accessToken
  const response = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: GOOGLE_CLIENT_ID, client_secret: GOOGLE_CLIENT_SECRET, refresh_token: user.googleCalendar.refreshToken, grant_type: 'refresh_token' }) })
  const payload = await response.json()
  if (!response.ok) throw new Error(payload.error_description || 'Google Calendar connection expired. Reconnect it in your profile.')
  const users = readJson(USERS_FILE, [])
  const userIndex = users.findIndex(current => current.id === user.id)
  users[userIndex] = { ...users[userIndex], googleCalendar: { ...users[userIndex].googleCalendar, accessToken: payload.access_token, expiresAt: new Date(Date.now() + payload.expires_in * 1000).toISOString() } }
  saveJson(USERS_FILE, users)
  return payload.access_token
}

function makeItemId(title, items) {
  const baseId = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'idea'
  let itemId = baseId
  let number = 2

  while (items.some(item => item.id === itemId)) {
    itemId = `${baseId}-${number}`
    number += 1
  }

  return itemId
}

function getItemUpdates(body) {
  const allowedFields = ['title', 'stage', 'research', 'recordings', 'images', 'startDate', 'dueDate', 'publishDate', 'priority', 'tags', 'assignee', 'platform', 'platformDetails']
  const updates = {}

  for (const field of allowedFields) {
    if (Object.hasOwn(body, field)) updates[field] = body[field]
  }

  if (Object.hasOwn(updates, 'title')) {
    if (typeof updates.title !== 'string' || !updates.title.trim()) throw new Error('A title is required.')
    updates.title = updates.title.trim()
  }
  if (Object.hasOwn(updates, 'recordings') && !Array.isArray(updates.recordings)) throw new Error('Recordings must be a list.')
  if (Object.hasOwn(updates, 'images') && !Array.isArray(updates.images)) throw new Error('Images must be a list.')
  if (Object.hasOwn(updates, 'tags') && !Array.isArray(updates.tags)) throw new Error('Tags must be a list.')

  return updates
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return send(req, res, 204, {})

  const user = getAuthenticatedUser(req)
  if (!user) return send(req, res, 401, { message: 'Please sign in to access content.' })

  try {
    const db = readJson(DB_FILE, { items: [] })
    const items = Array.isArray(db.items) ? db.items : []
    const itemId = getItemId(req.url)

    if (req.method === 'POST' && req.url === '/media/upload') {
      const body = await getBody(req)
      return send(req, res, 201, await cloudinary.uploadImage(body.dataUrl, user.id, body.itemId))
    }

    if (req.method === 'DELETE' && req.url.startsWith('/media/')) {
      const publicId = decodeURIComponent(req.url.slice('/media/'.length))
      if (!publicId.startsWith(`content-creator-os/${user.id}/`)) return send(req, res, 403, { message: 'You cannot delete this image.' })
      await cloudinary.deleteImage(publicId)
      return send(req, res, 204, {})
    }

    if (req.method === 'GET' && req.url === '/items') {
      return send(req, res, 200, items.filter(item => item.userId === user.id))
    }

    if (req.method === 'POST' && req.url === '/items') {
      const body = await getBody(req)
      if (!(body.title || '').trim()) return send(req, res, 400, { message: 'A title is required.' })
      const item = {
        id: makeItemId(body.title.trim(), items),
        title: body.title.trim(),
        stage: body.stage || 'Idea',
        research: body.research || '',
        recordings: Array.isArray(body.recordings) ? body.recordings : [],
        images: Array.isArray(body.images) ? body.images : [],
        startDate: body.startDate || '',
        dueDate: body.dueDate || '',
        publishDate: body.publishDate || '',
        priority: body.priority || 'Medium',
        tags: Array.isArray(body.tags) ? body.tags : [],
        assignee: typeof body.assignee === 'string' ? body.assignee.trim() : '',
        platform: typeof body.platform === 'string' ? body.platform.trim() : '',
        platformDetails: typeof body.platformDetails === 'string' ? body.platformDetails.trim() : '',
        userId: user.id,
      }
      db.items = [...items, item]
      saveDb(db)
      return send(req, res, 201, item)
    }

    const itemIndex = items.findIndex(item => item.id === itemId && item.userId === user.id)
    if (itemId && itemIndex === -1) return send(req, res, 404, { message: 'Item not found.' })

    if (req.method === 'PATCH' && itemId) {
      const body = await getBody(req)
      const safeUpdates = getItemUpdates(body)
      const updatedItem = { ...items[itemIndex], ...safeUpdates, id: items[itemIndex].id, userId: user.id }
      db.items = items.map((item, index) => index === itemIndex ? updatedItem : item)
      saveDb(db)
      return send(req, res, 200, updatedItem)
    }

    if (req.method === 'DELETE' && itemId) {
      db.items = items.filter((_, index) => index !== itemIndex)
      saveDb(db)
      return send(req, res, 204, {})
    }

    if (req.method === 'POST' && /^\/items\/[^/]+\/sync-calendar$/.test(req.url)) {
      const syncItemId = decodeURIComponent(req.url.match(/^\/items\/([^/]+)\/sync-calendar$/)?.[1] || '')
      const syncIndex = items.findIndex(item => item.id === syncItemId && item.userId === user.id)
      if (syncIndex === -1) return send(req, res, 404, { message: 'Item not found.' })
      const item = items[syncIndex]
      const eventDate = item.publishDate || item.dueDate
      if (!eventDate) return send(req, res, 400, { message: 'Add a publish date or due date before syncing to Calendar.' })
      const accessToken = await getGoogleAccessToken(user)
      const event = { summary: `${item.publishDate ? 'Publish' : 'Deadline'}: ${item.title}`, description: [`Stage: ${item.stage}`, item.platform && `Platform: ${item.platform}`, item.priority && `Priority: ${item.priority}`, item.research].filter(Boolean).join('\n'), start: { date: eventDate }, end: { date: eventDate } }
      const existingId = item.calendarEventId
      const calendarResponse = await fetch(existingId ? `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(existingId)}` : 'https://www.googleapis.com/calendar/v3/calendars/primary/events', { method: existingId ? 'PUT' : 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify(event) })
      const calendarEvent = await calendarResponse.json()
      if (!calendarResponse.ok) throw new Error(calendarEvent.error?.message || 'Google Calendar could not save this event.')
      const updatedItem = { ...item, calendarEventId: calendarEvent.id, calendarEventUrl: calendarEvent.htmlLink }
      db.items = items.map((current, index) => index === syncIndex ? updatedItem : current)
      saveDb(db)
      return send(req, res, 200, updatedItem)
    }

    return send(req, res, 404, { message: 'Route not found.' })
  } catch (error) {
    return send(req, res, 400, { message: error.message || 'Unable to process the request.' })
  }
})

server.listen(PORT, () => console.log(`Content server running at http://localhost:${PORT}`))
