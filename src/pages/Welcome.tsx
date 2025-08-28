import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Crown, UserPlus, Trophy, Users, BarChart3, Shield, ArrowRight, CheckCircle, Star, Zap, Target, Award } from 'lucide-react';
import { useState, useEffect } from 'react';

const Welcome = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [floatingElements, setFloatingElements] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  useEffect(() => {
    setIsVisible(true);
    // Generate floating football elements
    const elements = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 3
    }));
    setFloatingElements(elements);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#004d4d] via-[#006666] to-[#1a237e] font-inter">
      {/* Floating Football Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {floatingElements.map((el) => (
          <div
            key={el.id}
            className="absolute text-white/10 text-2xl animate-bounce"
            style={{
              left: `${el.x}%`,
              top: `${el.y}%`,
              animationDelay: `${el.delay}s`,
              animationDuration: `${3 + el.delay}s`
            }}
          >
            ⚽
          </div>
        ))}
      </div>

      {/* Navigation */}
      <nav className="relative z-50 bg-black/20 backdrop-blur-xl border-b border-white/10 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <img 
                src="/assets/logo_elevenBase.png" 
                alt="ElevenBase" 
                className="h-10 w-auto"
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/assets/IMG_0055.png' }}
              />
              <div className="text-2xl font-bold bg-gradient-to-r from-[#004d4d] to-[#1a237e] bg-clip-text text-transparent">
                ElevenBase
              </div>
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
                <Button className="bg-gradient-to-r from-[#004d4d] to-[#006666] hover:from-[#006666] hover:to-[#004d4d] text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
                  <Crown className="h-4 w-4 mr-2" />
                  Inizia Ora
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Grid Pattern Background */}
        <div className="absolute inset-0 football-field-bg opacity-20"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className={`text-center transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white border border-white/20 mb-8 animate-pulse">
              <Zap className="h-4 w-4 mr-2 text-yellow-400" />
              <span className="text-sm font-medium">La Rivoluzione del Calcio Digitale</span>
              <Star className="h-4 w-4 ml-2 text-yellow-400" />
            </div>

            {/* Main Title with Gradient */}
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="block text-white mb-2">Il Futuro del</span>
              <span className="block bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent animate-pulse">
                CALCIO
              </span>
              <span className="block text-white">è qui</span>
            </h1>

            <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-4xl mx-auto leading-relaxed">
              🚀 <strong>ElevenBase</strong> trasforma la gestione della tua squadra con 
              <span className="text-yellow-400 font-semibold"> intelligenza artificiale</span>, 
              <span className="text-green-400 font-semibold"> analytics avanzate</span> e 
              <span className="text-blue-400 font-semibold"> automazione smart</span>
            </p>
            
            {/* CTA Buttons with Animations */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <Link to="/register-founder">
                <Button 
                  size="lg" 
                  className="group relative bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 hover:from-yellow-400 hover:via-orange-400 hover:to-red-400 text-black font-bold px-12 py-4 text-lg shadow-2xl hover:shadow-yellow-500/25 transform hover:scale-110 transition-all duration-300 animate-bounce"
                >
                  <Crown className="h-6 w-6 mr-3 group-hover:rotate-12 transition-transform duration-300" />
                  🏆 FONDA IL TUO IMPERO
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-600 to-red-600 blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                </Button>
              </Link>
              
              <div className="text-white/70 text-lg font-medium">oppure</div>
              
              <Link to="/register-invite">
                <Button 
                  variant="outline" 
                  size="lg"
                  className="group border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 font-bold px-12 py-4 text-lg backdrop-blur-sm transform hover:scale-105 transition-all duration-300"
                >
                  <UserPlus className="h-6 w-6 mr-3 group-hover:rotate-12 transition-transform duration-300" />
                  🎫 UNISCITI ALLA LEGGENDA
                </Button>
              </Link>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {[
                { number: "1000+", label: "Squadre Attive", icon: "🏟️" },
                { number: "50K+", label: "Giocatori", icon: "⚽" },
                { number: "99.9%", label: "Uptime", icon: "🚀" },
                { number: "24/7", label: "Supporto", icon: "💬" }
              ].map((stat, index) => (
                <div 
                  key={index}
                  className={`text-center transform transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
                  style={{ transitionDelay: `${index * 200}ms` }}
                >
                  <div className="text-3xl mb-2">{stat.icon}</div>
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
        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#004d4d] via-yellow-400 to-[#1a237e]"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[#004d4d] mb-6">
              ⚡ Scegli la Tua Strada Verso la Gloria ⚡
            </h2>
            <p className="text-xl text-[#666666] max-w-3xl mx-auto">
              Due percorsi epici ti aspettano. Quale guerriero del calcio sei? 🏆
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {/* Founder Path */}
            <Card className="group relative border-4 border-yellow-200 bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 hover:shadow-2xl hover:shadow-yellow-500/30 transform hover:scale-105 transition-all duration-500 overflow-hidden">
              {/* Animated Background */}
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 to-orange-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <CardHeader className="relative text-center pb-6">
                <div className="w-20 h-20 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:rotate-12 transition-transform duration-500">
                  <Crown className="h-10 w-10 text-white" />
                </div>
                <CardTitle className="text-3xl font-bold text-[#004d4d] mb-3">👑 FOUNDER LEGGENDARIO</CardTitle>
                <CardDescription className="text-lg text-[#666666]">
                  Sei il visionario, il leader, l'architetto del futuro! 🏗️
                </CardDescription>
              </CardHeader>
              
              <CardContent className="relative space-y-6">
                <div className="space-y-4">
                  {[
                    "🏟️ Costruisci il tuo stadio digitale",
                    "👥 Recluta campioni da tutto il mondo", 
                    "📊 Analytics AI per dominare il campo",
                    "⚡ Controllo totale dell'universo calcio"
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center gap-3 group-hover:translate-x-2 transition-transform duration-300" style={{ transitionDelay: `${index * 100}ms` }}>
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <span className="font-medium">{feature}</span>
                    </div>
                  ))}
                </div>
                
                <Link to="/register-founder" className="block mt-8">
                  <Button className="w-full bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 hover:from-yellow-400 hover:via-orange-400 hover:to-red-400 text-black font-bold text-lg py-4 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 group-hover:animate-pulse">
                    🚀 INIZIA LA RIVOLUZIONE
                    <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-2 transition-transform duration-300" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Join Team Path */}
            <Card className="group relative border-4 border-blue-200 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 hover:shadow-2xl hover:shadow-blue-500/30 transform hover:scale-105 transition-all duration-500 overflow-hidden">
              {/* Animated Background */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-purple-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <CardHeader className="relative text-center pb-6">
                <div className="w-20 h-20 bg-gradient-to-r from-[#1a237e] to-[#004d4d] rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:rotate-12 transition-transform duration-500">
                  <UserPlus className="h-10 w-10 text-white" />
                </div>
                <CardTitle className="text-3xl font-bold text-[#004d4d] mb-3">⚽ GUERRIERO DEL CAMPO</CardTitle>
                <CardDescription className="text-lg text-[#666666]">
                  Unisciti alle leggende, diventa parte della storia! 🌟
                </CardDescription>
              </CardHeader>
              
              <CardContent className="relative space-y-6">
                <div className="space-y-4">
                  {[
                    "🎫 Accesso VIP con codice segreto",
                    "⚽ Ruoli epici: Player, Admin, Coach",
                    "🏆 Statistiche Pro con EA Sports FC",
                    "🔥 Battaglie epiche in tempo reale"
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center gap-3 group-hover:translate-x-2 transition-transform duration-300" style={{ transitionDelay: `${index * 100}ms` }}>
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <span className="font-medium">{feature}</span>
                    </div>
                  ))}
                </div>
                
                <Link to="/register-invite" className="block mt-8">
                  <Button className="w-full bg-gradient-to-r from-[#1a237e] to-[#004d4d] hover:from-[#3949ab] hover:to-[#006666] text-white font-bold text-lg py-4 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 group-hover:animate-pulse">
                    ⚡ ENTRA NELLA BATTAGLIA
                    <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-2 transition-transform duration-300" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative bg-gradient-to-br from-[#004d4d]/5 to-[#1a237e]/5 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[#004d4d] mb-6">
              🚀 Superpowers Inclusi 🚀
            </h2>
            <p className="text-xl text-[#666666] max-w-3xl mx-auto">
              La tecnologia che fa la differenza tra vincere e dominare completamente! ⚡
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Users className="h-12 w-12 text-[#004d4d]" />,
                title: "⚡ Squad Manager AI",
                description: "Gestione intelligente con automazione completa e insights predittivi.",
                gradient: "from-blue-500 to-teal-500"
              },
              {
                icon: <Trophy className="h-12 w-12 text-[#004d4d]" />,
                title: "📊 Analytics Beast",
                description: "Statistiche avanzate che trasformano dati in vittorie concrete.",
                gradient: "from-yellow-500 to-orange-500"
              },
              {
                icon: <Target className="h-12 w-12 text-[#004d4d]" />,
                title: "🎯 Training Matrix",
                description: "Allenamenti personalizzati con algoritmi di machine learning.",
                gradient: "from-green-500 to-emerald-500"
              },
              {
                icon: <Shield className="h-12 w-12 text-[#004d4d]" />,
                title: "🛡️ Fort Knox Security",
                description: "Protezione militare con crittografia quantistica avanzata.",
                gradient: "from-purple-500 to-indigo-500"
              }
            ].map((feature, index) => (
              <Card key={index} className={`group text-center hover:shadow-2xl transform hover:scale-110 transition-all duration-500 border-2 hover:border-[#004d4d]/30 bg-white relative overflow-hidden ${isVisible ? 'animate-fade-in' : ''}`} style={{ animationDelay: `${index * 200}ms` }}>
                {/* Animated Background Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
                
                <CardHeader className="relative">
                  <div className="flex justify-center mb-6 group-hover:scale-125 transition-transform duration-500">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl font-bold text-[#2c2c2c] group-hover:text-[#004d4d] transition-colors duration-300">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <p className="text-[#666666] group-hover:text-[#2c2c2c] transition-colors duration-300">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="relative bg-gradient-to-r from-[#004d4d] via-[#006666] to-[#1a237e] py-20 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 text-white/10 text-6xl animate-spin">⚽</div>
          <div className="absolute top-32 right-20 text-white/10 text-4xl animate-bounce">🏆</div>
          <div className="absolute bottom-20 left-32 text-white/10 text-5xl animate-pulse">🔥</div>
          <div className="absolute bottom-10 right-10 text-white/10 text-3xl animate-ping">⚡</div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 animate-pulse">
            ⚡ Ready to Dominate? ⚡
          </h2>
          <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-3xl mx-auto">
            🚀 Unisciti alla rivoluzione digitale del calcio. Il futuro è <strong className="text-yellow-400">ORA</strong>! 🏆
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
            <Link to="/register-founder">
              <Button 
                size="lg" 
                className="group bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 hover:from-yellow-400 hover:via-orange-400 hover:to-red-400 text-black font-bold px-12 py-4 text-xl shadow-2xl hover:shadow-yellow-500/50 transform hover:scale-110 transition-all duration-500 animate-bounce"
              >
                <Crown className="h-6 w-6 mr-3 group-hover:rotate-45 transition-transform duration-500" />
                🏆 INIZIA L'IMPERO
                <Zap className="h-6 w-6 ml-3 group-hover:rotate-45 transition-transform duration-500" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button 
                size="lg" 
                variant="outline" 
                className="border-2 border-white text-white hover:bg-white hover:text-[#004d4d] font-bold px-12 py-4 text-xl backdrop-blur-sm transform hover:scale-110 transition-all duration-500"
              >
                <Award className="h-6 w-6 mr-3" />
                🎯 HO GIÀ UN ACCOUNT
              </Button>
            </Link>
          </div>

          {/* Social Proof */}
          <div className="text-white/70 text-lg">
            Trusted by <span className="text-yellow-400 font-bold">1000+</span> teams worldwide 🌍
          </div>
        </div>
      </div>
    </div>
  );
};

export default Welcome;