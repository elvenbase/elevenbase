import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { withRoleCode } from '@/utils/roleNormalization'

export interface CustomFormation {
  id: string
  name: string
  defenders: number
  midfielders: number
  forwards: number
  positions: Array<{
    id: string
    name: string
    x: number
    y: number
    role?: string
    roleShort?: string
    role_code?: string
  }>
  created_by?: string
  created_at: string
  updated_at: string
}

export const useCustomFormations = () => {
  const [formations, setFormations] = useState<CustomFormation[]>([])
  const [loading, setLoading] = useState(false)

  const loadFormations = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('custom_formations')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      const normalized = (data || []).map((f: any) => ({
        ...f,
        positions: Array.isArray(f.positions) ? f.positions.map((p: any) => withRoleCode(p)) : []
      }))
      setFormations(normalized as CustomFormation[])
    } catch (error) {
      console.error('Errore nel caricare le formazioni:', error)
      toast.error('Errore nel caricare le formazioni')
    } finally {
      setLoading(false)
    }
  }

  const createFormation = async (formation: Omit<CustomFormation, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    try {
      const payload = { ...formation, positions: formation.positions.map(p => withRoleCode(p)) }
      const { data, error } = await supabase
        .from('custom_formations')
        .insert(payload)
        .select()
        .single()

      if (error) throw error
      
      setFormations(prev => [({
        ...data,
        positions: Array.isArray((data as any).positions) ? (data as any).positions.map((p: any) => withRoleCode(p)) : []
      }) as CustomFormation, ...prev])
      toast.success('Formazione creata con successo')
      return data
    } catch (error) {
      console.error('Errore nella creazione della formazione:', error)
      toast.error('Errore nella creazione della formazione')
      throw error
    }
  }

  const updateFormation = async (id: string, formation: Partial<CustomFormation>) => {
    try {
      const payload = { ...formation }
      if (payload.positions) {
        payload.positions = payload.positions.map((p: any) => withRoleCode(p)) as any
      }
      const { data, error } = await supabase
        .from('custom_formations')
        .update(payload)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      
      setFormations(prev => prev.map(f => f.id === id ? ({
        ...data,
        positions: Array.isArray((data as any).positions) ? (data as any).positions.map((p: any) => withRoleCode(p)) : []
      }) as CustomFormation : f))
      toast.success('Formazione aggiornata con successo')
      return data
    } catch (error) {
      console.error('Errore nell\'aggiornamento della formazione:', error)
      toast.error('Errore nell\'aggiornamento della formazione')
      throw error
    }
  }

  const deleteFormation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('custom_formations')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      setFormations(prev => prev.filter(f => f.id !== id))
      toast.success('Formazione eliminata con successo')
    } catch (error) {
      console.error('Errore nell\'eliminazione della formazione:', error)
      toast.error('Errore nell\'eliminazione della formazione')
      throw error
    }
  }

  useEffect(() => {
    loadFormations()
  }, [])

  return {
    formations,
    loading,
    createFormation,
    updateFormation,
    deleteFormation,
    refetch: loadFormations
  }
}