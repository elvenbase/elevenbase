import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

const validateUuid = (uuid: string): boolean => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid)

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')
    const url = new URL(req.url)
    let token = url.searchParams.get('token')
    let method = req.method
    let body: any = null

    if (req.method === 'POST') {
      const raw = await req.text()
      if (raw && raw.trim()) {
        body = JSON.parse(raw)
        if (body.method === 'GET') { method = 'GET'; token = body.token }
        else { token = body.token || token }
      }
    }

    if (method === 'GET') {
      if (!token) return new Response(JSON.stringify({ error: 'Token mancante' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

      const { data: match, error: matchError } = await supabase.from('matches').select('*').eq('public_link_token', token).single()
      if (matchError || !match) return new Response(JSON.stringify({ error: 'Token non valido' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      if ((match as any).is_closed) return new Response(JSON.stringify({ error: 'La partita è stata chiusa' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

      const now = new Date()
      const deadline = match.allow_responses_until ? new Date(match.allow_responses_until) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)

      const { data: players, error: playersError } = await supabase
        .from('players')
        .select('id, first_name, last_name, jersey_number, position, avatar_url')
        .eq('status', 'active')
        .order('last_name')
      if (playersError) throw playersError

      const { data: existingAttendance, error: attendanceError } = await supabase
        .from('match_attendance')
        .select('player_id, status, self_registered')
        .eq('match_id', match.id)
      if (attendanceError) throw attendanceError

      const { data: lineupRow } = await supabase
        .from('match_lineups')
        .select('formation, players_data')
        .eq('match_id', match.id)
        .maybeSingle()

      const { data: bench, error: benchError } = await supabase
        .from('match_bench')
        .select(`
          id, match_id, player_id, notes,
          players (
            id, first_name, last_name, jersey_number, position, avatar_url
          )
        `)
        .eq('match_id', match.id)
      if (benchError) {
        // don't fail if bench is missing
        console.warn('bench fetch error', benchError)
      }

      // Invited trialists
      const { data: trialistInvites, error: tiErr } = await supabase
        .from('match_trialist_invites')
        .select(`
          trialist_id,
          trialists:trialist_id ( id, first_name, last_name )
        `)
        .eq('match_id', match.id)
      if (tiErr) console.warn('trialist invites fetch error', tiErr)

      return new Response(JSON.stringify({
        match,
        players,
        existingAttendance,
        lineup: lineupRow ? { formation: (lineupRow as any).formation, players_data: (lineupRow as any).players_data } : null,
        bench: bench || [],
        trialistsInvited: (trialistInvites || []).map((t: any) => ({
          id: t.trialist_id,
          first_name: t.trialists?.first_name,
          last_name: t.trialists?.last_name
        })),

        deadline: deadline.toISOString(),
        isRegistrationExpired: now > deadline
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (method === 'POST' || (req.method === 'POST' && method !== 'GET')) {
      if (!body) return new Response(JSON.stringify({ error: 'Body JSON non valido' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      const { playerId, trialistId, status } = body
      if (!token || (!playerId && !trialistId) || !status) return new Response(JSON.stringify({ error: 'Missing required parameters' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      if (playerId && !validateUuid(playerId)) return new Response(JSON.stringify({ error: 'Invalid player ID format' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      if (trialistId && !validateUuid(trialistId)) return new Response(JSON.stringify({ error: 'Invalid trialist ID format' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      if (!['present', 'absent', 'uncertain'].includes(status)) return new Response(JSON.stringify({ error: 'Invalid status value' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

      const { data: match, error: matchError } = await supabase.from('matches').select('*').eq('public_link_token', token).single()
      if (matchError || !match) return new Response(JSON.stringify({ error: 'Token non valido' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      if ((match as any).is_closed) return new Response(JSON.stringify({ error: 'La partita è stata chiusa' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

      const now = new Date()
      const deadline = match.allow_responses_until ? new Date(match.allow_responses_until) : null
      if (deadline && now > deadline) return new Response(JSON.stringify({ error: 'Tempo scaduto per le registrazioni' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

      if (playerId) {
        const { data, error } = await supabase
          .from('match_attendance')
          .upsert({ match_id: match.id, player_id: playerId, status, self_registered: true }, { onConflict: 'match_id,player_id' })
          .select()
        if (error) throw error
        return new Response(JSON.stringify({ success: true, data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      if (trialistId) {
        // Ensure invite exists, then set status/self_registered
        const { error: upErr } = await supabase
          .from('match_trialist_invites')
          .upsert({ match_id: match.id, trialist_id: trialistId, status, self_registered: true }, { onConflict: 'match_id,trialist_id' })
        if (upErr) throw upErr
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
    }

    return new Response(JSON.stringify({ error: 'Metodo non supportato' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error) {
    console.error('Errore in public-match-registration:', error)
    // @ts-ignore
    return new Response(JSON.stringify({ error: error.message || 'Errore server' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})