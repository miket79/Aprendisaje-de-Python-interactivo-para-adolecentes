import { passesCheck } from '../lessons/checks'

describe('passesCheck', () => {
  it('requires a successful run with output', () => {
    expect(passesCheck({}, { code: '', stdout: '', ok: true })).toBe(false)
    expect(passesCheck({}, { code: 'x', stdout: 'hi\n', ok: false })).toBe(false)
    expect(passesCheck({}, { code: 'x', stdout: 'hi\n', ok: true })).toBe(true)
  })

  it('checks output, code, line count and unchanged output', () => {
    const check = {
      outputIncludes: ['720'],
      codeIncludes: ['*'],
      minLines: 3,
      outputNot: ['a\nb\n720'],
    }
    expect(
      passesCheck(check, { code: 'print(30 * 24)', stdout: 'Sam\nchess\n720\n', ok: true }),
    ).toBe(true)
    expect(passesCheck(check, { code: 'print(720)', stdout: 'Sam\nchess\n720\n', ok: true })).toBe(
      false,
    )
    expect(passesCheck(check, { code: 'print(30*24)', stdout: 'Sam\n720\n', ok: true })).toBe(false)
    expect(passesCheck(check, { code: 'x*', stdout: 'a\nb\n720\n', ok: true })).toBe(false)
  })
})
