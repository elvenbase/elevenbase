import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Separator } from '@/components/ui/separator'
import { Info } from 'lucide-react'

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
    mvpBonusOnce: 5.0,
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
      mvpBonusOnce: s.mvp_bonus_once ?? 5.0,
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
      mvp_bonus_once: weights.mvpBonusOnce,
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
    <div className="container mx-auto px-3 sm:px-6 py-4 sm:py-6 max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/80 shadow-sm hover:shadow-glow transition-smooth">
          <CardHeader>
            <CardTitle>Gestione algoritmo di affidabilità</CardTitle>
            <CardDescription>Imposta i pesi degli eventi e avvia il ricalcolo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {([
                ['trainingPresentOnTime', 'Allenamenti — Presente puntuale'],
                ['trainingPresentLate', 'Allenamenti — Presente in ritardo'],
                ['trainingAbsent', 'Allenamenti — Assente'],
                ['trainingNoResponse', 'Allenamenti — No response'],
                ['matchPresentOnTime', 'Partite — Presente puntuale'],
                ['matchPresentLate', 'Partite — Presente in ritardo'],
                ['matchAbsent', 'Partite — Assente'],
                ['matchNoResponse', 'Partite — No response'],
                ['minEvents', 'Minimo eventi per entrare in classifica'],
                ['mvpBonusOnce', 'Bonus MVP (una sola volta)'],
              ] as const).map(([key, label]) => (
                <label key={key} className="text-sm space-y-1">
                  <span className="block font-medium text-foreground/90">{label}</span>
                  <Input
                    type="number"
                    step={key === 'minEvents' ? 1 : 0.1}
                    inputMode="decimal"
                    lang="it"
                    value={(weights as any)[key] as any}
                    onChange={(e)=>{
                      const raw = e.target.value.replace(',', '.')
                      const num = key === 'minEvents' ? parseInt(raw || '0', 10) : parseFloat(raw || '0')
                      setWeights(w => ({ ...(w as any), [key]: isNaN(num) ? 0 : num } as any))
                    }}
                  />
                </label>
              ))}
            </div>
            <Separator />
            <div className="flex flex-wrap gap-2">
              <Button onClick={load} variant="outline">Carica impostazioni</Button>
              <Button onClick={save} disabled={loading}>{loading?'Salvataggio...':'Salva impostazioni'}</Button>
              <Button onClick={runNow} variant="secondary" disabled={loading}>{loading?'Esecuzione...':'Esegui calcolo ora'}</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-primary" />
              <CardTitle>Algoritmo di affidabilità (scala 0–100)</CardTitle>
            </div>
            <CardDescription>Come viene calcolato lo score</CardDescription>
          </CardHeader>
          <CardContent className="prose prose-sm sm:prose-base max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-li:marker:text-muted-foreground">
            <article>
              <header>
                <h2>Algoritmo di affidabilità (scala 0–100)</h2>
                <p>
                  Il sistema assegna a ogni giocatore un punteggio di affidabilità su scala 0–100,
                  basato sul comportamento di partecipazione a allenamenti e partite. Ogni evento
                  genera punti positivi o negativi; i punti vengono poi normalizzati in funzione del
                  numero di opportunità avute (per evitare che chi ha pochi eventi risulti avvantaggiato).
                </p>
              </header>

              <section id="punteggi-per-evento">
                <h3>Punteggi per evento</h3>

                <h4>Allenamenti</h4>
                <ul>
                  <li>Presente puntuale: <strong>+1</strong></li>
                  <li>Presente in ritardo: <strong>+0,6</strong></li>
                  <li>Assente: <strong>&minus;0,8</strong></li>
                  <li>No response (assenza senza risposta): <strong>&minus;1</strong></li>
                </ul>

                <h4>Partite</h4>
                <ul>
                  <li>Presente puntuale: <strong>+2,5</strong></li>
                  <li>Presente in ritardo: <strong>+1,5</strong></li>
                  <li>Assente: <strong>&minus;2</strong></li>
                  <li>No response (assenza senza risposta): <strong>&minus;2,5</strong></li>
                </ul>
              </section>

              <section id="calcolo-e-normalizzazione">
                <h3>Calcolo e normalizzazione</h3>
                <ol>
                  <li>Si sommano i punti di tutti gli eventi del giocatore (allenamenti e partite).</li>
                  <li>
                    Il totale viene <strong>normalizzato su 0–100</strong> confrontandolo con il
                    <em> minimo teorico</em> (tutte no response) e il <em>massimo teorico</em>
                    (tutte presenze puntuali) per lo stesso numero di opportunità del giocatore; il punteggio
                    grezzo viene riportato in percentuale su tale intervallo e poi limitato tra 0 e 100.
                  </li>
                </ol>
              </section>

              <section id="eleggibilita-e-classifiche">
                <h3>Elegibilità e classifiche</h3>
                <ul>
                  <li>Entrano in classifica solo i giocatori con <strong>almeno 10 eventi totali</strong> (allenamenti + partite).</li>
                  <li>
                    In caso di parità, l’ordinamento applica nell’ordine:
                    <ol>
                      <li>minor <strong>tasso di no response</strong> complessivo,</li>
                      <li>maggiore <strong>percentuale di presenze alle partite</strong>,</li>
                      <li>minor <strong>tasso di ritardi alle partite</strong>.</li>
                    </ol>
                  </li>
                </ul>
              </section>

              <section id="definizioni-operative">
                <h3>Definizioni operative</h3>
                <ul>
                  <li>Il conteggio “ritardi” è un sottoinsieme delle presenze; una presenza può essere puntuale o in ritardo.</li>
                  <li>I contatori devono essere mantenuti <strong>separati</strong> per allenamenti e partite; gli aggregati “allenamenti + partite” sono solo informativi e non si usano nel calcolo.</li>
                </ul>
              </section>

              <section id="esito">
                <h3>Esito</h3>
                <ul>
                  <li><strong>Miglior giocatore</strong>: punteggio 0–100 più alto tra gli eleggibili.</li>
                  <li><strong>Peggior giocatore</strong>: punteggio 0–100 più basso tra gli eleggibili.</li>
                </ul>
              </section>
            </article>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

