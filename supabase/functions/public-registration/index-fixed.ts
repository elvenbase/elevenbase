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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('=== PUBLIC REGISTRATION REQUEST START ===')
    console.log('Method:', req.method)
    console.log('URL:', req.url)
    
    // Check environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    console.log('Environment check:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      urlValue: supabaseUrl || 'MISSING'
    })
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing environment variables')
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    console.log('Supabase client created successfully')

    const url = new URL(req.url)
    let token = url.searchParams.get('token')
    let method = req.method
    let requestBody = null
    
    console.log('Initial token from query params:', token)
    
    // Handle POST requests with JSON body
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
            token = requestBody.token || token
            console.log('POST request, token:', token)
          }
        }
      } catch (error) {
        console.error('Error parsing request body:', error)
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
        console.error('No token provided')
        return new Response(JSON.stringify({ error: 'Token mancante' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      console.log('Starting database query for token:', token)
      
      try {
        // Find session with this token and load team data
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

        console.log('Session query result:', { 
          hasSession: !!session, 
          error: sessionError,
          sessionId: session?.id,
          teamId: session?.team_id
        })

        if (sessionError) {
          console.error('Session query error:', sessionError)
          return new Response(JSON.stringify({ error: 'Database error: ' + sessionError.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        if (!session) {
          console.error('No session found for token:', token)
          return new Response(JSON.stringify({ error: 'Token non valido' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Check if session is manually closed
        if (session.is_closed) {
          console.log('Session is closed')
          return new Response(JSON.stringify({ error: 'La sessione di allenamento è stata chiusa' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        console.log('Session found, fetching additional data...')

        // Calculate deadline
        const now = new Date()
        const deadline = session.allow_responses_until ? new Date(session.allow_responses_until) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        const isRegistrationExpired = now > deadline

        console.log('Deadline check:', {
          now: now.toISOString(),
          deadline: deadline.toISOString(),
          isExpired: isRegistrationExpired
        })

        // Fetch active players for the session team
        console.log('Fetching active players for team:', session.team_id)
        const { data: players, error: playersError } = await supabase
          .from('players')
          .select('id, first_name, last_name, jersey_number, avatar_url')
          .eq('status', 'active')
          .eq('team_id', session.team_id)
          .or('is_guest.is.null,is_guest.eq.false')
          .order('last_name')

        console.log('Players query result:', { 
          playersCount: players?.length || 0, 
          error: playersError 
        })

        if (playersError) {
          console.error('Players error:', playersError)
          // Don't fail completely, just log the error
        }

        // Fetch existing attendance
        console.log('Fetching existing attendance for session:', session.id)
        const { data: existingAttendance, error: attendanceError } = await supabase
          .from('training_attendance')
          .select('player_id, status, self_registered')
          .eq('session_id', session.id)

        console.log('Attendance query result:', { 
          attendanceCount: existingAttendance?.length || 0, 
          error: attendanceError 
        })

        if (attendanceError) {
          console.error('Attendance error:', attendanceError)
        }

        // Return successful response
        const response = {
          session,
          players: players || [],
          existingAttendance: existingAttendance || [],
          convocati: [], // Simplified for now
          trialistsInvited: [], // Simplified for now
          deadline: deadline.toISOString(),
          isRegistrationExpired
        }

        console.log('Returning successful response')
        return new Response(JSON.stringify(response), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      } catch (dbError) {
        console.error('Database operation failed:', dbError)
        return new Response(JSON.stringify({ error: 'Database error: ' + (dbError as any).message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    // Handle POST requests (registration)
    if (method === 'POST' || (req.method === 'POST' && method !== 'GET')) {
      // POST logic here (simplified for now)
      return new Response(JSON.stringify({ error: 'POST method not implemented in this version' }), {
        status: 501,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ error: 'Metodo non supportato' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Errore generale in public-registration:', error)
    return new Response(JSON.stringify({ 
      error: 'Server error: ' + (error as any).message,
      stack: (error as any).stack 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})