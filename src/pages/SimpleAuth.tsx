import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const SimpleAuth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signIn(email, password);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <div style={{ padding: '50px', fontFamily: 'Arial' }}>
      <h1>ElevenBase - Login Semplice</h1>
      
      <form onSubmit={handleSubmit} style={{ maxWidth: '300px', margin: '20px 0' }}>
        <div style={{ marginBottom: '10px' }}>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            required
          />
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            required
          />
        </div>
        
        <button 
          type="submit"
          style={{ 
            width: '100%', 
            padding: '10px', 
            backgroundColor: '#004d4d', 
            color: 'white', 
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Login
        </button>
      </form>

      <div style={{ marginTop: '20px' }}>
        <p>Non hai un account?</p>
        <a href="/register-founder" style={{ color: '#004d4d', marginRight: '10px' }}>
          Registrati come Founder
        </a>
        <a href="/register-invite" style={{ color: '#1a237e' }}>
          Hai un codice invito?
        </a>
      </div>
    </div>
  );
};

export default SimpleAuth;