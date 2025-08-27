import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Mail, Database, UserCheck, Lock, Eye, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={handleBack} 
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Torna Indietro
          </button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" />
            GDPR Compliant
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
            <p className="text-xl text-muted-foreground">
              ElevenBase - Gestione Squadre eSports FC26
            </p>
            <p className="text-sm text-muted-foreground">
              Ultima modifica: {new Date().toLocaleDateString('it-IT')}
            </p>
          </div>

          {/* Introduzione */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                1. Introduzione
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Benvenuto in <strong>ElevenBase</strong>, la piattaforma per la gestione di squadre eSports FC26. 
                La presente Privacy Policy descrive come raccogliamo, utilizziamo e proteggiamo i tuoi dati personali 
                in conformità al Regolamento Generale sulla Protezione dei Dati (GDPR) dell'UE e alle normative italiane vigenti.
              </p>
              <p>
                <strong>Titolare del Trattamento:</strong> ElevenBase<br />
                <strong>Email di contatto:</strong> coach@elevenbase.pro<br />
                <strong>Sito web:</strong> https://elevenbase.pro
              </p>
            </CardContent>
          </Card>

          {/* Dati Raccolti */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                2. Dati Personali Raccolti
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">2.1 Dati di Registrazione</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Indirizzo email (utilizzato per login e comunicazioni di servizio)</li>
                  <li>Password criptata</li>
                  <li>Nome e cognome giocatore</li>
                  <li>Data di nascita (per calcolo età)</li>
                  <li>Numero di telefono (opzionale)</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">2.2 Dati di Gaming</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>EA Sports ID e platform gaming (PC, PS5, Xbox)</li>
                  <li>Ruolo di gioco e statistiche di partita</li>
                  <li>Presenze ad allenamenti e partite</li>
                  <li>Valutazioni e note tecniche</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">2.3 Dati Tecnici</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Indirizzo IP e informazioni del dispositivo</li>
                  <li>Log di accesso e utilizzo della piattaforma</li>
                  <li>Cookies tecnici necessari al funzionamento</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Finalità del Trattamento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                3. Finalità del Trattamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">3.1 Comunicazioni di Servizio (Base Giuridica: Contratto)</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Invio convocazioni per allenamenti e partite</li>
                  <li>Notifiche di aggiornamenti squadra e formazioni</li>
                  <li>Comunicazioni tecniche e di sicurezza</li>
                  <li>Reset password e conferma email</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">3.2 Gestione Squadra (Base Giuridica: Contratto)</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Creazione e gestione profili giocatori</li>
                  <li>Organizzazione allenamenti e partite</li>
                  <li>Tracciamento presenze e statistiche</li>
                  <li>Formazione squadre e lineup</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">3.3 Miglioramento Servizio (Base Giuridica: Legittimo Interesse)</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Analisi utilizzo per migliorare la piattaforma</li>
                  <li>Risoluzione problemi tecnici</li>
                  <li>Sviluppo nuove funzionalità</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Comunicazioni Email */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                4. Comunicazioni Email
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">📧 Email di Servizio (Sempre Attive)</h4>
                <p className="text-sm text-blue-800">
                  Le seguenti email sono <strong>necessarie</strong> per il funzionamento del servizio e 
                  vengono inviate automaticamente senza bisogno di consenso specifico:
                </p>
                <ul className="list-disc list-inside mt-2 text-sm text-blue-800">
                  <li>Conferma registrazione e attivazione account</li>
                  <li>Reset password e sicurezza account</li>
                  <li>Convocazioni ufficiali per partite e allenamenti</li>
                  <li>Aggiornamenti critici di squadra e formazioni</li>
                  <li>Notifiche tecniche e manutenzione</li>
                </ul>
              </div>

              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                <h4 className="font-semibold text-amber-900 mb-2">📬 Email Promozionali (Opzionali)</h4>
                <p className="text-sm text-amber-800">
                  Con il tuo consenso esplicito, potremo inviarti:
                </p>
                <ul className="list-disc list-inside mt-2 text-sm text-amber-800">
                  <li>Newsletter su aggiornamenti della piattaforma</li>
                  <li>Nuove funzionalità e miglioramenti</li>
                  <li>Eventi e tornei speciali</li>
                </ul>
                <p className="text-xs text-amber-700 mt-2">
                  <em>Puoi modificare queste preferenze in qualsiasi momento dal tuo profilo.</em>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Conservazione Dati */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                5. Conservazione e Sicurezza
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">5.1 Periodo di Conservazione</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li><strong>Account attivi:</strong> Per tutta la durata dell'utilizzo del servizio</li>
                  <li><strong>Account cancellati:</strong> 30 giorni per backup di sicurezza, poi eliminazione completa</li>
                  <li><strong>Log tecnici:</strong> Massimo 12 mesi per sicurezza e debugging</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">5.2 Misure di Sicurezza</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Criptazione password con algoritmi sicuri</li>
                  <li>Connessioni HTTPS/SSL per tutti i dati</li>
                  <li>Database protetti con accesso limitato</li>
                  <li>Backup giornalieri criptati</li>
                  <li>Monitoraggio accessi e attività sospette</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Diritti Utente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                6. I Tuoi Diritti GDPR
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">
                In conformità al GDPR, hai diritto a:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">✅ Accesso ai Dati</h4>
                  <p className="text-sm text-muted-foreground">
                    Visualizza tutti i tuoi dati dal tuo profilo utente
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">✏️ Rettifica</h4>
                  <p className="text-sm text-muted-foreground">
                    Modifica i tuoi dati direttamente dalla piattaforma
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">🗑️ Cancellazione</h4>
                  <p className="text-sm text-muted-foreground">
                    Elimina il tuo account e tutti i dati associati
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">📤 Portabilità</h4>
                  <p className="text-sm text-muted-foreground">
                    Esporta i tuoi dati in formato JSON
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">🛑 Opposizione</h4>
                  <p className="text-sm text-muted-foreground">
                    Revoca consensi per trattamenti non necessari
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">📧 Limitazione</h4>
                  <p className="text-sm text-muted-foreground">
                    Limita l'uso dei tuoi dati a specifiche finalità
                  </p>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-200 mt-4">
                <h4 className="font-semibold text-green-900 mb-2">📞 Come Esercitare i Tuoi Diritti</h4>
                <p className="text-sm text-green-800">
                  <strong>Email:</strong> coach@elevenbase.pro<br />
                  <strong>Risposta garantita:</strong> Entro 30 giorni dalla richiesta<br />
                  <strong>Gratuito:</strong> L'esercizio dei diritti è sempre gratuito
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Cookies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                7. Cookies e Tecnologie Simili
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">7.1 Cookies Tecnici (Sempre Attivi)</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Sessione utente e autenticazione</li>
                  <li>Preferenze di lingua e tema</li>
                  <li>Carrello e stato delle form</li>
                  <li>Sicurezza e prevenzione CSRF</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">7.2 Cookies Analitici (Con Consenso)</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Statistiche utilizzo anonimizzate</li>
                  <li>Performance e ottimizzazione</li>
                  <li>Analisi errori e crash report</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Modifiche */}
          <Card>
            <CardHeader>
              <CardTitle>8. Modifiche alla Privacy Policy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Questa Privacy Policy può essere modificata per adeguarsi a cambiamenti normativi o 
                miglioramenti del servizio. Ti informeremo di modifiche sostanziali tramite email 
                e banner nella piattaforma almeno 30 giorni prima dell'entrata in vigore.
              </p>
            </CardContent>
          </Card>

          {/* Contatti */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900">9. Contatti e Reclami</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">📧 Contatta il Responsabile Privacy</h4>
                <p className="text-sm text-blue-800">
                  <strong>Email:</strong> coach@elevenbase.pro<br />
                  <strong>Oggetto:</strong> [PRIVACY] La tua richiesta<br />
                  <strong>Risposta:</strong> Entro 30 giorni
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-blue-900 mb-2">🏛️ Autorità di Controllo</h4>
                <p className="text-sm text-blue-800">
                  In caso di problemi non risolti, puoi rivolgerti al <strong>Garante per la Protezione dei Dati Personali</strong>:<br />
                  <strong>Sito:</strong> www.gpdp.it<br />
                  <strong>Email:</strong> garante@gpdp.it
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4">
            <Shield className="h-4 w-4" />
            <span>ElevenBase - GDPR Compliant dal {new Date().getFullYear()}</span>
          </div>
          <Button 
            onClick={handleBack}
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna alla Piattaforma
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;