export type AttendanceCounters = {
  T_P: number
  T_L: number
  T_A: number
  T_NR: number
  M_P: number
  M_L: number
  M_A: number
  M_NR: number
}

export type AttendanceWeights = {
  trainingPresentOnTime: number
  trainingPresentLate: number
  trainingAbsent: number
  trainingNoResponse: number
  matchPresentOnTime: number
  matchPresentLate: number
  matchAbsent: number
  matchNoResponse: number
}

export const SIMPLE_WEIGHTS: AttendanceWeights = {
  trainingPresentOnTime: 1.0,
  trainingPresentLate: 0.6,
  trainingAbsent: -0.8,
  trainingNoResponse: -1.0,
  matchPresentOnTime: 2.5,
  matchPresentLate: 1.5,
  matchAbsent: -2.0,
  matchNoResponse: -2.5,
}

export type ScoreOutput = AttendanceCounters & {
  pointsRaw: number
  opportunities: number
  score0to100: number
  noResponseRate: number
  matchPresenceRate: number
  matchLateRate: number
}

export function computeAttendanceScore(
  c: AttendanceCounters,
  weights: AttendanceWeights = SIMPLE_WEIGHTS,
  minEvents: number = 10,
): ScoreOutput {
  const T_onTime = Math.max(0, c.T_P - c.T_L)
  const M_onTime = Math.max(0, c.M_P - c.M_L)

  const T_total = c.T_P + c.T_A + c.T_NR
  const M_total = c.M_P + c.M_A + c.M_NR
  const opportunities = T_total + M_total

  const POINTS = (
    weights.trainingPresentOnTime * T_onTime +
    weights.trainingPresentLate * c.T_L +
    weights.trainingAbsent * c.T_A +
    weights.trainingNoResponse * c.T_NR +
    weights.matchPresentOnTime * M_onTime +
    weights.matchPresentLate * c.M_L +
    weights.matchAbsent * c.M_A +
    weights.matchNoResponse * c.M_NR
  )

  const MAX = (weights.trainingPresentOnTime * 1.0) * T_total + (weights.matchPresentOnTime * 1.5 / 1.5) * 2.5 / 2.5 * M_total
  // Above line ensures use of 1.0 and 2.5 explicitly; rewrite for clarity
  const MAX_clean = 1.0 * T_total + 2.5 * M_total
  const MIN_clean = -1.0 * T_total - 2.5 * M_total

  const range = MAX_clean - MIN_clean
  let score = 0
  if (range !== 0) {
    score = 100 * (POINTS - MIN_clean) / range
    if (!Number.isFinite(score)) score = 0
  }
  // Clip and round to 1 decimal
  const score0to100 = Math.max(0, Math.min(100, Math.round(score * 10) / 10))

  const denomEvents = Math.max(1, opportunities)
  const noResponseRate = (c.T_NR + c.M_NR) / denomEvents
  const matchDen = Math.max(1, c.M_P + c.M_A + c.M_NR)
  const matchPresenceRate = c.M_P / matchDen
  const matchLateRate = c.M_P > 0 ? c.M_L / c.M_P : 0

  return {
    ...c,
    pointsRaw: POINTS,
    opportunities,
    score0to100: opportunities === 0 ? 0 : score0to100,
    noResponseRate,
    matchPresenceRate,
    matchLateRate,
  }
}

export type PlayerScoreInput = {
  player_id: string
  first_name?: string
  last_name?: string
  counters: AttendanceCounters
}

export type PlayerScore = ScoreOutput & {
  player_id: string
  first_name?: string
  last_name?: string
  eligible: boolean
}

export function computeScoresForPlayers(
  items: PlayerScoreInput[],
  weights: AttendanceWeights = SIMPLE_WEIGHTS,
  minEvents: number = 10,
): PlayerScore[] {
  return items.map(it => {
    const s = computeAttendanceScore(it.counters, weights, minEvents)
    const eligible = s.opportunities >= minEvents
    return { player_id: it.player_id, first_name: it.first_name, last_name: it.last_name, eligible, ...s }
  })
}

export function tieBreakComparator(a: PlayerScore, b: PlayerScore): number {
  // Primary: score desc
  if (b.score0to100 !== a.score0to100) return b.score0to100 - a.score0to100
  // 1) minor noResponseRate
  if (a.noResponseRate !== b.noResponseRate) return a.noResponseRate - b.noResponseRate
  // 2) maggior matchPresenceRate
  if (b.matchPresenceRate !== a.matchPresenceRate) return b.matchPresenceRate - a.matchPresenceRate
  // 3) minor matchLateRate
  if (a.matchLateRate !== b.matchLateRate) return a.matchLateRate - b.matchLateRate
  // stable by name
  const an = `${a.last_name || ''} ${a.first_name || ''}`.trim().toLowerCase()
  const bn = `${b.last_name || ''} ${b.first_name || ''}`.trim().toLowerCase()
  return an.localeCompare(bn)
}

