import { fireEvent, render, screen } from '@testing-library/react'
import { CodePlayground } from '../components/CodePlayground'
import type { RunResult } from '../python/runner'

// A plain function (not vi.fn) so a rejected run is only seen by the component,
// which is exactly what we want to test.
let runImpl: (code: string) => Promise<RunResult> = async () => ({
  ok: true,
  stdout: '',
  stderr: '',
})
vi.mock('../python/usePython', () => ({
  usePython: () => ({ status: 'ready', run: (code: string) => runImpl(code) }),
}))

describe('CodePlayground', () => {
  it('shows the output of a run', async () => {
    runImpl = async () => ({ ok: true, stdout: 'Hello\n', stderr: '' })
    const onResult = vi.fn()
    render(<CodePlayground initialCode={'print("Hello")'} onResult={onResult} />)
    fireEvent.click(screen.getByRole('button', { name: 'Run' }))
    expect(await screen.findByText('Hello')).toBeInTheDocument()
    expect(onResult).toHaveBeenCalledWith(
      expect.objectContaining({ ok: true, code: 'print("Hello")' }),
    )
  })

  it('explains the error in plain language', async () => {
    runImpl = async () => ({
      ok: false,
      stdout: '',
      stderr: '',
      error: "Traceback (most recent call last):\nNameError: name 'x' is not defined",
    })
    render(<CodePlayground initialCode="print(x)" />)
    fireEvent.click(screen.getByRole('button', { name: 'Run' }))
    expect(await screen.findByText(/You used a name Python doesn’t know yet/)).toBeInTheDocument()
  })

  it('tells the learner when Python cannot start, instead of failing silently', async () => {
    runImpl = () => Promise.reject(new Error('offline'))
    render(<CodePlayground initialCode="print(1)" />)
    fireEvent.click(screen.getByRole('button', { name: 'Run' }))
    expect(await screen.findByText(/Python couldn’t start/)).toBeInTheDocument()
  })
})
