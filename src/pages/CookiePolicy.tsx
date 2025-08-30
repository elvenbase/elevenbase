import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect } from 'react';
import { useSiteAssets } from '@/hooks/useSiteAssets';

const CookiePolicy = () => {
  const { logoUrl: globalLogo } = useSiteAssets();

  useEffect(() => {
    // Carica lo script Cookiebot per la dichiarazione cookie
    const script = document.createElement('script');
    script.id = 'CookieDeclaration';
    script.src = 'https://consent.cookiebot.com/08edd00d-6217-4c19-a1bf-2ebd58a79e6c/cd.js';
    script.type = 'text/javascript';
    script.async = true;
    
    // Aggiungi al body
    document.body.appendChild(script);
    
    // Cleanup
    return () => {
      const existingScript = document.getElementById('CookieDeclaration');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

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
              Cookie Policy
            </CardTitle>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Informazioni sui cookie utilizzati da ElevenBase e su come gestire le tue preferenze.
            </p>
          </CardHeader>
          <CardContent className="prose prose-slate max-w-none">
            {/* Qui verrà inserita la dichiarazione cookie di Cookiebot */}
            <div id="CookieDeclaration-container" className="min-h-[400px]">
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-300 border-t-slate-600 mx-auto mb-4"></div>
                <p className="text-slate-500">Caricamento informazioni sui cookie...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CookiePolicy;