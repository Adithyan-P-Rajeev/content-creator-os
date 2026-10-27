const fs = require('fs')
const path = require('path')

function loadLocalEnv() {
  const envFile = path.join(__dirname, '..', '..', '.env')
  if (!fs.existsSync(envFile)) return

  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)=(.*)\s*$/)
    if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '')
  }
}

module.exports = { loadLocalEnv }
