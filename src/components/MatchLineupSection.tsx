import { useEffect, useMemo } from 'react'
import LineupManager from '@/components/LineupManager'
import { usePlayers, useMatchAttendance } from '@/hooks/useSupabaseData'
import { useMatchLineupManager } from '@/hooks/useMatchLineupManager'
import MatchBenchManager from '@/components/MatchBenchManager'

interface MatchLineupSectionProps {
  matchId: string
}

const MatchLineupSection = ({ matchId }: MatchLineupSectionProps) => {
  const { data: allPlayers = [] } = usePlayers()
  const { data: attendance = [] } = useMatchAttendance(matchId)
  const { loadLineup } = useMatchLineupManager(matchId)

  const presentPlayers = useMemo(() => {
    const presentIds = new Set(attendance.filter((a: any) => a.status === 'present').map((a: any) => a.player_id))
    return allPlayers.filter((p: any) => presentIds.has(p.id))
  }, [allPlayers, attendance])

  useEffect(() => { loadLineup() }, [matchId])

  return (
    <div>
      <LineupManager sessionId={matchId} presentPlayers={presentPlayers} onLineupChange={() => {}} mode="match" />
      <div className="mt-8 pt-8 border-t">
        <MatchBenchManager matchId={matchId} allPlayers={allPlayers} attendance={attendance} playersInLineup={[]} />
      </div>
    </div>
  )
}

export default MatchLineupSection