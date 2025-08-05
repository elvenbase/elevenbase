// 🔍 DEBUG SCRIPT - Incolla nella console del browser

// 1️⃣ TEST RAPIDO: Verifica ultima formazione salvata
async function testLastLineup() {
  const { data, error } = await supabase
    .from('training_lineups')
    .select(`
      id,
      formation,
      players_data,
      updated_at,
      training_sessions(title)
    `)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()
  
  if (error) {
    console.error('❌ Errore:', error)
    return
  }
  
  console.log('✅ ULTIMA FORMAZIONE SALVATA:')
  console.log('📋 Sessione:', data.training_sessions?.title)
  console.log('⚽ Formazione:', data.formation)
  console.log('🕐 Salvata:', data.updated_at)
  console.log('👥 Posizioni:', data.players_data?.positions)
  console.log('🎨 Settings PNG:', data.players_data?.formation_data)
  
  const secondsAgo = Math.round((new Date() - new Date(data.updated_at)) / 1000)
  console.log(`⏱️ ${secondsAgo} secondi fa`)
  
  return data
}

// 2️⃣ TEST SPECIFICO: Verifica formazione per sessione
async function testSessionLineup(sessionId) {
  const { data, error } = await supabase
    .from('training_lineups')
    .select('*')
    .eq('session_id', sessionId)
    .single()
  
  if (error) {
    console.log('❌ Nessuna formazione per questa sessione:', error.message)
    return null
  }
  
  console.log('✅ FORMAZIONE PER SESSIONE:', sessionId)
  console.log(data)
  return data
}

// 3️⃣ AUTO-MONITOR: Monitora salvataggi in tempo reale (5 secondi)
function monitorLineups() {
  console.log('🔍 Monitoraggio formazioni attivo...')
  let lastUpdate = null
  
  const interval = setInterval(async () => {
    try {
      const { data } = await supabase
        .from('training_lineups')
        .select('formation, updated_at')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single()
      
      if (data && data.updated_at !== lastUpdate) {
        console.log(`🟢 NUOVO SALVATAGGIO: ${data.formation} alle ${data.updated_at}`)
        lastUpdate = data.updated_at
      }
    } catch (error) {
      // Ignora errori (nessuna formazione trovata)
    }
  }, 5000)
  
  console.log('⏹️ Per fermare: clearInterval(' + interval + ')')
  return interval
}

// 🚀 ESEGUI I TEST:
console.log('📋 TEST FORMAZIONI DISPONIBILI:')
console.log('• testLastLineup() - Ultima formazione salvata')
console.log('• testSessionLineup("SESSION_ID") - Formazione specifica')  
console.log('• monitorLineups() - Monitor tempo reale')
console.log('')
console.log('🎯 ESEGUI: testLastLineup()')