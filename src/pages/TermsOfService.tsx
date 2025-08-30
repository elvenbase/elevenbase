import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSiteAssets } from '@/hooks/useSiteAssets';

const TermsOfService = () => {
  const { logoUrl: globalLogo } = useSiteAssets();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-slate-300/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between min-h-[64px] py-2">
            <div className="flex items-center space-x-4">
              <Link to="/">
                <Button variant="ghost" size="sm" className="text-slate-700 hover:text-slate-900">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Torna alla Home
                </Button>
              </Link>
              {globalLogo && (
                <img 
                  src={globalLogo}
                  alt="Platform Logo"
                  className="h-8 w-auto object-cover"
                  style={{ maxWidth: '120px' }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="shadow-lg">
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-3xl font-bold text-slate-800 mb-4">
              Termini di Servizio
            </CardTitle>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Condizioni d'uso della piattaforma ElevenBase per la gestione sportiva.
            </p>
          </CardHeader>
          <CardContent className="prose prose-slate max-w-none">
            <div className="space-y-8 text-slate-700 leading-relaxed">
              {/* Ultimo aggiornamento */}
              <div className="text-center">
                <p className="text-sm text-slate-500 font-medium">
                  Ultimo aggiornamento: {new Date().toLocaleDateString('it-IT')}
                </p>
              </div>

              {/* Introduzione */}
              <div className="space-y-4">
                <p className="text-lg">
                  Benvenuto su <strong>ElevenBase</strong>.
                </p>
                <p>
                  Utilizzando questa applicazione, accetti i seguenti termini e condizioni.
                </p>
              </div>

              {/* 1. Descrizione del servizio */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-slate-800 border-b border-slate-200 pb-2">
                  1. Descrizione del servizio
                </h2>
                <p>
                  <strong>ElevenBase</strong> è un'applicazione gratuita che consente di gestire squadre, giocatori, 
                  allenamenti e partite all'interno del contesto videoludico EA Sports FC.
                </p>
                <p>
                  L'applicazione è fornita a titolo gratuito. Eventuali donazioni sono facoltative e non danno 
                  diritto a funzionalità aggiuntive.
                </p>
              </div>

              {/* 2. Donazioni */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-slate-800 border-b border-slate-200 pb-2">
                  2. Donazioni
                </h2>
                <p>
                  Puoi supportare lo sviluppo dell'app tramite donazioni volontarie.
                </p>
                <p>La donazione:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>non è obbligatoria</strong>,</li>
                  <li><strong>non costituisce acquisto</strong> di beni o servizi,</li>
                  <li><strong>non dà diritto</strong> a funzioni premium o vantaggi.</li>
                </ul>
              </div>

              {/* 3. Limitazione di responsabilità */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-slate-800 border-b border-slate-200 pb-2">
                  3. Limitazione di responsabilità
                </h2>
                <p>
                  <strong>ElevenBase</strong> viene fornita "così com'è", senza garanzie di funzionamento 
                  continuo o assenza di errori.
                </p>
                <p>Non siamo responsabili per:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>eventuali <strong>perdite di dati</strong>,</li>
                  <li><strong>malfunzionamenti</strong>,</li>
                  <li><strong>interruzioni del servizio</strong>.</li>
                </ul>
              </div>

              {/* 4. Proprietà intellettuale */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-slate-800 border-b border-slate-200 pb-2">
                  4. Proprietà intellettuale
                </h2>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <p className="font-semibold text-yellow-900 mb-2">
                    ⚖️ Disclaimer EA Sports
                  </p>
                  <p>
                    <strong>EA Sports</strong>, il logo EA e tutti i marchi relativi a <strong>EA Sports FC</strong> sono 
                    di proprietà di Electronic Arts Inc.
                  </p>
                  <p className="mt-2">
                    <strong>ElevenBase è un'app indipendente</strong> e non è affiliata, sponsorizzata o approvata da EA Sports.
                  </p>
                </div>
              </div>

              {/* 5. Uso corretto */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-slate-800 border-b border-slate-200 pb-2">
                  5. Uso corretto
                </h2>
                <p>È vietato:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>utilizzare <strong>ElevenBase</strong> per scopi illegali,</li>
                  <li>tentare di accedere ai dati di altri utenti senza autorizzazione,</li>
                  <li>sfruttare vulnerabilità o bug.</li>
                </ul>
              </div>

              {/* 6. Modifiche ai termini */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-slate-800 border-b border-slate-200 pb-2">
                  6. Modifiche ai termini
                </h2>
                <p>
                  Ci riserviamo il diritto di aggiornare i presenti termini in qualsiasi momento.
                </p>
                <p>
                  Gli aggiornamenti saranno pubblicati su questa pagina.
                </p>
              </div>

              {/* Footer con data */}
              <div className="text-center pt-8 border-t border-slate-200">
                <p className="text-sm text-slate-500">
                  © 2025 ElevenBase – Tutti i diritti riservati
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TermsOfService;