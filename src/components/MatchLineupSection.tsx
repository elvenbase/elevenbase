import { useEffect, useMemo, useState } from 'react'
import LineupManager from '@/components/LineupManager'
import { usePlayers, useMatchAttendance, useMatchTrialistInvites } from '@/hooks/useSupabaseData'
import { useMatchLineupManager } from '@/hooks/useMatchLineupManager'
import MatchBenchManager from '@/components/MatchBenchManager'

interface MatchLineupSectionProps {
  matchId: string
}

const MatchLineupSection = ({ matchId }: MatchLineupSectionProps) => {
  const { data: allPlayers = [] } = usePlayers({ includeGuests: true })
  const { data: attendance = [] } = useMatchAttendance(matchId)
  const { data: trialistInvites = [] } = useMatchTrialistInvites(matchId)
  const { loadLineup } = useMatchLineupManager(matchId)
  const [playersInLineup, setPlayersInLineup] = useState<string[]>([])

  // Tesserati presenti
  const presentRosterPlayers = useMemo(() => {
    const presentIds = new Set(attendance.filter((a: any) => a.status === 'present').map((a: any) => a.player_id))
    return allPlayers.filter((p: any) => presentIds.has(p.id))
  }, [allPlayers, attendance])

  // Provinanti presenti
  const presentTrialists = useMemo(() => (trialistInvites as any[]).filter((t: any) => t.status === 'present'), [trialistInvites])
  const trialistsAsPlayersPresent = useMemo(() => presentTrialists.map((t: any) => ({
    id: t.trialist_id as string,
    first_name: (t.trialists?.first_name as string) || 'Trialist',
    last_name: (t.trialists?.last_name as string) || '',
    position: undefined,
    avatar_url: undefined,
    isTrialist: true as const
  })), [presentTrialists])

  // Lista finale per la formazione (tesserati + provinanti presenti)
  const presentPlayersForLineup = useMemo(() => ([...presentRosterPlayers, ...trialistsAsPlayersPresent]), [presentRosterPlayers, trialistsAsPlayersPresent])

  // Dati per la panchina: attendance include TUTTI i trialist con status reale; allPlayers include TUTTI i trialist invitati
  const attendanceForBench = useMemo(() => ([
    ...attendance,
    ...(trialistInvites as any[]).map((t: any) => ({ player_id: t.trialist_id as string, status: (t.status === 'uncertain' ? 'pending' : t.status) as any }))
  ]), [attendance, trialistInvites])
  const trialistsAsPlayersAll = useMemo(() => (trialistInvites as any[]).map((t: any) => ({
    id: t.trialist_id as string,
    first_name: (t.trialists?.first_name as string) || 'Trialist',
    last_name: (t.trialists?.last_name as string) || '',
    position: undefined,
    avatar_url: undefined,
    isTrialist: true as const
  })), [trialistInvites])
  const allPlayersForBench = useMemo(() => ([...allPlayers, ...trialistsAsPlayersAll]), [allPlayers, trialistsAsPlayersAll])

  useEffect(() => { loadLineup() }, [matchId])

  return (
    <div>
      <div className="mb-8">
        <MatchBenchManager matchId={matchId} allPlayers={allPlayersForBench} attendance={attendanceForBench} playersInLineup={playersInLineup} />
      </div>
      <div className="overflow-x-hidden">
        <LineupManager sessionId={matchId} presentPlayers={presentPlayersForLineup} onLineupChange={setPlayersInLineup} mode="match" />
      </div>
    </div>
  )
}

export default MatchLineupSection