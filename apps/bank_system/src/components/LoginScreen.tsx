import React, { useState } from 'react';
import { GTenSDK, GTenAuthError } from '@gten/sdk';
import { Shield, AlertCircle, Loader2, Key } from 'lucide-react';

// Shared SDK instance — created on login and used across the entire app
export let sdk: GTenSDK | null = null;

interface LoginScreenProps {
  onLogin: () => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [apiKey, setApiKey] = useState('demo-key-123');
  const [clientId, setClientId] = useState('demo-client-456');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Initialize and authenticate the SDK
      sdk = new GTenSDK({ apiKey, clientId });
      await sdk.authenticate();
      onLogin();
    } catch (err: any) {
      console.error('Login error:', err);
      if (err instanceof GTenAuthError) {
        setError('Authentication failed. Please check your API Key and Client ID.');
      } else {
        setError(err.message || 'Failed to connect to G-TEN. Please try again.');
      }
      sdk = null;
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
          <p>External Client Integration</p>
        </div>

        {error && (
          <div className="badge badge-danger mb-4 flex items-center gap-2 p-2" style={{ width: '100%' }}>
            <AlertCircle size={16} />
            <span className="text-xs">{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label htmlFor="clientId">Client ID</label>
            <input
              id="clientId"
              type="text"
              className="glass-input"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              required
            />
          </div>

          <div className="input-group mb-6">
            <label htmlFor="apiKey">API Key</label>
            <input
              id="apiKey"
              type="password"
              className="glass-input"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary w-full"
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Key size={18} />}
            {loading ? 'Authenticating...' : 'Connect to Trace-X'}
          </button>
        </form>
        
        <div className="text-center mt-4">
          <span className="text-xs text-muted">Protected by G-TEN Security SDK</span>
        </div>
      </div>
    </div>
  );
}
