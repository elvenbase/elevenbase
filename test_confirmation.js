// Script per testare il reinvio dell'email di conferma
// Esegui questo script con: node test_confirmation.js

const SUPABASE_URL = 'https://cuthalxqxkonmfzqjdvw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1dGhhbHhxeGtvbm1menFqZHZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5NzI5NzQsImV4cCI6MjA1MTU0ODk3NH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

async function resendConfirmation() {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/resend-confirmation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        email: 'a.camolese@gmail.com'
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Success:', data);
      if (data.link) {
        console.log('🔗 Confirmation link:', data.link);
      }
    } else {
      console.log('❌ Error:', data);
    }
  } catch (error) {
    console.error('❌ Network error:', error);
  }
}

// Esegui la funzione
resendConfirmation(); 