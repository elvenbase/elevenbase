import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export interface FormationData {
  name: string
  defenders: number
  midfielders: number
  forwards: number
  positions: { x: number; y: number; role: string }[]
}

export interface MatchLineup {
  id: string
  match_id: string
  formation: string
  players_data: {
    positions: Record<string, string>
    formation_data?: FormationData
  }
  created_at: string
  updated_at: string
}

export const useMatchLineupManager = (matchId: string) => {
  const [lineup, setLineup] = useState<MatchLineup | null>(null)
  const [loading, setLoading] = useState(false)

  const loadLineup = useCallback(async () => {
    if (!matchId) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('match_lineups')
        .select('*')
        .eq('match_id', matchId)
        .maybeSingle()

      if (error) throw error

      if (data) {
        const typed: MatchLineup = {
          ...data,
          players_data: typeof data.players_data === 'string' ? JSON.parse(data.players_data) : (data.players_data as any) || { positions: {} }
        }
        setLineup(typed)
      } else {
        setLineup(null)
      }
    } catch (error) {
      console.error('Errore nel caricare la formazione match:', error)
      toast.error('Errore nel caricare la formazione match')
    } finally {
      setLoading(false)
    }
  }, [matchId])

  const saveLineup = async (formation: string, playersData: { positions: Record<string, string>; formation_data?: FormationData }) => {
    if (!matchId) return
    try {
      const lineupData = { formation, players_data: playersData, match_id: matchId }

      const { data: existing } = await supabase
        .from('match_lineups')
        .select('id')
        .eq('match_id', matchId)
        .single()

      let data, error
      if (existing) {
        const res = await supabase.from('match_lineups').update(lineupData).eq('match_id', matchId).select().single()
        data = res.data; error = res.error
      } else {
        const res = await supabase.from('match_lineups').insert(lineupData).select().single()
        data = res.data; error = res.error
      }
      if (error) throw error

      const typed: MatchLineup = {
        ...data,
        players_data: typeof data.players_data === 'string' ? JSON.parse(data.players_data) : (data.players_data as any) || { positions: {} }
      }
      setLineup(typed)
      toast.success('Formazione match salvata')
    } catch (error) {
      console.error('Errore nel salvataggio formazione match:', error)
      toast.error('Errore nel salvataggio della formazione match')
    }
  }

  const deleteLineup = async () => {
    if (!matchId) return
    try {
      const { error } = await supabase.from('match_lineups').delete().eq('match_id', matchId)
      if (error) throw error
      setLineup(null)
      toast.success('Formazione match eliminata')
    } catch (error) {
      console.error('Errore nell\'eliminare la formazione match:', error)
      toast.error('Errore nell\'eliminare la formazione match')
    }
  }

  return { lineup, loading, loadLineup, saveLineup, deleteLineup, reloadLineup: loadLineup }
}