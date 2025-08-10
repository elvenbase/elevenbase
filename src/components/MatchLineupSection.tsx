import { useEffect, useMemo, useState } from 'react'
import LineupManager from '@/components/LineupManager'
import { usePlayers, useMatchAttendance } from '@/hooks/useSupabaseData'
import { useMatchLineupManager } from '@/hooks/useMatchLineupManager'

interface MatchLineupSectionProps {
  matchId: string
}

const MatchLineupSection = ({ matchId }: MatchLineupSectionProps) => {
  const { data: allPlayers = [] } = usePlayers()
  const { data: attendance = [] } = useMatchAttendance(matchId)
  const { lineup, loadLineup, saveLineup } = useMatchLineupManager(matchId)

  const presentPlayers = useMemo(() => {
    const presentIds = new Set(attendance.filter((a: any) => a.status === 'present').map((a: any) => a.player_id))
    return allPlayers.filter((p: any) => presentIds.has(p.id))
  }, [allPlayers, attendance])

  const handleChange = (playersInLineup: string[]) => {
    // no-op; LineupManager already autosaves via hook usage
  }

  useEffect(() => {
    loadLineup()
  }, [matchId])

  return (
    <LineupManager sessionId={matchId} presentPlayers={presentPlayers} onLineupChange={handleChange} />
  )
}

export default MatchLineupSection