import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="p-6 bg-gradient-primary rounded-2xl shadow-glow mb-6 inline-block">
          <span className="text-4xl font-bold text-foreground">404</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-4">Pagina Non Trovata</h1>
        <p className="text-muted-foreground mb-6">
          La pagina che stai cercando non esiste o è stata spostata.
        </p>
        <a 
          href="/" 
          className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-smooth shadow-glow hover:shadow-accent-glow"
        >
          Torna alla Dashboard
        </a>
      </div>
    </div>
  );
};

export default NotFound;
