import React, { useState } from 'react';
import { FlashStack } from './FlashStack';
import { FlashMessage } from '../types';
import { ScanFace, Lock, User, ShieldCheck, ArrowRight } from 'lucide-react';

interface LoginViewProps {
  onLogin: (username: string, pass: string) => boolean;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [messages, setMessages] = useState<FlashMessage[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = onLogin(username, password);
    if (!success) {
      setMessages([
        {
          id: Date.now().toString(),
          type: 'error',
          text: 'Invalid username or password.',
        },
      ]);
    }
  };

  const handleDismissFlash = (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <div className="auth-page">
      <main className="auth-shell">
        <section className="auth-panel">
          <div className="auth-icon-wrap">
            <ScanFace size={28} />
          </div>

          <p className="eyebrow">
            <ShieldCheck size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px' }} />
            Administrator Portal
          </p>
          <h1>Face Recognition Attendance</h1>
          <p className="muted" style={{ margin: '0 0 16px' }}>
            Sign in with administrative credentials to access real-time biometric scanning and records.
          </p>

          <FlashStack messages={messages} onDismiss={handleDismissFlash} />

          <form className="form-card" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username">Username</label>
              <div style={{ position: 'relative' }}>
                <User
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--muted)',
                  }}
                />
                <input
                  type="text"
                  id="username"
                  name="username"
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={{ paddingLeft: '36px' }}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--muted)',
                  }}
                />
                <input
                  type="password"
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: '36px' }}
                  required
                />
              </div>
            </div>

            <button type="submit" className="primary-btn" style={{ marginTop: '8px' }}>
              Sign In to System <ArrowRight size={16} />
            </button>
          </form>

          <div
            style={{
              marginTop: '20px',
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--surface-raised)',
              border: '1px solid var(--line)',
              fontSize: '0.85rem',
              color: 'var(--muted)',
              textAlign: 'center',
            }}
          >
            System Default Credentials: <strong>admin</strong> / <strong>admin123</strong>
          </div>
        </section>
      </main>
    </div>
  );
};
