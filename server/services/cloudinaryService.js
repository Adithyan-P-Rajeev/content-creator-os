const crypto = require('crypto')

function createCloudinaryService({ cloudName, apiKey, apiSecret }) {
  function signature(params) {
    const values = Object.entries(params).sort(([first], [second]) => first.localeCompare(second))
    const query = values.map(([key, value]) => `${key}=${value}`).join('&')
    return crypto.createHash('sha1').update(`${query}${apiSecret}`).digest('hex')
  }

  async function uploadImage(dataUrl, userId, itemId) {
    if (!cloudName || !apiKey || !apiSecret) throw new Error('Image uploads are not configured. Add Cloudinary credentials to the server environment.')
    const match = String(dataUrl).match(/^data:([^;]+);base64,(.+)$/)
    if (!match) throw new Error('Please choose a valid image file.')

    const bytes = Buffer.from(match[2], 'base64')
    if (bytes.length > 8 * 1024 * 1024) throw new Error('Images must be 8 MB or smaller.')

    const timestamp = Math.floor(Date.now() / 1000)
    const folder = `content-creator-os/${userId}/${itemId || 'research'}`
    const form = new FormData()
    form.append('file', new Blob([bytes], { type: match[1] }), 'research-image')
    form.append('api_key', apiKey)
    form.append('timestamp', String(timestamp))
    form.append('folder', folder)
    form.append('signature', signature({ folder, timestamp }))

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: form })
    const payload = await response.json()
    if (!response.ok) throw new Error(payload.error?.message || 'Cloudinary could not upload this image.')
    return { url: payload.secure_url, publicId: payload.public_id }
  }

  async function deleteImage(publicId) {
    if (!publicId || !cloudName || !apiKey || !apiSecret) return
    const timestamp = Math.floor(Date.now() / 1000)
    const form = new URLSearchParams({ public_id: publicId, timestamp: String(timestamp), api_key: apiKey, signature: signature({ public_id: publicId, timestamp }) })
    await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: form })
  }

  return { uploadImage, deleteImage }
}

module.exports = { createCloudinaryService }
