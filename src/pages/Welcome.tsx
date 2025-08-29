import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Crown, UserPlus, Trophy, Users, BarChart3, Shield, ArrowRight, CheckCircle, Star, Gamepad2, Target } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

const Welcome = () => {
  const [isVisible, setIsVisible] = useState(true); // Always visible - no animation delays
  const heroRef = useRef<HTMLDivElement>(null);

  // No heavy animations for performance

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#004d4d] to-[#1a237e] font-inter overflow-hidden">
      {/* Top Bar - Logo Centrato */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-16">
            <img 
              src="/assets/IMG_0055.png" 
              alt="ElevenBase" 
              className="h-12 w-auto"
            />
          </div>
        </div>
      </div>



      {/* Hero Section - Optimized */}
      <div 
        ref={heroRef}
        className="relative overflow-hidden flex items-center bg-gradient-to-br from-[#004d4d] to-[#1a237e]"
        style={{ minHeight: 'calc(100vh - 80px)' }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#004d4d]/80 to-[#1a237e]/80"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 z-10">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white border border-white/20 mb-8">
              <Gamepad2 className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">Gestione Professionale per EA Sports FC™</span>
            </div>

            {/* Main Title */}
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight text-white">
              Il futuro della gestione
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-[#006666]">
                dei Club FC
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-white/90 mb-16 max-w-4xl mx-auto leading-relaxed">
              ElevenBase è la piattaforma definitiva per gestire il tuo Club di EA Sports FC™. 
              Organizza giocatori, pianifica allenamenti, gestisci le formazioni e domina la competizione digitale.
            </p>
            
            {/* Action Hint */}
            <div className="text-white/70 text-lg text-center mb-8">
              ⬇️ Usa le icone in basso per iniziare
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {[
                { number: "500+", label: "Club FC Attivi" },
                { number: "25K+", label: "Giocatori Online" },
                { number: "10K+", label: "Partite Gestite" },
                { number: "99.9%", label: "Uptime Garantito" }
              ].map((stat, index) => (
                <div 
                  key={index}
                  className={`text-center transform transition-all duration-700 delay-${1100 + index * 100} ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
                >
                  <div className="text-2xl md:text-3xl font-bold text-white">{stat.number}</div>
                  <div className="text-white/70 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Two Paths Section */}
      <div className="relative bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-on-scroll opacity-0 translate-y-8 transition-all duration-700">
            <h2 className="text-4xl md:text-5xl font-bold text-[#004d4d] mb-6">
              Due modi per entrare nel mondo FC
            </h2>
            <p className="text-xl text-[#666666] max-w-3xl mx-auto">
              Che tu sia un Manager esperto o un Giocatore in cerca di gloria, ElevenBase ha il percorso giusto per te
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {/* Founder Path */}
            <Card className="group border-2 border-[#006666]/20 hover:border-[#006666]/40 hover:shadow-xl transition-all duration-500 overflow-hidden animate-on-scroll opacity-0 translate-y-8">
              <CardHeader className="text-center pb-6 bg-gradient-to-br from-[#004d4d]/5 to-[#006666]/5">
                <div className="w-16 h-16 bg-gradient-to-r from-[#004d4d] to-[#006666] rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Crown className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-[#004d4d] mb-3">Manager del Club</CardTitle>
                <CardDescription className="text-lg text-[#666666]">
                  Crea e gestisci il tuo Club di EA Sports FC™ con controllo totale su ogni aspetto
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6 p-6">
                <div className="space-y-4">
                  {[
                    "Personalizza nome, colori e badge del tuo Club FC",
                    "Recluta giocatori e costruisci la rosa perfetta", 
                    "Gestisci formazioni, tattiche e strategie",
                    "Analytics avanzate per performance e statistiche"
                  ].map((feature, index) => (
                    <div key={index} className={`flex items-start gap-3 transform transition-all duration-300 delay-${index * 100} group-hover:translate-x-2`}>
                      <CheckCircle className="h-5 w-5 text-[#006666] flex-shrink-0 mt-0.5" />
                      <span className="text-[#2c2c2c]">{feature}</span>
                    </div>
                  ))}
                </div>
                
                <Link to="/register-founder" className="block mt-8">
                  <Button className="w-full bg-gradient-to-r from-[#004d4d] to-[#006666] hover:from-[#006666] hover:to-[#004d4d] text-white font-semibold py-3 transition-all duration-300 group-hover:shadow-lg">
                    Diventa Manager
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Join Team Path */}
            <Card className="group border-2 border-[#1a237e]/20 hover:border-[#1a237e]/40 hover:shadow-xl transition-all duration-500 overflow-hidden animate-on-scroll opacity-0 translate-y-8">
              <CardHeader className="text-center pb-6 bg-gradient-to-br from-[#1a237e]/5 to-[#3949ab]/5">
                <div className="w-16 h-16 bg-gradient-to-r from-[#1a237e] to-[#3949ab] rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <UserPlus className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-[#004d4d] mb-3">Giocatore FC</CardTitle>
                <CardDescription className="text-lg text-[#666666]">
                  Unisciti a un Club FC esistente e aiuta la squadra a raggiungere la vittoria
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6 p-6">
                <div className="space-y-4">
                  {[
                    "Registrati con il codice invito del tuo Manager",
                    "Sincronizza il tuo profilo EA Sports FC™",
                    "Accesso a allenamenti e convocazioni del Club",
                    "Statistiche personali e progressi nel tempo"
                  ].map((feature, index) => (
                    <div key={index} className={`flex items-start gap-3 transform transition-all duration-300 delay-${index * 100} group-hover:translate-x-2`}>
                      <CheckCircle className="h-5 w-5 text-[#1a237e] flex-shrink-0 mt-0.5" />
                      <span className="text-[#2c2c2c]">{feature}</span>
                    </div>
                  ))}
                </div>
                
                <Link to="/register-invite" className="block mt-8">
                  <Button className="w-full bg-gradient-to-r from-[#1a237e] to-[#3949ab] hover:from-[#3949ab] hover:to-[#1a237e] text-white font-semibold py-3 transition-all duration-300 group-hover:shadow-lg">
                    Entra nel Club
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-on-scroll opacity-0 translate-y-8 transition-all duration-700">
            <h2 className="text-4xl md:text-5xl font-bold text-[#004d4d] mb-6">
              Tutto per il tuo Club FC
            </h2>
            <p className="text-xl text-[#666666] max-w-3xl mx-auto">
              Gli strumenti professionali per portare il tuo Club di EA Sports FC™ al livello successivo
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Users className="h-8 w-8" />,
                title: "Gestione Rosa",
                description: "Organizza la tua rosa FC, gestisci i ruoli e ottimizza la chimica del team.",
                color: "text-[#004d4d]"
              },
              {
                icon: <Target className="h-8 w-8" />,
                title: "Formazioni & Tattiche",
                description: "Crea formazioni personalizzate e strategie vincenti per ogni partita.",
                color: "text-[#006666]"
              },
              {
                icon: <BarChart3 className="h-8 w-8" />,
                title: "Analytics FC",
                description: "Statistiche dettagliate dei giocatori e performance del Club in tempo reale.",
                color: "text-[#1a237e]"
              },
              {
                icon: <Trophy className="h-8 w-8" />,
                title: "Competizioni",
                description: "Gestisci tornei, campionati e sfide tra Club con sistema di ranking.",
                color: "text-[#3949ab]"
              }
            ].map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-all duration-500 border-0 shadow-sm group animate-on-scroll opacity-0 translate-y-8 hover:-translate-y-2">
                <CardHeader>
                  <div className={`flex justify-center mb-4 ${feature.color} group-hover:scale-110 transition-transform duration-300`}>
                    {feature.icon}
                  </div>
                  <CardTitle className="text-lg font-semibold text-[#2c2c2c] group-hover:text-[#004d4d] transition-colors duration-300">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-[#666666] text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="relative bg-gradient-to-r from-[#004d4d] to-[#1a237e] py-20 overflow-hidden">
        {/* Subtle animated background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute w-96 h-96 bg-white rounded-full -top-48 -left-48 animate-pulse"></div>
          <div className="absolute w-64 h-64 bg-white rounded-full -bottom-32 -right-32 animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center animate-on-scroll opacity-0 translate-y-8 transition-all duration-700">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Pronto per la gloria FC?
          </h2>
          <p className="text-xl text-white/90 mb-12 max-w-3xl mx-auto">
            Unisciti ai Club più competitivi che stanno già utilizzando ElevenBase 
            per dominare EA Sports FC™ con strategia e precisione.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link to="/register-founder">
              <Button 
                size="lg" 
                className="bg-white text-[#004d4d] hover:bg-gray-100 font-semibold px-12 py-4 text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
              >
                <Crown className="h-5 w-5 mr-3" />
                Crea il Tuo Club FC
              </Button>
            </Link>
            <Link to="/auth">
              <Button 
                size="lg" 
                variant="outline" 
                className="border-2 border-white text-white bg-transparent hover:bg-white hover:text-[#004d4d] font-semibold px-12 py-4 text-lg backdrop-blur-sm transform hover:scale-105 transition-all duration-300"
              >
                Hai già un account?
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer with Disclaimer */}
      <footer className="bg-[#2c2c2c] py-8 pb-24 text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center space-y-2 md:space-y-0 md:space-x-4 flex-col md:flex-row">
              <Link to="/privacy-policy" className="text-[#666666] hover:text-white text-sm transition-colors duration-300">
                Privacy Policy
              </Link>
              <span className="hidden md:inline text-[#666666]">•</span>
              <span className="text-[#666666] text-sm">© 2024 ElevenBase</span>
            </div>
            <div className="text-xs text-[#666666] max-w-4xl leading-relaxed">
              <p className="mb-2">
                <strong>Disclaimer:</strong> ElevenBase è una piattaforma di gestione indipendente per Club virtuali. 
                Non è affiliata, sponsorizzata, approvata o in altro modo associata a Electronic Arts Inc. o ai suoi licenziatari.
              </p>
              <p>
                EA Sports™, EA Sports FC™ e tutti i marchi correlati sono marchi registrati di Electronic Arts Inc. 
                Tutti i diritti sono riservati ai rispettivi proprietari.
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Sticky Bottom Action Bar - Mobile App Style */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-center items-center h-16 gap-16">
            {/* Fonda Team */}
            <Link to="/register-founder" className="flex flex-col items-center gap-1 group">
              <div className="p-3 rounded-full bg-[#004d4d] text-white group-hover:bg-[#006666] transition-all duration-300 group-hover:scale-110 shadow-lg">
                <Crown className="h-6 w-6" />
              </div>
              <span className="text-xs font-medium text-gray-700 group-hover:text-[#004d4d] transition-colors">
                Fonda Team
              </span>
            </Link>

            {/* Unisciti */}
            <Link to="/register-invite" className="flex flex-col items-center gap-1 group">
              <div className="p-3 rounded-full bg-[#1a237e] text-white group-hover:bg-[#3949ab] transition-all duration-300 group-hover:scale-110 shadow-lg">
                <UserPlus className="h-6 w-6" />
              </div>
              <span className="text-xs font-medium text-gray-700 group-hover:text-[#1a237e] transition-colors">
                Unisciti
              </span>
            </Link>

            {/* Accesso */}
            <Link to="/auth" className="flex flex-col items-center gap-1 group">
              <div className="p-3 rounded-full bg-gray-600 text-white group-hover:bg-gray-700 transition-all duration-300 group-hover:scale-110 shadow-lg">
                <ArrowRight className="h-6 w-6" />
              </div>
              <span className="text-xs font-medium text-gray-700 group-hover:text-gray-800 transition-colors">
                Accesso
              </span>
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Welcome;