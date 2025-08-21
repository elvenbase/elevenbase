import { useMemo, useState } from 'react'
import { useLeaders, usePlayers, useAttendanceScoreSettings } from '@/hooks/useSupabaseData'
import { computeAttendanceScore } from '@/lib/attendanceScore'

type PlayerRow = {
  id: string
  first_name: string
  last_name: string
  score: number
  mvp: number
  // Training
  t_pres: number
  t_abs: number
  t_late: number
  t_nr: number
  // Matches
  m_pres: number
  m_abs: number
  m_late: number
  m_nr: number
  // Totals
  tot_pres: number
  tot_abs: number
  tot_late: number
  tot_nr: number
  // Performance
  goals: number
  assists: number
  minutes: number
  yellow: number
  red: number
  saves: number
}

const safeCount = (obj: any): number => Number(obj?.value ?? obj?.count ?? 0)
const byId = (arr: any[] | undefined, pid: string) => (arr || []).find(r => r.player_id === pid)

export default function PlayersStatsTable() {
  const { data: players = [] } = usePlayers()

  const now = new Date()
  const [startDate, setStartDate] = useState<Date>(new Date(now.getFullYear(), now.getMonth(), 1))
  const [endDate, setEndDate] = useState<Date>(new Date(now.getFullYear(), now.getMonth() + 1, 0))
  const { data: leaders } = useLeaders({ startDate, endDate })
  const { data: scoreSettings } = useAttendanceScoreSettings()

  const [nameFilter, setNameFilter] = useState('')
  const [sortKey, setSortKey] = useState<keyof PlayerRow>('score')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const activePlayers = useMemo(() => players.filter((p: any) => p.status === 'active'), [players])

  const rows: PlayerRow[] = useMemo(() => {
    const mk = (pid: string, fn: string, ln: string): PlayerRow => {
      const tPres = safeCount(byId(leaders?.trainingPresences, pid))
      const tAbs = safeCount(byId(leaders?.trainingAbsences, pid))
      const tLate = safeCount(byId(leaders?.trainingLates, pid))
      const tNr = safeCount(byId(leaders?.trainingNoResponses, pid))

      const mPres = safeCount(byId(leaders?.matchPresences, pid)) || safeCount((byId(leaders?.matchPresences, pid)))
      const mAbs = safeCount(byId(leaders?.matchAbsences, pid))
      const mLate = safeCount(byId(leaders?.matchLates, pid))
      const mNr = safeCount(byId(leaders?.matchNoResponses, pid))

      const totPres = safeCount(byId(leaders?.totalPresences, pid)) || (tPres + mPres)
      const totAbs = safeCount(byId(leaders?.totalAbsences, pid)) || (tAbs + mAbs)
      const totLate = safeCount(byId(leaders?.lates, pid)) || (tLate + mLate)
      const totNr = safeCount(byId(leaders?.noResponses, pid)) || (tNr + mNr)

      const goals = safeCount(byId(leaders?.goals, pid))
      const assists = safeCount(byId(leaders?.assists, pid))
      const minutes = safeCount(byId(leaders?.minutes, pid))
      const yellow = safeCount(byId(leaders?.yellowCards, pid))
      const red = safeCount(byId(leaders?.redCards, pid))
      const saves = safeCount(byId(leaders?.saves, pid))
      const mvp = safeCount(byId(leaders?.mvpAwards, pid))

      const scoreData = computeAttendanceScore({
        T_P: tPres,
        T_L: tLate,
        T_A: tAbs,
        T_NR: tNr,
        M_P: mPres,
        M_L: mLate,
        M_A: mAbs,
        M_NR: mNr,
        mvpAwards: mvp,
      }, scoreSettings ? {
        trainingPresentOnTime: scoreSettings.training_present_on_time ?? 1.0,
        trainingPresentLate: scoreSettings.training_present_late ?? 0.6,
        trainingAbsent: scoreSettings.training_absent ?? -0.8,
        trainingNoResponse: scoreSettings.training_no_response ?? -1.0,
        matchPresentOnTime: scoreSettings.match_present_on_time ?? 2.5,
        matchPresentLate: scoreSettings.match_present_late ?? 1.5,
        matchAbsent: scoreSettings.match_absent ?? -2.0,
        matchNoResponse: scoreSettings.match_no_response ?? -2.5,
        mvpBonusOnce: scoreSettings.mvp_bonus_once ?? 5.0,
      } : undefined, scoreSettings?.min_events || 10)

      return {
        id: pid,
        first_name: fn,
        last_name: ln,
        score: (scoreSettings && (tPres + tAbs + tNr + mPres + mAbs + mNr) >= (scoreSettings.min_events || 10)) ? scoreData.score0to100 : 0,
        mvp,
        t_pres: tPres,
        t_abs: tAbs,
        t_late: tLate,
        t_nr: tNr,
        m_pres: mPres,
        m_abs: mAbs,
        m_late: mLate,
        m_nr: mNr,
        tot_pres: totPres,
        tot_abs: totAbs,
        tot_late: totLate,
        tot_nr: totNr,
        goals,
        assists,
        minutes,
        yellow,
        red,
        saves,
      }
    }

    const list = activePlayers.map((p: any) => mk(p.id, p.first_name || '', p.last_name || ''))
    const filtered = nameFilter.trim().length
      ? list.filter(r => `${r.first_name} ${r.last_name}`.toLowerCase().includes(nameFilter.toLowerCase()))
      : list

    const sorted = [...filtered].sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'asc' ? av - bv : bv - av
      }
      const as = String(av || '')
      const bs = String(bv || '')
      return sortDir === 'asc' ? as.localeCompare(bs) : bs.localeCompare(as)
    })
    return sorted
  }, [activePlayers, leaders, nameFilter, sortKey, sortDir, scoreSettings])

  const onHeaderClick = (key: keyof PlayerRow) => {
    if (sortKey === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('desc') }
  }

  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm">
          <label>Dal</label>
          <input type="date" className="h-8 rounded border px-2 bg-background" value={fmt(startDate)} onChange={(e)=>{ const v=e.target.value; if (v) setStartDate(new Date(v)) }} />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <label>Al</label>
          <input type="date" className="h-8 rounded border px-2 bg-background" value={fmt(endDate)} onChange={(e)=>{ const v=e.target.value; if (v) setEndDate(new Date(v)) }} />
        </div>
        <div className="ml-auto flex items-center gap-2 text-sm">
          <input placeholder="Filtra per nome..." value={nameFilter} onChange={(e)=>setNameFilter(e.target.value)} className="h-8 rounded border px-2 bg-background" />
        </div>
      </div>

      <div className="overflow-x-auto rounded border">
        <table className="min-w-[1200px] w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <Th label="Giocatore" onClick={()=>onHeaderClick('last_name')} />
              <Th label="Score" onClick={()=>onHeaderClick('score')} />
              <Th label="MVP" onClick={()=>onHeaderClick('mvp')} />
              <Th label="All. Pres." onClick={()=>onHeaderClick('t_pres')} />
              <Th label="All. Ass." onClick={()=>onHeaderClick('t_abs')} />
              <Th label="All. Rit." onClick={()=>onHeaderClick('t_late')} />
              <Th label="All. NoResp" onClick={()=>onHeaderClick('t_nr')} />
              <Th label="Part. Pres." onClick={()=>onHeaderClick('m_pres')} />
              <Th label="Part. Ass." onClick={()=>onHeaderClick('m_abs')} />
              <Th label="Part. Rit." onClick={()=>onHeaderClick('m_late')} />
              <Th label="Part. NoResp" onClick={()=>onHeaderClick('m_nr')} />
              <Th label="Tot. Pres." onClick={()=>onHeaderClick('tot_pres')} />
              <Th label="Tot. Ass." onClick={()=>onHeaderClick('tot_abs')} />
              <Th label="Tot. Rit." onClick={()=>onHeaderClick('tot_late')} />
              <Th label="Tot. NoResp" onClick={()=>onHeaderClick('tot_nr')} />
              <Th label="Gol" onClick={()=>onHeaderClick('goals')} />
              <Th label="Assist" onClick={()=>onHeaderClick('assists')} />
              <Th label="Minuti" onClick={()=>onHeaderClick('minutes')} />
              <Th label="Gialli" onClick={()=>onHeaderClick('yellow')} />
              <Th label="Rossi" onClick={()=>onHeaderClick('red')} />
              <Th label="Parate" onClick={()=>onHeaderClick('saves')} />
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-t hover:bg-muted/30">
                <td className="px-2 py-2 whitespace-nowrap font-medium">{r.last_name} {r.first_name}</td>
                <td className="px-2 py-2 text-center tabular-nums font-semibold">{r.score.toFixed(1)}</td>
                <td className="px-2 py-2 text-center tabular-nums">{r.mvp}</td>
                <td className="px-2 py-2 text-center tabular-nums">{r.t_pres}</td>
                <td className="px-2 py-2 text-center tabular-nums">{r.t_abs}</td>
                <td className="px-2 py-2 text-center tabular-nums">{r.t_late}</td>
                <td className="px-2 py-2 text-center tabular-nums">{r.t_nr}</td>
                <td className="px-2 py-2 text-center tabular-nums">{r.m_pres}</td>
                <td className="px-2 py-2 text-center tabular-nums">{r.m_abs}</td>
                <td className="px-2 py-2 text-center tabular-nums">{r.m_late}</td>
                <td className="px-2 py-2 text-center tabular-nums">{r.m_nr}</td>
                <td className="px-2 py-2 text-center tabular-nums font-semibold">{r.tot_pres}</td>
                <td className="px-2 py-2 text-center tabular-nums">{r.tot_abs}</td>
                <td className="px-2 py-2 text-center tabular-nums">{r.tot_late}</td>
                <td className="px-2 py-2 text-center tabular-nums">{r.tot_nr}</td>
                <td className="px-2 py-2 text-center tabular-nums">{r.goals}</td>
                <td className="px-2 py-2 text-center tabular-nums">{r.assists}</td>
                <td className="px-2 py-2 text-center tabular-nums">{r.minutes}</td>
                <td className="px-2 py-2 text-center tabular-nums">{r.yellow}</td>
                <td className="px-2 py-2 text-center tabular-nums">{r.red}</td>
                <td className="px-2 py-2 text-center tabular-nums">{r.saves}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={19} className="px-3 py-6 text-center text-muted-foreground">Nessun dato per il periodo selezionato</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Th({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <th className="px-2 py-2 text-left font-semibold whitespace-nowrap select-none cursor-pointer" onClick={onClick}>{label}</th>
  )
}

