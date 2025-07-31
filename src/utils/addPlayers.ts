import { supabase } from '@/integrations/supabase/client';

const playersToAdd = [
  { name: 'Alessio Argenti', position: 'Centrocampista Centrale' },
  { name: 'Alessio Iervolino', position: null },
  { name: 'Matteo Medile', position: null },
  { name: 'Marco Pitingolo', position: 'Attaccante' },
  { name: 'Alessandro Contu', position: 'Difensore Centrale' },
  { name: 'Marco Azzi', position: 'Difensore Centrale' },
  { name: 'Jacopo D\'Astolto', position: 'Centrocampista Difensivo' },
  { name: 'Giacomo Caggiano', position: 'Esterno Destro' },
  { name: 'Mario Bervicato', position: null },
  { name: 'Luigi Russo', position: 'Difensore Centrale' },
  { name: 'Vito Tessitore', position: null },
  { name: 'Raffaele Lanzaro', position: null },
  { name: 'Riccardo Perna', position: null },
  { name: 'Nicola Leuci', position: null },
  { name: 'Nathan Habib', position: null },
  { name: 'Matteo Cascone', position: null },
  { name: 'Lucio De Crescenzo', position: null },
  { name: 'Gianmichele Cossu', position: null },
  { name: 'Daniele Moscato', position: null },
  { name: 'Andrea Argenti', position: 'Esterno Sinistro' },
  { name: 'Alessandro Rossi', position: null },
  { name: 'Maurizio Liguori', position: null }
];

export const addPlayersToDatabase = async () => {
  let jerseyNumber = 18; // Inizia dal 18 visto che Andrea Camolese ha il 17
  
  for (const player of playersToAdd) {
    const [firstName, ...lastNameParts] = player.name.split(' ');
    const lastName = lastNameParts.join(' ');
    
    try {
      const { data, error } = await supabase
        .from('players')
        .insert({
          first_name: firstName,
          last_name: lastName,
          jersey_number: jerseyNumber,
          position: player.position,
          status: 'active'
        })
        .select()
        .single();
      
      if (error) {
        console.error(`Errore nell'aggiungere ${player.name}:`, error);
      } else {
        console.log(`✅ Aggiunto: ${player.name} - #${jerseyNumber} - ${player.position || 'Ruolo da definire'}`);
      }
      
      jerseyNumber++;
    } catch (err) {
      console.error(`Errore nell'elaborare ${player.name}:`, err);
    }
  }
  
  console.log('🎉 Processo completato! Tutti i giocatori sono stati aggiunti.');
};

// Esegui la funzione
addPlayersToDatabase();