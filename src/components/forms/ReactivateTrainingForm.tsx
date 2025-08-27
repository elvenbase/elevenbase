import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { RotateCcw } from 'lucide-react'
import { format, addDays } from 'date-fns'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface TrainingSession {
  id: string
  title: string
  description?: string
  session_date: string
  start_time: string
  end_time: string
  location?: string
  max_participants?: number
}

interface ReactivateTrainingFormProps {
  session: TrainingSession
}

export const ReactivateTrainingForm = ({ session }: ReactivateTrainingFormProps) => {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState(session.title)
  const [description, setDescription] = useState(session.description || '')
  const [sessionDate, setSessionDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'))
  const [startTime, setStartTime] = useState(session.start_time)
  const [endTime, setEndTime] = useState(session.end_time)
  const [copyConvocati, setCopyConvocati] = useState(true)
  const [copyTrialInvites, setCopyTrialInvites] = useState(true)

  const queryClient = useQueryClient()
  const { toast } = useToast()

  const reactivate = useMutation({
    mutationFn: async () => {
      // 1) Archive original (ensure closed) - archived_at temporarily disabled due to schema
      const { error: updErr } = await supabase
        .from('training_sessions')
        .update({ is_closed: true })
        .eq('id', session.id)
      if (updErr) throw updErr

      // 2) Create new session (reopened)
      let public_link_token = ''
      try {
        const bytes = new Uint8Array(16)
        // @ts-ignore
        if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(bytes)
        else bytes.forEach((_, i) => (bytes[i] = Math.floor(Math.random() * 256)))
        public_link_token = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
      } catch {
        public_link_token = Math.random().toString(36).slice(2) + Date.now().toString(36)
      }

      // Get current team ID
      const currentTeamId = localStorage.getItem('currentTeamId');

      const { data: newSession, error: insErr } = await supabase
        .from('training_sessions')
        .insert([
          {
            title,
            description,
            session_date: sessionDate,
            start_time: startTime,
            end_time: endTime,
            location: session.location || null,
            max_participants: session.max_participants || null,
            is_closed: false,
            allow_responses_until: null,
            public_link_token,
            team_id: currentTeamId, // CRITICAL: Include team_id for visibility
            created_by: (await supabase.auth.getUser()).data.user?.id,
          },
        ])
        .select()
        .single()
      if (insErr) throw insErr

      // 3) Optionally copy convocati rows
      if (copyConvocati) {
        const { data: convRows, error: convErr } = await supabase
          .from('training_convocati')
          .select('player_id, trialist_id')
          .eq('session_id', session.id)
        if (convErr) throw convErr
        if (Array.isArray(convRows) && convRows.length > 0) {
          const rows = convRows.map((r: any) => ({ session_id: newSession.id, player_id: r.player_id || null, trialist_id: r.trialist_id || null }))
          const { error: convInsErr } = await supabase.from('training_convocati').insert(rows)
          if (convInsErr) throw convInsErr
        }
      }

      // 4) Optionally copy trialist invites
      if (copyTrialInvites) {
        const { data: tiRows, error: tiErr } = await supabase
          .from('training_trialist_invites')
          .select('trialist_id, status')
          .eq('session_id', session.id)
        if (tiErr) throw tiErr
        if (Array.isArray(tiRows) && tiRows.length > 0) {
          const rows = tiRows.map((r: any) => ({ session_id: newSession.id, trialist_id: r.trialist_id, status: r.status || 'pending' }))
          const { error: tiInsErr } = await supabase.from('training_trialist_invites').insert(rows)
          if (tiInsErr) throw tiInsErr
        }
      }

      return newSession
    },
    onSuccess: (newSession) => {
      queryClient.invalidateQueries({ queryKey: ['training-sessions'] })
      toast({ title: 'Sessione riattivata come nuova', description: 'Iscrizioni riaperte e link pubblico abilitato.' })
      setOpen(false)
    },
    onError: (err: any) => {
      toast({ title: 'Errore durante la riattivazione', description: err?.message, variant: 'destructive' })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    reactivate.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-start">
          <RotateCcw className="mr-2 h-4 w-4" />
          Riattiva come nuova
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Riattiva come nuova</DialogTitle>
          <DialogDescription>
            Archivia l'originale e crea una nuova sessione con data e orario aggiornati.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titolo</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrizione</Label>
            <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sessionDate">Data</Label>
            <Input id="sessionDate" type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Ora inizio</Label>
              <Input id="startTime" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">Ora fine</Label>
              <Input id="endTime" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center space-x-2">
              <Checkbox id="copyConvocati" checked={copyConvocati} onCheckedChange={(v) => setCopyConvocati(!!v)} />
              <Label htmlFor="copyConvocati">Copia convocati</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="copyTrialInvites" checked={copyTrialInvites} onCheckedChange={(v) => setCopyTrialInvites(!!v)} />
              <Label htmlFor="copyTrialInvites">Copia inviti provini</Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={reactivate.isPending}>
              {reactivate.isPending ? 'Riattivando...' : 'Riattiva'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}