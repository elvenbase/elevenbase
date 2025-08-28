import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Enhanced security headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'",
}

// Input validation helpers
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

const validateName = (name: string): boolean => {
  return typeof name === 'string' && name.trim().length > 0 && name.length <= 100;
}

const validateUuid = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Rate limiting (basic implementation)
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // requests per minute
const RATE_WINDOW = 60000; // 1 minute in milliseconds

const checkRateLimit = (ip: string): boolean => {
  const now = Date.now();
  const userRequests = requestCounts.get(ip);
  
  if (!userRequests || now > userRequests.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }
  
  if (userRequests.count >= RATE_LIMIT) {
    return false;
  }
  
  userRequests.count++;
  return true;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Rate limiting
  const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  if (!checkRateLimit(clientIP)) {
    return new Response(
      JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
      { 
        status: 429, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    console.log('=== PUBLIC REGISTRATION REQUEST START ===')
    console.log('Method:', req.method)
    console.log('URL:', req.url)
    console.log('Client IP:', clientIP)
    
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

      // Trova la sessione con questo token e carica i dati del team
      const { data: session, error: sessionError } = await supabase
        .from('training_sessions')
        .select(`
          *,
          teams (
            id,
            name,
            logo_url,
            primary_color,
            secondary_color
          )
        `)
        .eq('public_link_token', token)
        .single()

      if (sessionError || !session) {
        return new Response(JSON.stringify({ error: 'Token non valido' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Verifica se la sessione è stata chiusa manualmente
      if (session.is_closed) {
        return new Response(JSON.stringify({ error: 'La sessione di allenamento è stata chiusa' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Calcola se il tempo limite è scaduto (ma non bloccare l'accesso)
      const now = new Date()
      const deadline = session.allow_responses_until ? new Date(session.allow_responses_until) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      const isRegistrationExpired = now > deadline

      // Prendi tutti i giocatori attivi del team della sessione (esclusi gli ospiti)
      console.log('Fetching active players for team:', session.team_id)
      const { data: players, error: playersError } = await supabase
        .from('players')
        .select('id, first_name, last_name, jersey_number, avatar_url')
        .eq('status', 'active')
        .eq('team_id', session.team_id)
        .or('is_guest.is.null,is_guest.eq.false') // CRITICAL: Exclude guests (handle null values)
        .order('last_name')

      console.log('Players query result:', { players, error: playersError })
      if (playersError) {
        console.error('Players error:', playersError)
        throw playersError
      }

      // Prendi le registrazioni esistenti
      console.log('Fetching existing attendance for session:', session.id)
      const { data: existingAttendance, error: attendanceError } = await supabase
        .from('training_attendance')
        .select('player_id, status, self_registered')
        .eq('session_id', session.id)

      console.log('Attendance query result:', { existingAttendance, error: attendanceError })
      if (attendanceError) {
        console.error('Attendance error:', attendanceError)
        throw attendanceError
      }

      // Prendi i convocati per questa sessione
      console.log('Fetching convocati for session:', session.id)
      const { data: convocati, error: convocatiError } = await supabase
        .from('training_convocati')
        .select(`
          id,
          session_id,
          player_id,
          trialist_id,
          confirmed,
          notes,
          created_at,
          players (
            id,
            first_name,
            last_name,
            jersey_number,
            position,
            avatar_url
          ),
          trialists:trialist_id (
            id,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('session_id', session.id)

      console.log('Convocati query result:', { convocati, error: convocatiError, count: convocati?.length || 0 })
      if (convocatiError) {
        console.error('Convocati error:', convocatiError)
        // Non bloccare se i convocati falliscono, è solo visualizzazione
      }

      // Inviti provinanti
      const { data: trialistInvites, error: tiErr } = await supabase
        .from('training_trialist_invites')
        .select(`
          trialist_id,
          status,
          self_registered,
          trialists:trialist_id ( id, first_name, last_name, avatar_url )
        `)
        .eq('session_id', session.id)
      if (tiErr) console.warn('trialist invites fetch error', tiErr)

      return new Response(JSON.stringify({
        session,
        players,
        existingAttendance,
        convocati: convocati || [],
        trialistsInvited: (trialistInvites || []).map((t: any) => ({
          id: t.trialist_id,
          first_name: t.trialists?.first_name,
          last_name: t.trialists?.last_name,
          avatar_url: t.trialists?.avatar_url,
          status: t.status,
          self_registered: t.self_registered
        })),

        deadline: deadline.toISOString(),
        isRegistrationExpired
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
      
      const { playerId, trialistId, status } = requestBody

      // Input validation
      if (!token || (!playerId && !trialistId) || !status) {
        return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Validate token format
      if (typeof token !== 'string' || token.length < 10 || token.length > 64) {
        return new Response(JSON.stringify({ error: 'Invalid token format' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Validate IDs
      if (playerId && !validateUuid(playerId)) {
        return new Response(JSON.stringify({ error: 'Invalid player ID format' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      if (trialistId && !validateUuid(trialistId)) {
        return new Response(JSON.stringify({ error: 'Invalid trialist ID format' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Validate status
      if (!['present', 'absent', 'uncertain'].includes(status)) {
        return new Response(JSON.stringify({ error: 'Invalid status value' }), {
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

      // Verifica se la sessione è stata chiusa manualmente
      if (session.is_closed) {
        return new Response(JSON.stringify({ error: 'La sessione di allenamento è stata chiusa' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Verifica tempo limite
      const now = new Date()
      const deadline = session.allow_responses_until ? new Date(session.allow_responses_until) : null
      if (deadline && now > deadline) {
        return new Response(JSON.stringify({ error: 'Tempo scaduto per le registrazioni' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Inserisci o aggiorna la registrazione
      if (playerId) {
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

      if (trialistId) {
        const { error: upErr } = await supabase
          .from('training_trialist_invites')
          .upsert({ session_id: session.id, trialist_id: trialistId, status, self_registered: true }, { onConflict: 'session_id,trialist_id' })
        if (upErr) throw upErr
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
    }

    return new Response(JSON.stringify({ error: 'Metodo non supportato' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Errore in public-registration:', error)
    return new Response(JSON.stringify({ error: (error as any).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})