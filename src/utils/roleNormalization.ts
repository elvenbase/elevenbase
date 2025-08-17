export type RoleCode =
  | 'P'
  | 'TD' | 'DC' | 'DCD' | 'DCS' | 'TS'
  | 'MED' | 'REG' | 'MC' | 'MD' | 'MS' | 'QD' | 'QS'
  | 'ATT' | 'PU' | 'AD' | 'AS'
  | 'ALTRI'

interface PositionLike {
  role_code?: string
  roleShort?: string
  role?: string
  name?: string
}

const textToCode = (text: string): RoleCode => {
  const r = text.trim().toLowerCase()
  if (!r) return 'ALTRI'
  // direct codes
  const direct = ['p','td','dc','dcd','dcs','ts','med','reg','mc','md','ms','qd','qs','att','pu','ad','as']
  if (direct.includes(r)) return r.toUpperCase() as RoleCode

  // goalkeeper
  if (r.includes('port') || r.includes('goal')) return 'P'

  // defense
  if (r.includes('terzino dest')) return 'TD'
  if (r.includes('terzino sin')) return 'TS'
  if (r.includes('centrale dest') || r.includes('dcd')) return 'DCD'
  if (r.includes('centrale sin') || r.includes('dcs')) return 'DCS'
  if (r.includes('difensore') || r.includes('centrale') || r === 'd') return 'DC'

  // midfield
  if (r === 'ed' || (r.includes('esterno') && r.includes('dx'))) return 'MC'
  if (r === 'es' || (r.includes('esterno') && r.includes('sx'))) return 'MC'
  if (r.includes('mediano') || r === 'med') return 'MED'
  if (r.includes('regista') || r === 'reg') return 'REG'
  if (r.includes('mezzala dx') || r === 'md') return 'MD'
  if (r.includes('mezzala sx') || r === 'ms') return 'MS'
  if (r.includes('mezzala') || r.includes('interno') || r === 'c') return 'MC'
  if (r.includes('quinto dx') || r.includes('rwb') || r === 'qd') return 'QD'
  if (r.includes('quinto sx') || r.includes('lwb') || r === 'qs') return 'QS'

  // attack
  if (r.includes('punta') || r === 'pu' || r.includes('centravanti')) return 'PU'
  if (r.includes('ala dx') || r === 'ad' || (r.includes('ala') && r.includes('dx'))) return 'AD'
  if (r.includes('ala sx') || r === 'as' || (r.includes('ala') && r.includes('sx'))) return 'AS'
  if (r.includes('attacc') || r === 'a' || r.includes('seconda punta') || r.includes('trequart')) return 'ATT'

  return 'ALTRI'
}

export const normalizeRoleCodeFrom = (pos: PositionLike): RoleCode => {
  if (pos.role_code && typeof pos.role_code === 'string') {
    return textToCode(pos.role_code)
  }
  if (pos.roleShort && typeof pos.roleShort === 'string') {
    const c = textToCode(pos.roleShort)
    if (c !== 'ALTRI') return c
  }
  if (pos.role && typeof pos.role === 'string') {
    const c = textToCode(pos.role)
    if (c !== 'ALTRI') return c
  }
  if (pos.name && typeof pos.name === 'string') {
    const c = textToCode(pos.name)
    if (c !== 'ALTRI') return c
  }
  return 'ALTRI'
}

export const withRoleCode = <T extends PositionLike>(pos: T): T & { role_code: RoleCode } => {
  const code = normalizeRoleCodeFrom(pos)
  return { ...pos, role_code: code }
}