import { cleanTraceback, errorType } from '../python/runner'

const RAW = `Traceback (most recent call last):
  File "/lib/python314.zip/_pyodide/_base.py", line 597, in eval_code_async
    await CodeRunner(
  File "/lib/python314.zip/_pyodide/_base.py", line 411, in run_async
    coroutine = eval(self.code, globals, locals)
  File "<your code>", line 2, in <module>
    print(nmae)
          ^^^^
NameError: name 'nmae' is not defined`

describe('Python error helpers', () => {
  it('hides Pyodide internals from the traceback', () => {
    const clean = cleanTraceback(RAW)
    expect(clean).not.toContain('_pyodide')
    expect(clean).toContain('File "<your code>", line 2')
    expect(clean).toContain('print(nmae)')
    expect(clean.split('\n').pop()).toBe("NameError: name 'nmae' is not defined")
  })

  it('finds the error type', () => {
    expect(errorType(RAW)).toBe('NameError')
    expect(errorType('ZeroDivisionError: division by zero')).toBe('ZeroDivisionError')
    expect(errorType('something odd')).toBeNull()
  })
})
