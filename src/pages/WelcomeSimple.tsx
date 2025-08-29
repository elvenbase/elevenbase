import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const WelcomeSimple = () => {
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await signIn(loginData.email, loginData.password);
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Top Bar */}
      <div style={{ 
        backgroundColor: 'white', 
        borderBottom: '1px solid #e5e7eb',
        textAlign: 'center',
        padding: '16px'
      }}>
        <img 
          src="/assets/IMG_0055.png" 
          alt="ElevenBase" 
          style={{ height: '48px', width: 'auto' }}
        />
      </div>

      {/* Hero Section */}
      <div style={{ 
        background: 'linear-gradient(to bottom right, #004d4d, #1a237e)',
        minHeight: 'calc(100vh - 160px)',
        display: 'flex',
        alignItems: 'center',
        color: 'white',
        textAlign: 'center',
        padding: '80px 20px'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ 
            fontSize: '3rem', 
            fontWeight: 'bold', 
            marginBottom: '24px',
            lineHeight: '1.2'
          }}>
            Il futuro della gestione dei Club FC
          </h1>
          
          <p style={{ 
            fontSize: '1.25rem', 
            opacity: 0.9, 
            marginBottom: '48px',
            maxWidth: '600px',
            margin: '0 auto 48px auto'
          }}>
            ElevenBase è la piattaforma definitiva per gestire il tuo Club di EA Sports FC™. 
            Organizza giocatori, pianifica allenamenti, gestisci le formazioni.
          </p>

          <div style={{ marginBottom: '32px' }}>
            ⬇️ Usa le icone in basso per iniziare
          </div>
        </div>
      </div>

      {/* Login Section */}
      <div style={{ 
        backgroundColor: 'white', 
        padding: '80px 20px',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '400px', margin: '0 auto' }}>
          <h2 style={{ 
            fontSize: '2rem', 
            fontWeight: 'bold', 
            color: '#004d4d', 
            marginBottom: '16px' 
          }}>
            Accesso
          </h2>
          
          <p style={{ color: '#666666', marginBottom: '32px' }}>
            Accedi al tuo account ElevenBase
          </p>

          <form onSubmit={handleLogin} style={{ marginBottom: '24px' }}>
            <div style={{ marginBottom: '16px', textAlign: 'left' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                Email
              </label>
              <input
                type="email"
                value={loginData.email}
                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                placeholder="tua@email.com"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
                required
              />
            </div>
            
            <div style={{ marginBottom: '24px', textAlign: 'left' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                Password
              </label>
              <input
                type="password"
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
                required
              />
            </div>
            
            <button 
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#004d4d',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.6 : 1
              }}
            >
              {isLoading ? 'Accesso...' : 'Accedi'}
            </button>
          </form>

          <div style={{ fontSize: '14px', color: '#666666' }}>
            <p style={{ marginBottom: '8px' }}>Non hai un account?</p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <Link 
                to="/register-founder" 
                style={{ color: '#004d4d', textDecoration: 'none' }}
              >
                Registrati come Founder
              </Link>
              <span>•</span>
              <Link 
                to="/register-invite" 
                style={{ color: '#1a237e', textDecoration: 'none' }}
              >
                Hai un codice invito?
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid #e5e7eb',
        padding: '16px',
        display: 'flex',
        justifyContent: 'center',
        gap: '64px',
        zIndex: 50
      }}>
        <Link 
          to="/register-founder" 
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            textDecoration: 'none',
            color: '#374151'
          }}
        >
          <div style={{
            width: '48px',
            height: '48px',
            backgroundColor: '#004d4d',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '20px',
            marginBottom: '4px'
          }}>
            👑
          </div>
          <span style={{ fontSize: '12px', fontWeight: '500' }}>Fonda Team</span>
        </Link>

        <Link 
          to="/register-invite" 
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            textDecoration: 'none',
            color: '#374151'
          }}
        >
          <div style={{
            width: '48px',
            height: '48px',
            backgroundColor: '#1a237e',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '20px',
            marginBottom: '4px'
          }}>
            👥
          </div>
          <span style={{ fontSize: '12px', fontWeight: '500' }}>Unisciti</span>
        </Link>

        <button 
          onClick={() => document.querySelector('#login-section')?.scrollIntoView({ behavior: 'smooth' })}
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#374151'
          }}
        >
          <div style={{
            width: '48px',
            height: '48px',
            backgroundColor: '#6b7280',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '20px',
            marginBottom: '4px'
          }}>
            ⬇️
          </div>
          <span style={{ fontSize: '12px', fontWeight: '500' }}>Accesso</span>
        </button>
      </div>
    </div>
  );
};

export default WelcomeSimple;