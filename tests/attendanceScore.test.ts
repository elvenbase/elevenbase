import { describe, it, expect } from 'vitest'
import { computeAttendanceScore, SIMPLE_WEIGHTS } from '@/lib/attendanceScore'

describe('computeAttendanceScore', () => {
  it('scores perfect attendance at 100', () => {
    const res = computeAttendanceScore({
      T_P: 10, T_L: 0, T_A: 0, T_NR: 0,
      M_P: 4, M_L: 0, M_A: 0, M_NR: 0,
    }, SIMPLE_WEIGHTS)
    expect(res.opportunities).toBe(14)
    expect(res.score0to100).toBe(100)
  })

  it('penalizes absences and no responses', () => {
    const res = computeAttendanceScore({
      T_P: 6, T_L: 2, T_A: 2, T_NR: 2,
      M_P: 1, M_L: 1, M_A: 1, M_NR: 1,
    }, SIMPLE_WEIGHTS)
    expect(res.opportunities).toBe(13)
    expect(res.score0to100).toBeGreaterThanOrEqual(0)
    expect(res.score0to100).toBeLessThan(100)
  })

  it('handles zero opportunities', () => {
    const res = computeAttendanceScore({
      T_P: 0, T_L: 0, T_A: 0, T_NR: 0,
      M_P: 0, M_L: 0, M_A: 0, M_NR: 0,
    }, SIMPLE_WEIGHTS)
    expect(res.opportunities).toBe(0)
    expect(res.score0to100).toBe(0)
  })

  it('applies MVP bonus once when mvpAwards > 0', () => {
    const base = computeAttendanceScore({
      T_P: 5, T_L: 0, T_A: 3, T_NR: 2,
      M_P: 2, M_L: 0, M_A: 1, M_NR: 1,
      mvpAwards: 0,
    }, SIMPLE_WEIGHTS)
    const withMvp = computeAttendanceScore({
      T_P: 5, T_L: 0, T_A: 3, T_NR: 2,
      M_P: 2, M_L: 0, M_A: 1, M_NR: 1,
      mvpAwards: 2,
    }, SIMPLE_WEIGHTS)
    expect(withMvp.pointsRaw).toBeGreaterThan(base.pointsRaw)
    expect(withMvp.score0to100).toBeGreaterThan(base.score0to100)
  })
})

