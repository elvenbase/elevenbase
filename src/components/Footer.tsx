import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-slate-50 border-t border-slate-200 py-8 px-4 mt-auto">
      <div className="max-w-7xl mx-auto">
        <div className="text-center space-y-4">
          {/* Copyright e disclaimer EA Sports */}
          <div className="text-sm text-slate-600 space-y-2">
            <p>
              © 2025 ElevenBase – Tutti i diritti riservati.
            </p>
            <p>
              App indipendente e non ufficiale, non affiliata, sponsorizzata né approvata da EA Sports.
            </p>
            <p>
              L'uso è gratuito. Se vuoi supportare lo sviluppo:{' '}
              <a 
                href="https://buymeacoffee.com/elevenbase" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
              >
                Fai una donazione
              </a>
              .
            </p>
          </div>
          
          {/* Link legali */}
          <div className="flex flex-wrap justify-center items-center gap-4 text-sm">
            <Link 
              to="/termini-di-servizio" 
              className="text-slate-700 hover:text-slate-900 hover:underline"
            >
              Termini di servizio
            </Link>
            <span className="text-slate-400">|</span>
            <Link 
              to="/privacy-policy" 
              className="text-slate-700 hover:text-slate-900 hover:underline"
            >
              Privacy Policy
            </Link>
            <span className="text-slate-400">|</span>
            <Link 
              to="/cookie-policy" 
              className="text-slate-700 hover:text-slate-900 hover:underline"
            >
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;