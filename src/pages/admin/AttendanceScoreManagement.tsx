import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export default function AttendanceScoreManagement() {
  const { toast } = useToast()
  const [weights, setWeights] = useState({
    trainingPresentOnTime: 1.0,
    trainingPresentLate: 0.6,
    trainingAbsent: -0.8,
    trainingNoResponse: -1.0,
    matchPresentOnTime: 2.5,
    matchPresentLate: 1.5,
    matchAbsent: -2.0,
    matchNoResponse: -2.5,
    minEvents: 10,
  })
  const [loading, setLoading] = useState(false)

  const load = async () => {
    const { data, error } = await supabase.from('attendance_score_settings').select('*').eq('is_active', true).limit(1)
    if (error) return
    const s = data && data[0]
    if (s) setWeights({
      trainingPresentOnTime: s.training_present_on_time,
      trainingPresentLate: s.training_present_late,
      trainingAbsent: s.training_absent,
      trainingNoResponse: s.training_no_response,
      matchPresentOnTime: s.match_present_on_time,
      matchPresentLate: s.match_present_late,
      matchAbsent: s.match_absent,
      matchNoResponse: s.match_no_response,
      minEvents: s.min_events,
    })
  }

  const save = async () => {
    setLoading(true)
    const { error } = await supabase.from('attendance_score_settings').insert({
      preset: 'simple',
      training_present_on_time: weights.trainingPresentOnTime,
      training_present_late: weights.trainingPresentLate,
      training_absent: weights.trainingAbsent,
      training_no_response: weights.trainingNoResponse,
      match_present_on_time: weights.matchPresentOnTime,
      match_present_late: weights.matchPresentLate,
      match_absent: weights.matchAbsent,
      match_no_response: weights.matchNoResponse,
      min_events: weights.minEvents,
      is_active: true,
    })
    setLoading(false)
    if (error) toast({ title: 'Errore', description: String(error.message), variant: 'destructive' })
    else toast({ title: 'Salvato', description: 'Impostazioni aggiornate' })
  }

  const runNow = async () => {
    setLoading(true)
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/attendance-scores`
      const res = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` } })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error || 'Errore')
      toast({ title: 'Eseguito', description: `Calcolati ${j.inserted} punteggi` })
    } catch (e: any) {
      toast({ title: 'Errore', description: String(e.message || e), variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-3 sm:px-6 py-4 sm:py-6 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Attendance Score</CardTitle>
          <CardDescription>Configura pesi e imposta un ricalcolo manuale</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(weights).map(([k,v]) => (
              <label key={k} className="text-sm space-y-1">
                <span className="block capitalize">{k.replace(/[A-Z]/g, m=>' '+m).trim()}</span>
                <Input type="number" step="0.1" value={v as any} onChange={(e)=>setWeights(w=>({ ...w, [k]: Number(e.target.value) }))} />
              </label>
            ))}
          </div>
          <div className="flex gap-2">
            <Button onClick={load} variant="outline">Carica</Button>
            <Button onClick={save} disabled={loading}>{loading?'Salvataggio...':'Salva'}</Button>
            <Button onClick={runNow} variant="secondary" disabled={loading}>{loading?'Esecuzione...':'Esegui ora'}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

