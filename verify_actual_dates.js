// Script to verify actual training session dates and debug filtering
console.log("🔍 Verifying actual training session dates...");

async function verifyActualDates() {
  // Import from the supabase client in the app
  const { createClient } = await import('https://cdn.skypack.dev/@supabase/supabase-js@2');
  
  // Or try to get it from the global window
  const supabase = window.supabaseClient || 
    (window.supabase) ||
    createClient(
      window.location.origin.includes('localhost') ? 
        'your_supabase_url' : 
        'your_supabase_url',
      'your_anon_key'
    );

  if (!supabase) {
    console.error("❌ Can't access Supabase client");
    return;
  }

  try {
    console.log("📅 Fetching ALL training sessions to see actual dates...");
    
    // Get all training sessions to see what dates we actually have
    const { data: allSessions, error: allError } = await supabase
      .from('training_sessions')
      .select('id, session_date, title, created_at')
      .order('session_date', { ascending: false });

    if (allError) {
      console.error("❌ Error fetching all sessions:", allError);
      return;
    }

    console.log(`📊 Total training sessions found: ${allSessions.length}`);
    
    // Group by year-month
    const byMonth = allSessions.reduce((acc, session) => {
      const date = new Date(session.session_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!acc[monthKey]) acc[monthKey] = [];
      acc[monthKey].push(session);
      return acc;
    }, {});

    console.log("📈 Sessions by month:", byMonth);

    // Focus on 2025 data
    const july2025 = allSessions.filter(s => {
      const date = new Date(s.session_date);
      return date.getFullYear() === 2025 && date.getMonth() === 6; // July is month 6
    });

    const august2025 = allSessions.filter(s => {
      const date = new Date(s.session_date);
      return date.getFullYear() === 2025 && date.getMonth() === 7; // August is month 7
    });

    console.log(`🟡 July 2025 sessions: ${july2025.length}`, july2025);
    console.log(`🟠 August 2025 sessions: ${august2025.length}`, august2025);

    // Test the exact date ranges we're using in the app
    const now = new Date();
    const currentStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const currentEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
    const previousStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth()-1, 1));
    const previousEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0, 23, 59, 59, 999));

    console.log("🧪 Testing our exact date ranges:");
    console.log("Current month range:", {
      start: currentStart.toISOString(),
      end: currentEnd.toISOString(),
      startDate: `${currentStart.getUTCFullYear()}-${String(currentStart.getUTCMonth()+1).padStart(2,'0')}-${String(currentStart.getUTCDate()).padStart(2,'0')}`,
      endDate: `${currentEnd.getUTCFullYear()}-${String(currentEnd.getUTCMonth()+1).padStart(2,'0')}-${String(currentEnd.getUTCDate()).padStart(2,'0')}`
    });

    console.log("Previous month range:", {
      start: previousStart.toISOString(),
      end: previousEnd.toISOString(),
      startDate: `${previousStart.getUTCFullYear()}-${String(previousStart.getUTCMonth()+1).padStart(2,'0')}-${String(previousStart.getUTCDate()).padStart(2,'0')}`,
      endDate: `${previousEnd.getUTCFullYear()}-${String(previousEnd.getUTCMonth()+1).padStart(2,'0')}-${String(previousEnd.getUTCDate()).padStart(2,'0')}`
    });

    // Test queries with our exact ranges
    console.log("🔍 Testing current month query...");
    const { data: currentTest, error: currentError } = await supabase
      .from('training_sessions')
      .select('id, session_date, title')
      .gte('session_date', currentStart.toISOString().split('T')[0])
      .lte('session_date', currentEnd.toISOString().split('T')[0])
      .order('session_date');

    console.log(`✅ Current month test result: ${currentTest?.length || 0} sessions`, currentTest);

    console.log("🔍 Testing previous month query...");
    const { data: previousTest, error: previousError } = await supabase
      .from('training_sessions')
      .select('id, session_date, title')
      .gte('session_date', previousStart.toISOString().split('T')[0])
      .lte('session_date', previousEnd.toISOString().split('T')[0])
      .order('session_date');

    console.log(`✅ Previous month test result: ${previousTest?.length || 0} sessions`, previousTest);

    // Test attendance data
    if (previousTest && previousTest.length > 0) {
      console.log("🔍 Testing attendance data for July sessions...");
      const sessionIds = previousTest.map(s => s.id);
      
      const { data: attendanceTest, error: attendanceError } = await supabase
        .from('training_attendance')
        .select('*')
        .in('session_id', sessionIds);

      console.log(`👥 July attendance records: ${attendanceTest?.length || 0}`, attendanceTest);
    }

  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

verifyActualDates();