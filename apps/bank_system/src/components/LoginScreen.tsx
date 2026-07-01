import React, { useState } from 'react';
import { authenticate } from '@gten/sdk';
import { Shield, Lock, AlertCircle, Loader2 } from 'lucide-react';

interface LoginScreenProps {
  onLogin: () => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Use the @gten/sdk to authenticate
      await authenticate({ username, password });
      onLogin(); // Signal to App that we're logged in
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to authenticate. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center" style={{ justifyContent: 'center', minHeight: '100vh', width: '100%' }}>
      <div className="glass-panel p-6 animate-fade-in" style={{ width: '100%', maxWidth: '400px' }}>
        
        <div className="text-center mb-6">
          <div className="brand-icon mx-auto mb-4" style={{ width: '48px', height: '48px', margin: '0 auto 1rem' }}>
            <Shield size={28} />
          </div>
          <h2>Trace-X Portal</h2>
          <p>Bank System Authentication</p>
        </div>

        {error && (
          <div className="badge badge-danger mb-4 flex items-center gap-2 p-2" style={{ width: '100%' }}>
            <AlertCircle size={16} />
            <span className="text-xs">{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label htmlFor="username">Email or Username</label>
            <input
              id="username"
              type="text"
              className="glass-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="input-group mb-6">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="glass-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary w-full"
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Lock size={18} />}
            {loading ? 'Authenticating...' : 'Secure Login'}
          </button>
        </form>
        
        <div className="text-center mt-4">
          <span className="text-xs text-muted">Protected by G-TEN Security SDK</span>
        </div>
      </div>
    </div>
  );
}
