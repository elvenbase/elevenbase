import { useEffect, useMemo, useState } from 'react'
import LineupManager from '@/components/LineupManager'
import { usePlayers, useMatchAttendance, useMatchTrialistInvites } from '@/hooks/useSupabaseData'
import { useMatchLineupManager } from '@/hooks/useMatchLineupManager'
import MatchBenchManager from '@/components/MatchBenchManager'

interface MatchLineupSectionProps {
  matchId: string
}

const MatchLineupSection = ({ matchId }: MatchLineupSectionProps) => {
  const { data: allPlayers = [] } = usePlayers()
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
  const trialistsAsPlayers = useMemo(() => presentTrialists.map((t: any) => ({
    id: t.trialist_id as string,
    first_name: (t.trialists?.first_name as string) || 'Trialist',
    last_name: (t.trialists?.last_name as string) || '',
    position: undefined,
    avatar_url: undefined,
    isTrialist: true as const
  })), [presentTrialists])

  // Lista finale per la formazione (tesserati + provinanti presenti)
  const presentPlayersForLineup = useMemo(() => ([...presentRosterPlayers, ...trialistsAsPlayers]), [presentRosterPlayers, trialistsAsPlayers])

  // Dati per la panchina: attendance + provinanti presenti, e lista completa giocatori + provinanti
  const attendanceForBench = useMemo(() => ([
    ...attendance,
    ...presentTrialists.map((t: any) => ({ player_id: t.trialist_id as string, status: 'present' as const }))
  ]), [attendance, presentTrialists])
  const allPlayersForBench = useMemo(() => ([...allPlayers, ...trialistsAsPlayers]), [allPlayers, trialistsAsPlayers])

  useEffect(() => { loadLineup() }, [matchId])

  return (
    <div>
      <LineupManager sessionId={matchId} presentPlayers={presentPlayersForLineup} onLineupChange={setPlayersInLineup} mode="match" />
      <div className="mt-8 pt-8 border-t">
        <MatchBenchManager matchId={matchId} allPlayers={allPlayersForBench} attendance={attendanceForBench} playersInLineup={playersInLineup} />
      </div>
    </div>
  )
}

export default MatchLineupSection