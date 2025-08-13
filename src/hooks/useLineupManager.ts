
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

export interface Lineup {
  id: string
  session_id: string
  formation: string
  players_data: {
    positions: Record<string, string>
    formation_data?: FormationData
  }
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
        .single()

      if (error && error.code !== 'PGRST116') throw error

      if (data) {
        // Type assertion per gestire il tipo Json che arriva dal database
        const typedLineup: Lineup = {
          ...data,
          players_data: typeof data.players_data === 'string' 
            ? JSON.parse(data.players_data)
            : (data.players_data as any) || { positions: {} }
        }
        setLineup(typedLineup)
      }
    } catch (error) {
      console.error('Errore nel caricare la formazione:', error)
      toast.error('Errore nel caricare la formazione')
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  const saveLineup = async (formation: string, playersData: { positions: Record<string, string>; formation_data?: FormationData }) => {
    if (!sessionId) return

    try {
      const user = (await supabase.auth.getUser()).data.user
      const lineupData = {
        formation,
        players_data: playersData,
        session_id: sessionId,
        created_by: user?.id || null
      }

      // Usa upsert per semplificare inserimento/aggiornamento
      const { data, error } = await supabase
        .from('training_lineups')
        .upsert(lineupData as any, { onConflict: 'session_id' })
        .select()
        .single()

      if (error) throw error

      const typedLineup: Lineup = {
        ...data,
        players_data: typeof data.players_data === 'string' 
          ? JSON.parse(data.players_data)
          : (data.players_data as any) || { positions: {} }
      }
      setLineup(typedLineup)
      toast.success('Formazione salvata con successo')
    } catch (error) {
      console.error('Errore nel salvare la formazione:', error)
      toast.error('Errore nel salvare la formazione')
    }
  }

  const deleteLineup = async () => {
    if (!sessionId) return

    try {
      const { error } = await supabase
        .from('training_lineups')
        .delete()
        .eq('session_id', sessionId)

      if (error) throw error

      setLineup(null)
      toast.success('Formazione eliminata con successo')
    } catch (error) {
      console.error('Errore nell\'eliminare la formazione:', error)
      toast.error('Errore nell\'eliminare la formazione')
    }
  }

  return {
    lineup,
    loading,
    loadLineup,
    saveLineup,
    deleteLineup,
    reloadLineup: loadLineup
  }
}
