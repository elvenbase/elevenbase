import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Crown, UserPlus, Trophy, Users, BarChart3, Shield, ArrowRight, CheckCircle, Star } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

const Welcome = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [parallaxY, setParallaxY] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Entrance animation
    const timer = setTimeout(() => setIsVisible(true), 100);

    // Parallax effect
    const handleScroll = () => {
      if (heroRef.current) {
        const scrolled = window.pageYOffset;
        const rate = scrolled * -0.5;
        setParallaxY(rate);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Intersection Observer for staggered animations
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in-up');
          entry.target.classList.remove('opacity-0', 'translate-y-8');
        }
      });
    }, observerOptions);

    // Observe all elements with the class 'animate-on-scroll'
    const animateElements = document.querySelectorAll('.animate-on-scroll');
    animateElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#004d4d] to-[#1a237e] font-inter overflow-hidden">
      {/* Navigation */}
      <nav className="relative z-50 bg-white/10 backdrop-blur-xl border-b border-white/20 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img 
                src="/assets/IMG_0055.png" 
                alt="ElevenBase" 
                className="h-12 w-auto"
              />
            </div>
            <div className="flex items-center gap-4">
              <Link to="/auth">
                <Button 
                  variant="outline" 
                  className="border-white/30 text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300"
                >
                  Accedi
                </Button>
              </Link>
              <Link to="/register-founder">
                <Button className="bg-[#006666] hover:bg-[#004d4d] text-white transition-all duration-300">
                  Inizia Ora
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Parallax */}
      <div 
        ref={heroRef}
        className="relative overflow-hidden min-h-screen flex items-center"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1574629810360-7efbbe195018?ixlib=rb-4.0.3&auto=format&fit=crop&w=1993&q=80")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          transform: `translateY(${parallaxY}px)`
        }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#004d4d]/80 to-[#1a237e]/80"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 z-10">
          <div className={`text-center transform transition-all duration-1000 ease-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
            {/* Badge */}
            <div className={`inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white border border-white/20 mb-8 transition-all duration-700 delay-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
              <Star className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">Piattaforma di Gestione Sportiva Professionale</span>
            </div>

            {/* Main Title */}
            <h1 className={`text-5xl md:text-7xl font-bold mb-6 leading-tight text-white transition-all duration-1000 delay-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
              Il futuro della gestione
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-[#006666]">
                sportiva
              </span>
            </h1>

            <p className={`text-xl md:text-2xl text-white/90 mb-12 max-w-4xl mx-auto leading-relaxed transition-all duration-1000 delay-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
              ElevenBase trasforma la gestione della tua squadra con tecnologie avanzate, 
              analytics intelligenti e automazione completa.
            </p>
            
            {/* CTA Buttons */}
            <div className={`flex flex-col sm:flex-row gap-6 justify-center items-center mb-16 transition-all duration-1000 delay-900 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
              <Link to="/register-founder">
                <Button 
                  size="lg" 
                  className="bg-white text-[#004d4d] hover:bg-gray-100 font-semibold px-12 py-4 text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                >
                  <Crown className="h-5 w-5 mr-3" />
                  Fonda il Tuo Team
                </Button>
              </Link>
              
              <div className="text-white/70 text-lg font-medium">oppure</div>
              
              <Link to="/register-invite">
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-2 border-white/80 text-white bg-transparent hover:bg-white hover:text-[#004d4d] font-semibold px-12 py-4 text-lg backdrop-blur-sm transform hover:scale-105 transition-all duration-300"
                >
                  <UserPlus className="h-5 w-5 mr-3" />
                  Unisciti con Codice
                </Button>
              </Link>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {[
                { number: "1000+", label: "Squadre Attive" },
                { number: "50K+", label: "Giocatori" },
                { number: "99.9%", label: "Uptime" },
                { number: "24/7", label: "Supporto" }
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
              Due percorsi per iniziare
            </h2>
            <p className="text-xl text-[#666666] max-w-3xl mx-auto">
              Scegli il percorso più adatto alle tue esigenze: crea un nuovo team o unisciti a uno esistente
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {/* Founder Path */}
            <Card className="group border-2 border-[#006666]/20 hover:border-[#006666]/40 hover:shadow-xl transition-all duration-500 overflow-hidden animate-on-scroll opacity-0 translate-y-8">
              <CardHeader className="text-center pb-6 bg-gradient-to-br from-[#004d4d]/5 to-[#006666]/5">
                <div className="w-16 h-16 bg-gradient-to-r from-[#004d4d] to-[#006666] rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Crown className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-[#004d4d] mb-3">Founder</CardTitle>
                <CardDescription className="text-lg text-[#666666]">
                  Crea e gestisci la tua squadra da zero con controllo completo
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6 p-6">
                <div className="space-y-4">
                  {[
                    "Crea il team con nome, colori e logo personalizzati",
                    "Invita giocatori, staff e amministratori", 
                    "Controllo completo su tutte le funzionalità",
                    "Analytics avanzate e report dettagliati"
                  ].map((feature, index) => (
                    <div key={index} className={`flex items-start gap-3 transform transition-all duration-300 delay-${index * 100} group-hover:translate-x-2`}>
                      <CheckCircle className="h-5 w-5 text-[#006666] flex-shrink-0 mt-0.5" />
                      <span className="text-[#2c2c2c]">{feature}</span>
                    </div>
                  ))}
                </div>
                
                <Link to="/register-founder" className="block mt-8">
                  <Button className="w-full bg-gradient-to-r from-[#004d4d] to-[#006666] hover:from-[#006666] hover:to-[#004d4d] text-white font-semibold py-3 transition-all duration-300 group-hover:shadow-lg">
                    Inizia come Founder
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
                <CardTitle className="text-2xl font-bold text-[#004d4d] mb-3">Membro Team</CardTitle>
                <CardDescription className="text-lg text-[#666666]">
                  Unisciti a un team esistente con un codice di invito
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6 p-6">
                <div className="space-y-4">
                  {[
                    "Registrazione rapida con codice invito",
                    "Ruoli: Giocatore, Amministratore o Staff",
                    "Accesso immediato dopo approvazione",
                    "Integrazione EA Sports FC per giocatori"
                  ].map((feature, index) => (
                    <div key={index} className={`flex items-start gap-3 transform transition-all duration-300 delay-${index * 100} group-hover:translate-x-2`}>
                      <CheckCircle className="h-5 w-5 text-[#1a237e] flex-shrink-0 mt-0.5" />
                      <span className="text-[#2c2c2c]">{feature}</span>
                    </div>
                  ))}
                </div>
                
                <Link to="/register-invite" className="block mt-8">
                  <Button className="w-full bg-gradient-to-r from-[#1a237e] to-[#3949ab] hover:from-[#3949ab] hover:to-[#1a237e] text-white font-semibold py-3 transition-all duration-300 group-hover:shadow-lg">
                    Unisciti al Team
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
              Funzionalità complete
            </h2>
            <p className="text-xl text-[#666666] max-w-3xl mx-auto">
              Una piattaforma completa per gestire ogni aspetto della tua squadra sportiva
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Users className="h-8 w-8" />,
                title: "Gestione Squadra",
                description: "Organizza giocatori, staff e membri in un'unica piattaforma intuitiva.",
                color: "text-[#004d4d]"
              },
              {
                icon: <Trophy className="h-8 w-8" />,
                title: "Statistiche Avanzate",
                description: "Analytics dettagliate per monitorare e migliorare le performance.",
                color: "text-[#006666]"
              },
              {
                icon: <BarChart3 className="h-8 w-8" />,
                title: "Allenamenti",
                description: "Programma sessioni e gestisci convocazioni con facilità.",
                color: "text-[#1a237e]"
              },
              {
                icon: <Shield className="h-8 w-8" />,
                title: "Sicurezza",
                description: "Protezione avanzata con tecnologie di sicurezza enterprise.",
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
            Pronto a iniziare?
          </h2>
          <p className="text-xl text-white/90 mb-12 max-w-3xl mx-auto">
            Unisciti alle squadre che stanno già utilizzando ElevenBase per gestire 
            le loro attività sportive in modo professionale.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link to="/register-founder">
              <Button 
                size="lg" 
                className="bg-white text-[#004d4d] hover:bg-gray-100 font-semibold px-12 py-4 text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
              >
                <Crown className="h-5 w-5 mr-3" />
                Crea il Tuo Team
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
    </div>
  );
};

export default Welcome;