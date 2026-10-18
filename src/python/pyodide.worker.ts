/// <reference lib="webworker" />
// Runs learner code in a Web Worker so a slow or endless loop never freezes the page.
import { loadPyodide, type PyodideInterface } from 'pyodide'
import type { FromWorker, ToWorker } from './protocol'

const send = (msg: FromWorker) => (self as unknown as DedicatedWorkerGlobalScope).postMessage(msg)

const FILENAME = '<your code>'
let pyodide: Promise<PyodideInterface> | null = null

self.onmessage = async (event: MessageEvent<ToWorker>) => {
  const msg = event.data

  if (msg.type === 'init') {
    try {
      pyodide = loadPyodide({ indexURL: msg.indexURL })
      await pyodide
      send({ type: 'ready' })
    } catch (err) {
      send({ type: 'init-error', error: String(err) })
    }
    return
  }

  if (msg.type === 'run') {
    if (!pyodide) {
      send({ type: 'done', id: msg.id, ok: false, error: 'Python is not loaded yet.' })
      return
    }
    const py = await pyodide
    const { id } = msg
    py.setStdout({ batched: (text) => send({ type: 'stdout', id, text }) })
    py.setStderr({ batched: (text) => send({ type: 'stderr', id, text }) })

    // input() reads from the answers the lesson provides (interactive input comes later).
    const answers = [...(msg.stdin ?? [])]
    py.setStdin({ stdin: () => answers.shift(), isatty: false })

    // Register the source so tracebacks can show the learner's line (with ^^^ markers).
    const src = py.toPy({ name: FILENAME, code: msg.code })
    py.runPython(
      'import linecache\nlinecache.cache[name] = (len(code), None, code.splitlines(True), name)',
      { globals: src },
    )
    src.destroy()

    // A fresh namespace per run, so variables from an old run don't leak into a new one.
    const globals = py.toPy({ __name__: '__main__' })
    try {
      await py.runPythonAsync(msg.code, { globals, filename: FILENAME })
      send({ type: 'done', id, ok: true })
    } catch (err) {
      send({ type: 'done', id, ok: false, error: err instanceof Error ? err.message : String(err) })
    } finally {
      globals.destroy()
    }
  }
}
