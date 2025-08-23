-- Check training sessions in July 2025
SELECT 
  'Training Sessions July 2025' as data_type,
  COUNT(*) as count,
  MIN(session_date) as earliest_date,
  MAX(session_date) as latest_date
FROM training_sessions 
WHERE session_date >= '2025-07-01' 
  AND session_date <= '2025-07-31';

-- List all training sessions in July 2025
SELECT 
  id,
  session_date,
  title,
  created_at
FROM training_sessions 
WHERE session_date >= '2025-07-01' 
  AND session_date <= '2025-07-31'
ORDER BY session_date;

-- Check training attendance for July 2025
SELECT 
  'Training Attendance July 2025' as data_type,
  COUNT(*) as total_attendance_records,
  COUNT(DISTINCT player_id) as unique_players,
  COUNT(DISTINCT session_id) as sessions_with_attendance
FROM training_attendance ta
JOIN training_sessions ts ON ta.session_id = ts.id
WHERE ts.session_date >= '2025-07-01' 
  AND ts.session_date <= '2025-07-31';

-- Check training attendance by status for July 2025
SELECT 
  ta.status,
  COUNT(*) as count
FROM training_attendance ta
JOIN training_sessions ts ON ta.session_id = ts.id
WHERE ts.session_date >= '2025-07-01' 
  AND ts.session_date <= '2025-07-31'
GROUP BY ta.status
ORDER BY count DESC;

-- Check training convocati for July 2025
SELECT 
  'Training Convocati July 2025' as data_type,
  COUNT(*) as total_convocati,
  COUNT(DISTINCT player_id) as unique_players,
  COUNT(DISTINCT session_id) as sessions_with_convocati
FROM training_convocati tc
JOIN training_sessions ts ON tc.session_id = ts.id
WHERE ts.session_date >= '2025-07-01' 
  AND ts.session_date <= '2025-07-31';

-- Compare with August 2025 data
SELECT 
  'Training Sessions August 2025' as data_type,
  COUNT(*) as count,
  MIN(session_date) as earliest_date,
  MAX(session_date) as latest_date
FROM training_sessions 
WHERE session_date >= '2025-08-01' 
  AND session_date <= '2025-08-31';

-- Check some sample player data for July vs August
SELECT 
  'July vs August comparison' as info,
  july_data.player_count as july_players,
  august_data.player_count as august_players
FROM 
  (SELECT COUNT(DISTINCT ta.player_id) as player_count
   FROM training_attendance ta
   JOIN training_sessions ts ON ta.session_id = ts.id
   WHERE ts.session_date >= '2025-07-01' AND ts.session_date <= '2025-07-31') july_data,
  (SELECT COUNT(DISTINCT ta.player_id) as player_count
   FROM training_attendance ta
   JOIN training_sessions ts ON ta.session_id = ts.id
   WHERE ts.session_date >= '2025-08-01' AND ts.session_date <= '2025-08-31') august_data;