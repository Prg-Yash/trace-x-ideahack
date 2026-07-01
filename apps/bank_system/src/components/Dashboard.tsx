import React, { useState, useEffect } from 'react';
import { sdk } from './LoginScreen';
import { 
  ShieldAlert, 
  Activity, 
  MessageSquare, 
  LogOut, 
  Search,
  AlertTriangle,
  BarChart,
  User,
  Send,
  X
} from 'lucide-react';

export function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [stats, setStats] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  
  // Fraud Scoring State
  const [accountId, setAccountId] = useState('ACC001');
  const [scoreResult, setScoreResult] = useState<any>(null);
  const [scoring, setScoring] = useState(false);
  
  // Copilot State
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user'|'ai', content: string}[]>([
    { role: 'ai', content: 'Hello! I am G-TEN Copilot. How can I assist you with fraud investigation today?' }
  ]);
  const [chatting, setChatting] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    if (!sdk) return;
    try {
      const statsData = await sdk.getStats();
      setStats(statsData);
      
      const alertsData = await sdk.listAlerts(10);
      setAlerts(alertsData?.alerts || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    }
  };

  const handleScoreAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId || !sdk) return;
    
    setScoring(true);
    try {
      const res = await sdk.analyzeTransaction(accountId);
      setScoreResult(res);
    } catch (err) {
      console.error('Failed to get score:', err);
    } finally {
      setScoring(false);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || chatting || !sdk) return;

    const userMsg = chatMessage;
    setChatMessage('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatting(true);

    try {
      const response = await sdk.chat(userMsg);
      setChatHistory(prev => [...prev, { role: 'ai', content: response }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'ai', content: 'Sorry, I encountered an error connecting to G-TEN.' }]);
    } finally {
      setChatting(false);
    }
  };

  const handleLogout = () => {
    if (sdk) sdk.signOut();
    onLogout();
  };

  return (
    <div className="w-full">
      {/* Top Navigation */}
      <nav className="top-nav">
        <div className="brand">
          <div className="brand-icon">
            <Activity size={20} />
          </div>
          <span>Trace-X</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted">
            <User size={16} /> Admin
          </div>
          <button className="btn btn-secondary text-sm" style={{ padding: '0.4rem 0.8rem' }} onClick={handleLogout}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="main-content">
        <div className="mb-6">
          <h1 className="text-gradient" style={{ fontSize: '2rem' }}>Command Center</h1>
          <p>Real-time threat monitoring and intelligence.</p>
        </div>

        {/* Stats Row */}
        <div className="dashboard-grid" style={{ marginTop: 0, marginBottom: '2rem' }}>
          <div className="glass-card p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-muted text-sm m-0">Total Transactions</h3>
              <BarChart size={18} className="text-info" />
            </div>
            <h2 style={{ fontSize: '2rem', margin: 0 }}>{stats?.total_transactions?.toLocaleString() || '---'}</h2>
          </div>
          
          <div className="glass-card p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-muted text-sm m-0">Active Alerts</h3>
              <ShieldAlert size={18} className="text-warning" />
            </div>
            <h2 style={{ fontSize: '2rem', margin: 0 }}>{stats?.total_flagged?.toLocaleString() || '---'}</h2>
          </div>
          
          <div className="glass-card p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-muted text-sm m-0">Fraud Rate</h3>
              <AlertTriangle size={18} className="text-danger" />
            </div>
            <h2 style={{ fontSize: '2rem', margin: 0 }}>
              {stats ? ((stats.total_flagged / Math.max(stats.total_transactions, 1)) * 100).toFixed(2) : '--'}%
            </h2>
          </div>
        </div>

        <div className="dashboard-grid">
          {/* Risk Scoring Panel */}
          <div className="glass-panel p-6">
            <div className="flex items-center gap-2 mb-6">
              <Search className="text-primary" size={20} />
              <h3 style={{ margin: 0 }}>Risk Scorer</h3>
            </div>
            
            <form onSubmit={handleScoreAccount} className="flex gap-2 mb-6">
              <input 
                type="text" 
                className="glass-input" 
                placeholder="Enter Account ID (e.g., ACC001)"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                style={{ marginBottom: 0 }}
              />
              <button type="submit" className="btn btn-primary" disabled={scoring}>
                {scoring ? 'Scoring...' : 'Analyze'}
              </button>
            </form>

            {scoreResult && (
              <div className="p-4" style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-muted">Risk Level</span>
                  <span className={`badge badge-${scoreResult.risk_level === 'HIGH' ? 'danger' : scoreResult.risk_level === 'MEDIUM' ? 'warning' : 'success'}`}>
                    {scoreResult.risk_level}
                  </span>
                </div>
                
                <div className="mb-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Combined Score</span>
                    <span>{(scoreResult.combined_score * 100).toFixed(1)}%</span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        height: '100%', 
                        width: `${scoreResult.combined_score * 100}%`,
                        background: scoreResult.risk_level === 'HIGH' ? 'var(--danger)' : 'var(--primary)',
                        transition: 'width 1s ease-out'
                      }} 
                    />
                  </div>
                </div>

                {scoreResult.flagged_for && scoreResult.flagged_for.length > 0 && (
                  <div className="mt-4">
                    <span className="text-xs text-muted block mb-2">Detections:</span>
                    <div className="flex gap-2 flex-wrap">
                      {scoreResult.flagged_for.map((f: string) => (
                        <span key={f} className="badge badge-danger text-xs">{f.replace('_', ' ')}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Alerts Feed */}
          <div className="glass-panel p-6 flex-col">
            <div className="flex items-center gap-2 mb-6">
              <AlertTriangle className="text-warning" size={20} />
              <h3 style={{ margin: 0 }}>Live Alerts Feed</h3>
            </div>
            
            <div className="flex-col gap-2" style={{ overflowY: 'auto', maxHeight: '400px' }}>
              {alerts.length === 0 ? (
                <div className="text-center text-muted p-4">No active alerts</div>
              ) : (
                alerts.map((alert: any) => (
                  <div key={alert.alert_id} className="p-3 mb-2" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '6px', borderLeft: `3px solid ${alert.risk_level === 'HIGH' ? 'var(--danger)' : 'var(--warning)'}` }}>
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-sm">{alert.customer_name || alert.account_id}</span>
                      <span className="text-xs text-muted">{new Date(alert.created_at).toLocaleTimeString()}</span>
                    </div>
                    <div className="text-xs text-muted mb-2">{alert.alert_id}</div>
                    <div className="flex gap-2">
                      {alert.flagged_for?.map((f: string) => (
                        <span key={f} className="text-xs" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', padding: '2px 6px', borderRadius: '4px' }}>
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Copilot Chat UI */}
      <div className="copilot-container">
        <div className={`glass-panel copilot-window ${isCopilotOpen ? '' : 'copilot-hidden'}`} style={{ border: '1px solid var(--accent)' }}>
          <div className="flex justify-between items-center p-3" style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(139, 92, 246, 0.1)' }}>
            <div className="flex items-center gap-2 font-semibold">
              <MessageSquare size={16} className="text-accent" />
              G-TEN Copilot
            </div>
            <button className="btn" style={{ padding: '0.2rem', background: 'transparent' }} onClick={() => setIsCopilotOpen(false)}>
              <X size={16} />
            </button>
          </div>
          
          <div className="chat-messages">
            {chatHistory.map((msg, idx) => (
              <div key={idx} className={`message ${msg.role === 'ai' ? 'message-ai' : 'message-user'}`}>
                {msg.content}
              </div>
            ))}
            {chatting && (
              <div className="message message-ai flex gap-1 items-center">
                <span className="animate-pulse">●</span><span className="animate-pulse" style={{ animationDelay: '0.2s'}}>●</span><span className="animate-pulse" style={{ animationDelay: '0.4s'}}>●</span>
              </div>
            )}
          </div>
          
          <form onSubmit={handleChatSubmit} className="chat-input">
            <input
              type="text"
              className="glass-input"
              placeholder="Ask Copilot..."
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              style={{ margin: 0, padding: '0.5rem 1rem' }}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }} disabled={chatting}>
              <Send size={16} />
            </button>
          </form>
        </div>

        <div className="copilot-toggle" onClick={() => setIsCopilotOpen(!isCopilotOpen)}>
          <MessageSquare size={24} />
        </div>
      </div>
    </div>
  );
}
