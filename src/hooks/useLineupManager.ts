import { useState, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

interface FormationData {
  name: string
  positions: Array<{
    id: string
    name: string
    x: number
    y: number
    role: string
    roleShort: string
  }>
}

interface LineupData {
  formation: string
  players_data: {
    positions: Record<string, string>
    formation_data?: FormationData
  }
}

interface Lineup {
  id: string
  session_id: string
  formation: string
  players_data: LineupData['players_data']
  created_at: string
  updated_at: string
}

export const useLineupManager = (sessionId: string) => {
  const [lineup, setLineup] = useState<Lineup | null>(null)
  const [loading, setLoading] = useState(false)

  const loadLineup = useCallback(async () => {
    if (!sessionId) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('training_lineups')
        .select('*')
        .eq('session_id', sessionId)
        .maybeSingle()

      if (error) throw error
      
      setLineup(data)
    } catch (error) {
      console.error('Errore nel caricare la formazione:', error)
      toast.error('Errore nel caricare la formazione')
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  const createLineup = async (lineupData: LineupData) => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('training_lineups')
        .insert({
          session_id: sessionId,
          ...lineupData
        })
        .select()
        .single()

      if (error) throw error
      
      setLineup(data)
      return data
    } catch (error) {
      console.error('Errore nella creazione della formazione:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const updateLineup = async (lineupData: LineupData) => {
    if (!lineup) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('training_lineups')
        .update(lineupData)
        .eq('id', lineup.id)
        .select()
        .single()

      if (error) throw error
      
      setLineup(data)
      return data
    } catch (error) {
      console.error('Errore nell\'aggiornamento della formazione:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const deleteLineup = async () => {
    if (!lineup) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('training_lineups')
        .delete()
        .eq('id', lineup.id)

      if (error) throw error
      
      setLineup(null)
    } catch (error) {
      console.error('Errore nell\'eliminazione della formazione:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return {
    lineup,
    loading,
    loadLineup,
    createLineup,
    updateLineup,
    deleteLineup
  }
}