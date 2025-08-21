// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, content-type',
  }
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Only POST' }), { status: 405, headers: { 'content-type': 'application/json', ...corsHeaders } })
  }
  try {
    const url = new URL(req.url)
    const dateParam = url.searchParams.get('date')
    const scoreDate = dateParam || new Date().toISOString().slice(0, 10)

    // Supabase client (Edge)
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
    const reqAuth = req.headers.get('Authorization') || ''
    // Prefer service role on server; otherwise propagate caller JWT to satisfy RLS
    const supabase = SUPABASE_SERVICE_ROLE_KEY
      ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
      : createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: reqAuth } } })

    // Load players
    const { data: players, error: playersErr } = await supabase.from('players').select('id, first_name, last_name, status')
    if (playersErr) throw new Error(`players: ${playersErr.message}`)

    // Load settings (first active)
    const { data: settings } = await supabase.from('attendance_score_settings').select('*').eq('is_active', true).order('created_at', { ascending: false })
    const ws = settings && settings[0]
    const weights = {
      trainingPresentOnTime: ws?.training_present_on_time ?? 1.0,
      trainingPresentLate: ws?.training_present_late ?? 0.6,
      trainingAbsent: ws?.training_absent ?? -0.8,
      trainingNoResponse: ws?.training_no_response ?? -1.0,
      matchPresentOnTime: ws?.match_present_on_time ?? 2.5,
      matchPresentLate: ws?.match_present_late ?? 1.5,
      matchAbsent: ws?.match_absent ?? -2.0,
      matchNoResponse: ws?.match_no_response ?? -2.5,
      mvpBonusOnce: ws?.mvp_bonus_once ?? 5.0,
    }
    const minEvents = ws?.min_events ?? 10

    // Get attendance within same month of scoreDate
    const d = new Date(scoreDate)
    const start = new Date(d.getFullYear(), d.getMonth(), 1)
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0)
    const pad = (n: number) => String(n).padStart(2, '0')
    const fmt = (x: Date) => `${x.getFullYear()}-${pad(x.getMonth()+1)}-${pad(x.getDate())}`
    const startStr = fmt(start)
    const endStr = fmt(end)

    // Training
    let trSel: any = supabase.from('training_attendance').select('player_id, status, coach_confirmation_status, arrival_time, training_sessions!inner(session_date)')
    trSel = trSel.gte('training_sessions.session_date', startStr).lte('training_sessions.session_date', endStr)
    const trRes = await trSel
    if (trRes.error) throw new Error(`training_attendance: ${trRes.error.message}`)
    const training = (trRes.data || []) as any[]
    let tcSel: any = supabase.from('training_convocati').select('player_id, training_sessions!inner(session_date)')
    tcSel = tcSel.gte('training_sessions.session_date', startStr).lte('training_sessions.session_date', endStr)
    const tcRes = await tcSel
    if (tcRes.error) throw new Error(`training_convocati: ${tcRes.error.message}`)
    const trainingConv = (tcRes.data || []) as any[]

    // Matches (ended)
    let mtSel: any = supabase.from('match_attendance').select('player_id, status, coach_confirmation_status, arrival_time, matches!inner(match_date, live_state)').eq('matches.live_state', 'ended')
    mtSel = mtSel.gte('matches.match_date', startStr).lte('matches.match_date', endStr)
    const mtRes = await mtSel
    if (mtRes.error) throw new Error(`match_attendance: ${mtRes.error.message}`)
    const matchAtt = (mtRes.data || []) as any[]

    // Aggregate counters per player
    type C = { T_P:number; T_L:number; T_A:number; T_NR:number; M_P:number; M_L:number; M_A:number; M_NR:number; mvpAwards:number }
    const map = new Map<string, C>()
    const ensure = (id: string) => { let x = map.get(id); if (!x) { x = { T_P:0, T_L:0, T_A:0, T_NR:0, M_P:0, M_L:0, M_A:0, M_NR:0, mvpAwards:0 }; map.set(id, x) } return x }
    const tTotals = new Map<string, number>()
    for (const r of trainingConv) { if (r.player_id) tTotals.set(r.player_id, (tTotals.get(r.player_id) || 0) + 1) }
    for (const r of training) {
      const pid = r.player_id; if (!pid) continue
      const c = ensure(pid)
      const coach = r.coach_confirmation_status
      const auto = r.status
      const present = (coach === 'present' || coach === 'late') || (auto === 'present' || auto === 'late')
      if (present) c.T_P += 1
      const isLate = (coach === 'late') || (auto === 'late') || (present && !!r.arrival_time)
      if (isLate) c.T_L += 1
      if (auto === 'no_response') c.T_NR += 1
      if (auto === 'absent') c.T_A += 1
    }
    for (const r of matchAtt) {
      const pid = r.player_id; if (!pid) continue
      const c = ensure(pid)
      const coach = r.coach_confirmation_status
      const auto = r.status
      const present = (coach === 'present') || (auto === 'present')
      if (present) c.M_P += 1
      const isLate = present && !!r.arrival_time
      if (isLate) c.M_L += 1
      if (auto === 'no_response') c.M_NR += 1
      if (auto === 'absent') c.M_A += 1
    }

    // MVP awards within period
    let mSel: any = supabase
      .from('matches')
      .select('id, mvp_player_id, mvp_trialist_id, match_date, live_state')
      .eq('live_state', 'ended')
    // monthly window only in this simple version
    const mRes = await mSel.gte('match_date', startStr).lte('match_date', endStr)
    if (mRes.error) throw new Error(`matches (mvp): ${mRes.error.message}`)
    for (const m of (mRes.data || []) as any[]) {
      const pid = m.mvp_player_id as string | null
      if (pid) { const c = ensure(pid); c.mvpAwards += 1 }
    }

    // Compute score per player
    function calc(c: C) {
      const T_onTime = Math.max(0, c.T_P - c.T_L)
      const M_onTime = Math.max(0, c.M_P - c.M_L)
      const T_total = c.T_P + c.T_A + c.T_NR
      const M_total = c.M_P + c.M_A + c.M_NR
      const opportunities = T_total + M_total
      const POINTS = (
        1.0 * T_onTime +
        0.6 * c.T_L +
        -0.8 * c.T_A +
        -1.0 * c.T_NR +
        2.5 * M_onTime +
        1.5 * c.M_L +
        -2.0 * c.M_A +
        -2.5 * c.M_NR
      )
      const withBonus = POINTS + ((c.mvpAwards || 0) > 0 ? (weights.mvpBonusOnce || 0) : 0)
      const MAX = 1.0 * T_total + 2.5 * M_total
      const MIN = -1.0 * T_total - 2.5 * M_total
      const range = MAX - MIN
      let score = 0
      if (range !== 0) score = 100 * (withBonus - MIN) / range
      const score0to100 = Math.max(0, Math.min(100, Math.round(score * 10) / 10))
      const denomEvents = Math.max(1, opportunities)
      const noResponseRate = (c.T_NR + c.M_NR) / denomEvents
      const matchDen = Math.max(1, c.M_P + c.M_A + c.M_NR)
      const matchPresenceRate = c.M_P / matchDen
      const matchLateRate = c.M_P > 0 ? c.M_L / c.M_P : 0
      return { POINTS: withBonus, score0to100, opportunities, noResponseRate, matchPresenceRate, matchLateRate }
    }

    const rows: any[] = []
    for (const p of players || []) {
      if (p.status !== 'active') continue
      const c = map.get(p.id) || { T_P:0,T_L:0,T_A:0,T_NR:0,M_P:0,M_L:0,M_A:0,M_NR:0, mvpAwards: 0 }
      const s = calc(c)
      rows.push({
        player_id: p.id,
        score_date: scoreDate,
        points_raw: s.POINTS,
        score_0_100: s.score0to100,
        opportunities: s.opportunities,
        t_p: c.T_P,
        t_l: c.T_L,
        t_a: c.T_A,
        t_nr: c.T_NR,
        m_p: c.M_P,
        m_l: c.M_L,
        m_a: c.M_A,
        m_nr: c.M_NR,
        mvp_awards: c.mvpAwards || 0,
        no_response_rate: s.noResponseRate,
        match_presence_rate: s.matchPresenceRate,
        match_late_rate: s.matchLateRate,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    }

    // Replace same-date results
    const { error: delErr } = await supabase.from('attendance_scores').delete().eq('score_date', scoreDate)
    if (delErr) throw new Error(`delete attendance_scores: ${delErr.message}`)
    if (rows.length > 0) {
      const { error: insErr } = await supabase.from('attendance_scores').insert(rows)
      if (insErr) throw new Error(`insert attendance_scores: ${insErr.message}`)
    }

    return new Response(JSON.stringify({ ok: true, date: scoreDate, inserted: rows.length }), { headers: { 'content-type': 'application/json', ...corsHeaders } })
  } catch (e: any) {
    console.error(e)
    return new Response(JSON.stringify({ error: String(e?.message || e) }), { status: 500, headers: { 'content-type': 'application/json', ...corsHeaders } })
  }
})