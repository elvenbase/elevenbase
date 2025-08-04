import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Enhanced security headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'",
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const now = new Date()
    console.log(`Automazione training eseguita alle: ${now.toISOString()}`)

    // 1. Trova sessioni il cui tempo limite per le risposte è scaduto
    const { data: expiredSessions, error: expiredError } = await supabase
      .from('training_sessions')
      .select('*')
      .lt('allow_responses_until', now.toISOString())
      .eq('is_closed', false)

    if (expiredError) {
      throw expiredError
    }

    console.log(`Trovate ${expiredSessions?.length || 0} sessioni scadute`)

    // 2. Per ogni sessione scaduta, marca come assenti i giocatori che non hanno risposto
    for (const session of expiredSessions || []) {
      // Prendi tutti i giocatori attivi
      const { data: allPlayers, error: playersError } = await supabase
        .from('players')
        .select('id')
        .eq('status', 'active')

      if (playersError) {
        console.error('Errore nel recuperare giocatori:', playersError)
        continue
      }

      // Prendi chi ha già risposto
      const { data: existingAttendance, error: attendanceError } = await supabase
        .from('training_attendance')
        .select('player_id')
        .eq('session_id', session.id)

      if (attendanceError) {
        console.error('Errore nel recuperare presenze esistenti:', attendanceError)
        continue
      }

      const respondedPlayerIds = new Set(existingAttendance?.map(a => a.player_id) || [])
      
      // Trova chi non ha risposto
      const nonRespondedPlayers = allPlayers?.filter(p => !respondedPlayerIds.has(p.id)) || []

      console.log(`Sessione ${session.id}: ${nonRespondedPlayers.length} giocatori non hanno risposto`)

      // Marca come assenti i giocatori che non hanno risposto
      if (nonRespondedPlayers.length > 0) {
        const absentRecords = nonRespondedPlayers.map(player => ({
          session_id: session.id,
          player_id: player.id,
          status: 'absent',
          self_registered: false,
          registration_time: now.toISOString(),
          notes: 'Marcato automaticamente come assente per mancata risposta'
        }))

        const { error: insertError } = await supabase
          .from('training_attendance')
          .insert(absentRecords)

        if (insertError) {
          console.error('Errore nell\'inserire assenze automatiche:', insertError)
        } else {
          console.log(`Marcati come assenti ${absentRecords.length} giocatori per la sessione ${session.id}`)
        }
      }
    }

    // 3. Pulizia token scaduti - rimuovi token per sessioni già concluse (più di 24 ore fa)
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    
    const { data: oldSessions, error: oldSessionsError } = await supabase
      .from('training_sessions')
      .select('id')
      .lt('session_date', yesterday.toISOString().split('T')[0])
      .not('public_link_token', 'is', null)

    if (!oldSessionsError && oldSessions && oldSessions.length > 0) {
      const { error: cleanupError } = await supabase
        .from('training_sessions')
        .update({ public_link_token: null })
        .in('id', oldSessions.map(s => s.id))

      if (cleanupError) {
        console.error('Errore nella pulizia token:', cleanupError)
      } else {
        console.log(`Puliti ${oldSessions.length} token scaduti`)
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      processedSessions: expiredSessions?.length || 0,
      message: 'Automazione completata con successo'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Errore nell\'automazione training:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})