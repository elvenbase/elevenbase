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
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">📄 Contenuto in preparazione</h3>
                <p className="text-blue-800">
                  Il contenuto dettagliato dei Termini di Servizio verrà inserito a breve.
                  Questa pagina è stata creata per conformità legale e sarà popolata con il testo definitivo.
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-slate-800">1. Accettazione dei Termini</h2>
                <p className="text-slate-700">
                  L'utilizzo di ElevenBase implica l'accettazione di questi termini di servizio.
                </p>

                <h2 className="text-2xl font-bold text-slate-800">2. Descrizione del Servizio</h2>
                <p className="text-slate-700">
                  ElevenBase è una piattaforma di gestione sportiva per squadre e club.
                </p>

                <h2 className="text-2xl font-bold text-slate-800">3. Disclaimer EA Sports</h2>
                <p className="text-slate-700 bg-yellow-50 border border-yellow-200 rounded p-4">
                  <strong>Importante:</strong> ElevenBase è un'applicazione indipendente e non ufficiale, 
                  non affiliata, sponsorizzata né approvata da EA Sports. Tutti i marchi sono proprietà 
                  dei rispettivi proprietari.
                </p>

                <div className="text-center pt-8">
                  <p className="text-sm text-slate-500">
                    Ultima modifica: {new Date().toLocaleDateString('it-IT')}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TermsOfService;