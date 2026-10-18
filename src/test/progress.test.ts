import { nextStreak } from '../store/progress'

describe('nextStreak', () => {
  it('starts, continues and resets streaks', () => {
    expect(nextStreak(null, '2026-10-18', 0)).toBe(1)
    expect(nextStreak('2026-10-18', '2026-10-18', 3)).toBe(3)
    expect(nextStreak('2026-10-17', '2026-10-18', 3)).toBe(4)
    expect(nextStreak('2026-10-15', '2026-10-18', 3)).toBe(1)
  })

  it('handles month and daylight-saving boundaries', () => {
    expect(nextStreak('2026-10-31', '2026-11-01', 5)).toBe(6)
    expect(nextStreak('2026-11-01', '2026-11-02', 6)).toBe(7)
  })
})
