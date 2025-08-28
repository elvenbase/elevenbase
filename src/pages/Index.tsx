import React from 'react';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-700">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Benvenuto su <span className="text-yellow-300">ElevenBase</span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              La piattaforma completa per gestire la tua squadra di calcio. 
              Dalle convocazioni alle statistiche, tutto in un unico posto.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a 
                href="/auth/register-founder"
                className="inline-flex items-center px-8 py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-lg transition-colors"
              >
                👑 Fonda il Tuo Team
              </a>
              <span className="text-blue-100 text-sm">oppure</span>
              <a 
                href="/auth/register-invite"
                className="inline-flex items-center px-6 py-3 border border-white/20 text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                👥 Unisciti con Codice
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Two Paths Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Due Modi per Iniziare
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Scegli il percorso più adatto a te: crea il tuo team da zero o unisciti a uno esistente
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-6">
            <div className="text-center pb-6">
              <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">👑</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Fonda il Tuo Team</h3>
              <p className="text-lg text-gray-600">
                Sei un allenatore, dirigente o capitano? Crea il tuo team da zero
              </p>
            </div>
            <div>
              <a 
                href="/auth/register-founder" 
                className="block mt-6 w-full text-center px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-lg transition-colors"
              >
                Inizia Come Founder
              </a>
            </div>
          </div>

          <div className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6">
            <div className="text-center pb-6">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">👥</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Unisciti a un Team</h3>
              <p className="text-lg text-gray-600">
                Hai ricevuto un invito? Entra a far parte di un team esistente
              </p>
            </div>
            <div>
              <a 
                href="/auth/register-invite" 
                className="block mt-6 w-full text-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors"
              >
                Unisciti al Team
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Tutto ciò di cui hai bisogno
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Una piattaforma completa per gestire ogni aspetto della tua squadra
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6 bg-white rounded-lg shadow-sm">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-lg font-semibold mb-2">Gestione Squadra</h3>
              <p className="text-gray-600">Organizza i tuoi giocatori, staff tecnico e membri del team.</p>
            </div>

            <div className="text-center p-6 bg-white rounded-lg shadow-sm">
              <div className="text-4xl mb-4">🏆</div>
              <h3 className="text-lg font-semibold mb-2">Statistiche</h3>
              <p className="text-gray-600">Monitora le performance e analizza i dati della squadra.</p>
            </div>

            <div className="text-center p-6 bg-white rounded-lg shadow-sm">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-lg font-semibold mb-2">Allenamenti</h3>
              <p className="text-gray-600">Programma sessioni e gestisci le convocazioni.</p>
            </div>

            <div className="text-center p-6 bg-white rounded-lg shadow-sm">
              <div className="text-4xl mb-4">🛡️</div>
              <h3 className="text-lg font-semibold mb-2">Sicurezza</h3>
              <p className="text-gray-600">I tuoi dati sono protetti con tecnologie avanzate.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Pronto a iniziare?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Unisciti alle squadre che stanno già utilizzando ElevenBase
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/auth/register-founder"
              className="inline-flex items-center px-8 py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-lg transition-colors"
            >
              👑 Crea il Tuo Team
            </a>
            <a 
              href="/auth"
              className="inline-flex items-center px-8 py-3 border border-white text-white hover:bg-white hover:text-black rounded-lg transition-colors"
            >
              📧 Hai già un account?
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;