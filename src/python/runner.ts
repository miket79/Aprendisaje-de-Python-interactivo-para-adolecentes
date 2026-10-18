import type { FromWorker, ToWorker } from './protocol'

export type PythonStatus = 'idle' | 'loading' | 'ready' | 'running' | 'error'

export interface RunResult {
  ok: boolean
  stdout: string
  stderr: string
  /** Python traceback (cleaned), when the code raised an error. */
  error?: string
  timedOut?: boolean
}

export interface RunOptions {
  stdin?: string[]
  timeoutMs?: number
  onStdout?: (text: string) => void
}

type Listener = (status: PythonStatus) => void

/** Absolute URL of the self-hosted Pyodide files (copied there by vite.config.ts). */
const PYODIDE_URL = () => new URL(`${import.meta.env.BASE_URL}pyodide/`, document.baseURI).href

/**
 * One shared Python runtime for the whole app. Loads Pyodide in a worker,
 * runs code with a time limit, and restarts the worker if the code hangs.
 */
class PythonRunner {
  private worker: Worker | null = null
  private ready: Promise<void> | null = null
  private nextId = 1
  private status: PythonStatus = 'idle'
  private listeners = new Set<Listener>()

  getStatus() {
    return this.status
  }

  subscribe(fn: Listener) {
    this.listeners.add(fn)
    return () => {
      this.listeners.delete(fn)
    }
  }

  private setStatus(status: PythonStatus) {
    this.status = status
    this.listeners.forEach((fn) => fn(status))
  }

  /** Start loading Python in the background (safe to call many times). */
  preload(): Promise<void> {
    if (this.ready) return this.ready
    this.setStatus('loading')
    const worker = new Worker(new URL('./pyodide.worker.ts', import.meta.url), { type: 'module' })
    this.worker = worker
    this.ready = new Promise<void>((resolve, reject) => {
      const cleanup = () => {
        worker.removeEventListener('message', onMessage)
        worker.removeEventListener('error', onError)
      }
      const failed = (message: string) => {
        cleanup()
        worker.terminate()
        if (this.worker === worker) this.worker = null
        this.ready = null
        this.setStatus('error')
        reject(new Error(message))
      }
      const onMessage = (e: MessageEvent<FromWorker>) => {
        if (e.data.type === 'ready') {
          cleanup()
          this.setStatus('ready')
          resolve()
        } else if (e.data.type === 'init-error') {
          failed(e.data.error)
        }
      }
      // The worker script itself couldn't load (e.g. offline before the app was cached).
      const onError = (e: ErrorEvent) => failed(e.message || 'Python worker failed to load')
      worker.addEventListener('message', onMessage)
      worker.addEventListener('error', onError)
      worker.postMessage({ type: 'init', indexURL: PYODIDE_URL() } satisfies ToWorker)
    })
    return this.ready
  }

  private restart() {
    this.worker?.terminate()
    this.worker = null
    this.ready = null
    void this.preload().catch(() => {})
  }

  async run(code: string, opts: RunOptions = {}): Promise<RunResult> {
    await this.preload()
    const worker = this.worker!
    const id = this.nextId++
    let stdout = ''
    let stderr = ''
    this.setStatus('running')

    return new Promise<RunResult>((resolve) => {
      const finish = (result: RunResult) => {
        clearTimeout(timer)
        worker.removeEventListener('message', onMessage)
        if (!result.timedOut) this.setStatus('ready')
        resolve(result)
      }
      const timer = setTimeout(() => {
        this.restart()
        finish({ ok: false, stdout, stderr, timedOut: true })
      }, opts.timeoutMs ?? 8000)

      const onMessage = (e: MessageEvent<FromWorker>) => {
        const msg = e.data
        if (!('id' in msg) || msg.id !== id) return
        if (msg.type === 'stdout') {
          stdout += msg.text + '\n'
          opts.onStdout?.(msg.text)
        } else if (msg.type === 'stderr') {
          stderr += msg.text + '\n'
        } else if (msg.type === 'done') {
          finish({
            ok: msg.ok,
            stdout,
            stderr,
            error: msg.error ? cleanTraceback(msg.error) : undefined,
          })
        }
      }
      worker.addEventListener('message', onMessage)
      worker.postMessage({ type: 'run', id, code, stdin: opts.stdin } satisfies ToWorker)
    })
  }
}

export const python = new PythonRunner()

/**
 * Pyodide tracebacks include frames from its own internals. Keep only the
 * header, the frames that point at the learner's code, and the final message.
 */
export function cleanTraceback(raw: string): string {
  const lines = raw.trimEnd().split('\n')
  const out: string[] = []
  let keepFrame = false
  for (const line of lines) {
    if (line.startsWith('Traceback')) {
      out.push(line)
    } else if (line.startsWith('  File ')) {
      keepFrame = line.includes('"<your code>"')
      if (keepFrame) out.push(line)
    } else if (line.startsWith('    ') || line.trim().startsWith('^')) {
      if (keepFrame) out.push(line)
    } else {
      keepFrame = false
      out.push(line)
    }
  }
  return out.join('\n')
}

/** The exception class name from the last line, e.g. "NameError". */
export function errorType(traceback: string): string | null {
  const last = traceback.trimEnd().split('\n').pop() ?? ''
  const match = /^([A-Za-z_][A-Za-z0-9_]*(?:Error|Exception|Interrupt|Exit))\b/.exec(last)
  return match ? match[1] : null
}
