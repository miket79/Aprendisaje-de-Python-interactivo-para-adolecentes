// Joins thin Mach-O executables into one universal (fat) binary, like Apple's `lipo -create`.
// Used only when `lipo` isn't available (e.g. building on Linux).
// Usage: node make-universal.mjs <output> <thin1> <thin2> ...
import { readFileSync, writeFileSync } from 'node:fs'

const [output, ...inputs] = process.argv.slice(2)
if (!output || inputs.length < 2) {
  console.error('Usage: node make-universal.mjs <output> <thin1> <thin2> ...')
  process.exit(1)
}

const CPU_TYPE_ARM64 = 0x0100000c
const slices = inputs.map((file) => {
  const data = readFileSync(file)
  if (data.readUInt32LE(0) !== 0xfeedfacf) throw new Error(`${file} is not a 64-bit Mach-O file`)
  const cputype = data.readInt32LE(4)
  // Same alignment as Apple's lipo: 16 KB pages on arm64, 4 KB on x86_64.
  const align = cputype === CPU_TYPE_ARM64 ? 14 : 12
  return { data, cputype, cpusubtype: data.readInt32LE(8) & 0x00ffffff, align }
})

const headerSize = 8 + 20 * slices.length
let offset = headerSize
for (const s of slices) {
  offset = Math.ceil(offset / 2 ** s.align) * 2 ** s.align
  s.offset = offset
  offset += s.data.length
}

const out = Buffer.alloc(offset)
out.writeUInt32BE(0xcafebabe, 0)
out.writeUInt32BE(slices.length, 4)
slices.forEach((s, i) => {
  const p = 8 + 20 * i
  out.writeInt32BE(s.cputype, p)
  out.writeInt32BE(s.cpusubtype, p + 4)
  out.writeUInt32BE(s.offset, p + 8)
  out.writeUInt32BE(s.data.length, p + 12)
  out.writeUInt32BE(s.align, p + 16)
  s.data.copy(out, s.offset)
})
writeFileSync(output, out, { mode: 0o755 })
console.log(
  `Universal binary: ${output} (${slices.length} architectures, ${(out.length / 1e6).toFixed(1)} MB)`,
)
