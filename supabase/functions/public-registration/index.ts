import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('=== PUBLIC REGISTRATION REQUEST START ===')
    console.log('Method:', req.method)
    console.log('URL:', req.url)
    console.log('Headers:', Object.fromEntries(req.headers.entries()))
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url)
    let token = url.searchParams.get('token')
    let method = req.method
    let requestBody = null
    
    console.log('Initial token from query params:', token)
    
    // Gestisci le chiamate da supabase.functions.invoke che usano sempre POST
    if (req.method === 'POST') {
      try {
        const bodyText = await req.text()
        console.log('Request body text:', bodyText)
        
        if (bodyText && bodyText.trim()) {
          requestBody = JSON.parse(bodyText)
          console.log('Parsed request body:', requestBody)
          
          if (requestBody.method === 'GET') {
            method = 'GET'
            token = requestBody.token
            console.log('Converted to GET request, token:', token)
          } else {
            // È una vera richiesta POST
            token = requestBody.token || token
            console.log('POST request, token:', token)
          }
        }
      } catch (error) {
        console.error('Error parsing request body:', error)
        // Se non c'è un body JSON valido, prova con i query params
        if (!token) {
          const pathParts = url.pathname.split('/')
          token = pathParts[pathParts.length - 1]
          console.log('Token from path:', token)
        }
      }
    }
    
    console.log('Final method:', method, 'Final token:', token)
    
    if (method === 'GET') {
      if (!token) {
        return new Response(JSON.stringify({ error: 'Token mancante' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Trova la sessione con questo token
      const { data: session, error: sessionError } = await supabase
        .from('training_sessions')
        .select('*')
        .eq('public_link_token', token)
        .single()

      if (sessionError || !session) {
        return new Response(JSON.stringify({ error: 'Token non valido' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Verifica se il tempo limite è scaduto
      const now = new Date()
      const deadline = new Date(session.allow_responses_until)
      
      if (now > deadline) {
        return new Response(JSON.stringify({ error: 'Tempo scaduto per le registrazioni' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Prendi tutti i giocatori attivi
      const { data: players, error: playersError } = await supabase
        .from('players')
        .select('id, first_name, last_name, jersey_number')
        .eq('status', 'active')
        .order('last_name')

      if (playersError) {
        throw playersError
      }

      // Prendi le registrazioni esistenti
      const { data: existingAttendance, error: attendanceError } = await supabase
        .from('training_attendance')
        .select('player_id, status, self_registered')
        .eq('session_id', session.id)

      if (attendanceError) {
        throw attendanceError
      }

      return new Response(JSON.stringify({
        session,
        players,
        existingAttendance,
        deadline: deadline.toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (method === 'POST' || (req.method === 'POST' && method !== 'GET')) {
      if (!requestBody) {
        return new Response(JSON.stringify({ error: 'Body JSON non valido' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      
      const { playerId, status } = requestBody

      if (!token || !playerId || !status) {
        return new Response(JSON.stringify({ error: 'Parametri mancanti' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Trova la sessione
      const { data: session, error: sessionError } = await supabase
        .from('training_sessions')
        .select('*')
        .eq('public_link_token', token)
        .single()

      if (sessionError || !session) {
        return new Response(JSON.stringify({ error: 'Token non valido' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Verifica tempo limite
      const now = new Date()
      const deadline = new Date(session.allow_responses_until)
      
      if (now > deadline) {
        return new Response(JSON.stringify({ error: 'Tempo scaduto per le registrazioni' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Verifica se la sessione è chiusa
      if (session.is_closed) {
        return new Response(JSON.stringify({ error: 'Sessione già chiusa' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Inserisci o aggiorna la registrazione
      const { data, error } = await supabase
        .from('training_attendance')
        .upsert({
          session_id: session.id,
          player_id: playerId,
          status,
          self_registered: true,
          registration_time: new Date().toISOString()
        }, {
          onConflict: 'session_id,player_id'
        })
        .select()

      if (error) {
        throw error
      }

      console.log(`Player ${playerId} registered as ${status} for session ${session.id}`)

      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ error: 'Metodo non supportato' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Errore in public-registration:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})