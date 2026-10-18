// Copies the built app (dist/) into web/ for embedding in the launcher.
// Files that compress well are stored gzipped (name.gz) to keep the executable small.
// Usage: node pack-web.mjs <distDir> <webDir>
import { mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { gzipSync } from 'node:zlib'

const [distDir, webDir] = process.argv.slice(2)
if (!distDir || !webDir) {
  console.error('Usage: node pack-web.mjs <distDir> <webDir>')
  process.exit(1)
}

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    return statSync(full).isDirectory() ? walk(full) : [full]
  })

rmSync(webDir, { recursive: true, force: true })
let raw = 0
let packed = 0
for (const file of walk(distDir)) {
  const rel = relative(distDir, file)
  if (rel === 'audio/manifest.json') continue // only used by the voice-over tool
  const data = readFileSync(file)
  const gz = gzipSync(data, { level: 9 })
  const useGzip = gz.length < data.length * 0.9
  const out = join(webDir, useGzip ? `${rel}.gz` : rel)
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, useGzip ? gz : data)
  raw += data.length
  packed += useGzip ? gz.length : data.length
}
writeFileSync(join(webDir, '.gitkeep'), '')
console.log(
  `Packed ${(raw / 1e6).toFixed(1)} MB of app files into ${(packed / 1e6).toFixed(1)} MB.`,
)
