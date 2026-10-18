/** Messages between the app (main thread) and the Python Web Worker. */
export type ToWorker =
  { type: 'init'; indexURL: string } | { type: 'run'; id: number; code: string; stdin?: string[] }

export type FromWorker =
  | { type: 'ready' }
  | { type: 'init-error'; error: string }
  | { type: 'stdout'; id: number; text: string }
  | { type: 'stderr'; id: number; text: string }
  | { type: 'done'; id: number; ok: boolean; error?: string }
