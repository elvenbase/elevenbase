import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Copy, ExternalLink, Clock, Users, Edit3, Save, X } from 'lucide-react'
import { toast } from 'sonner'
import { useUpdateMatch } from '@/hooks/useSupabaseData'

interface MatchInfo {
  id: string
  opponent_name: string
  match_date: string
  match_time: string
  public_link_token?: string
  allow_responses_until?: string
  is_closed?: boolean
}

interface AttendanceStats {
  present: number
  absent: number
  noResponse: number
  totalPlayers: number
}

interface MatchPublicLinkSharingProps {
  match: MatchInfo
  attendanceStats: AttendanceStats
  onRefresh?: () => void
}

const MatchPublicLinkSharing = ({ match, attendanceStats, onRefresh }: MatchPublicLinkSharingProps) => {
  const [timeLeft, setTimeLeft] = useState<string>('')
  const [isExpired, setIsExpired] = useState(false)
  const [isEditingDeadline, setIsEditingDeadline] = useState(false)
  const [newDeadline, setNewDeadline] = useState('')
  const updateMatch = useUpdateMatch()

  const matchUrl = match.public_link_token ? `${window.location.origin}/m/${match.public_link_token}` : ''

  useEffect(() => {
    if (!match.allow_responses_until) return
    const timer = setInterval(() => {
      const now = new Date()
      const deadline = new Date(match.allow_responses_until!)
      const diff = deadline.getTime() - now.getTime()
      if (diff <= 0) { setTimeLeft('Tempo scaduto'); setIsExpired(true); return }
      setIsExpired(false)
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      setTimeLeft(`${hours}h ${minutes}m`)
    }, 1000)
    return () => clearInterval(timer)
  }, [match.allow_responses_until])

  const copyToClipboard = async () => {
    if (!matchUrl) return
    try { await navigator.clipboard.writeText(matchUrl); toast.success('Link copiato!') } catch { toast.error('Errore nel copiare il link') }
  }
  const openPublicLink = () => { if (matchUrl) window.open(matchUrl, '_blank') }

  const startEditingDeadline = () => {
    if (match.is_closed) { toast.error('Partita chiusa'); return }
    if (match.allow_responses_until) {
      const d = new Date(match.allow_responses_until)
      setNewDeadline(d.toISOString().slice(0, 16))
    } else {
      const start = new Date(match.match_date + 'T' + match.match_time)
      start.setHours(start.getHours() - 2)
      setNewDeadline(start.toISOString().slice(0, 16))
    }
    setIsEditingDeadline(true)
  }

  const saveDeadline = async () => {
    if (!newDeadline) { toast.error('Seleziona data/ora'); return }
    await updateMatch.mutateAsync({ id: match.id, data: { allow_responses_until: newDeadline } })
    toast.success('Scadenza aggiornata')
    setIsEditingDeadline(false)
    onRefresh?.()
  }

  if (!match.public_link_token) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Link Pubblico</CardTitle>
          <CardDescription>Link pubblico non disponibile per questa partita</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const responseRate = attendanceStats.totalPlayers > 0 ? Math.round(((attendanceStats.present + attendanceStats.absent) / attendanceStats.totalPlayers) * 100) : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><ExternalLink className="h-5 w-5" />Link Pubblico di Registrazione</CardTitle>
        <CardDescription>Condividi questo link per permettere ai giocatori di registrarsi alla partita</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">Scadenza registrazioni</span>
              {!match.is_closed && !isEditingDeadline && (
                <Button variant="ghost" size="sm" onClick={startEditingDeadline} className="h-6 w-6 p-0 ml-1"><Edit3 className="h-3 w-3" /></Button>
              )}
            </div>
            {isEditingDeadline ? (
              <div className="space-y-2">
                <Input type="datetime-local" value={newDeadline} onChange={(e) => setNewDeadline(e.target.value)} className="text-xs" />
                <div className="flex gap-1 justify-center">
                  <Button variant="outline" size="sm" onClick={saveDeadline} disabled={updateMatch.isPending} className="h-7 px-2"><Save className="h-3 w-3" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => setIsEditingDeadline(false)} className="h-7 px-2"><X className="h-3 w-3" /></Button>
                </div>
              </div>
            ) : (
              <Badge variant={isExpired ? 'destructive' : 'secondary'} className="text-sm">{timeLeft || 'Non impostato'}</Badge>
            )}
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2"><Users className="h-4 w-4" /><span className="text-sm font-medium">Tasso di risposta</span></div>
            <Badge variant="outline" className="text-sm">{responseRate}%</Badge>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Link di registrazione</label>
          <div className="flex gap-2">
            <Input value={matchUrl} readOnly className="font-mono text-sm" />
            <Button variant="outline" size="icon" onClick={copyToClipboard}><Copy className="h-4 w-4" /></Button>
            <Button variant="outline" size="icon" onClick={openPublicLink}><ExternalLink className="h-4 w-4" /></Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default MatchPublicLinkSharing