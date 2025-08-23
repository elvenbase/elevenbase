// Debug script to check July training data
// Run this in browser console after logging into the app
console.log("🔍 Debugging July 2025 training data...");

async function debugJulyData() {
  // Get the supabase client from window if available
  const supabase = window.supabase || 
    (window.React && window.React.createElement && 
     document.querySelector('[data-supabase]')?.supabase);
  
  if (!supabase) {
    console.error("❌ Supabase client not found. Make sure you're on a page with Supabase initialized.");
    return;
  }

  try {
    console.log("📅 Checking training sessions for July 2025...");
    
    // Check training sessions in July 2025
    const { data: julySessions, error: julyError } = await supabase
      .from('training_sessions')
      .select('*')
      .gte('session_date', '2025-07-01')
      .lte('session_date', '2025-07-31')
      .order('session_date');

    if (julyError) {
      console.error("❌ Error fetching July sessions:", julyError);
      return;
    }

    console.log(`📊 Found ${julySessions.length} training sessions in July 2025:`, julySessions);

    if (julySessions.length > 0) {
      // Check attendance for July sessions
      const sessionIds = julySessions.map(s => s.id);
      
      const { data: julyAttendance, error: attendanceError } = await supabase
        .from('training_attendance')
        .select('*')
        .in('session_id', sessionIds);

      if (attendanceError) {
        console.error("❌ Error fetching July attendance:", attendanceError);
      } else {
        console.log(`👥 Found ${julyAttendance.length} attendance records for July sessions:`, julyAttendance);
        
        // Group by status
        const byStatus = julyAttendance.reduce((acc, record) => {
          acc[record.status] = (acc[record.status] || 0) + 1;
          return acc;
        }, {});
        console.log("📈 July attendance by status:", byStatus);
      }

      // Check convocati for July sessions
      const { data: julyConvocati, error: convoError } = await supabase
        .from('training_convocati')
        .select('*')
        .in('session_id', sessionIds);

      if (convoError) {
        console.error("❌ Error fetching July convocati:", convoError);
      } else {
        console.log(`📋 Found ${julyConvocati.length} convocati records for July sessions:`, julyConvocati);
      }
    }

    // Compare with August 2025 data
    console.log("📅 Checking training sessions for August 2025...");
    
    const { data: augustSessions, error: augustError } = await supabase
      .from('training_sessions')
      .select('*')
      .gte('session_date', '2025-08-01')
      .lte('session_date', '2025-08-31')
      .order('session_date');

    if (augustError) {
      console.error("❌ Error fetching August sessions:", augustError);
    } else {
      console.log(`📊 Found ${augustSessions.length} training sessions in August 2025:`, augustSessions);
    }

    // Test the useLeaders hook directly
    console.log("🧪 Testing date filtering like useLeaders hook...");
    
    const julyStart = '2025-07-01';
    const julyEnd = '2025-07-31';
    
    const { data: julyLeaderData, error: leaderError } = await supabase
      .from('training_attendance')
      .select('player_id, status, coach_confirmation_status, arrival_time, session_id, training_sessions!inner(session_date)')
      .gte('training_sessions.session_date', julyStart)
      .lte('training_sessions.session_date', julyEnd);

    if (leaderError) {
      console.error("❌ Error testing leader query for July:", leaderError);
    } else {
      console.log(`🏆 Leader query for July returned ${julyLeaderData.length} records:`, julyLeaderData);
    }

  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

// Run the debug function
debugJulyData();