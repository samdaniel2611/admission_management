import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = (role) => {
    const creds = {
      admin: { email: 'admin@edumerge.com', password: 'Admin@123' },
      officer: { email: 'officer@edumerge.com', password: 'Officer@123' },
      management: { email: 'mgmt@edumerge.com', password: 'Mgmt@123' }
    };
    setEmail(creds[role].email);
    setPassword(creds[role].password);
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: 'var(--bg)',
      backgroundImage: 'radial-gradient(ellipse at 20% 50%, rgba(59,130,246,0.06) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(168,85,247,0.04) 0%, transparent 50%)'
    }}>
      <div style={{ width: '100%', maxWidth: 420, padding: 24 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, background: 'var(--accent)', borderRadius: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, fontWeight: 800, color: '#fff', margin: '0 auto 16px'
          }}>A</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>AdmissionPro</div>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>Admission Management & CRM</div>
        </div>

        <div className="card">
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>Sign in</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>Enter your credentials to continue</div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@institution.edu" required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '11px 16px', fontSize: 14 }}>
              {loading ? '⏳ Signing in...' : 'Sign In →'}
            </button>
          </form>

          <div className="divider" />
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8 }}>Quick Demo Access:</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { label: '🔑 Admin', role: 'admin' },
              { label: '📋 Officer', role: 'officer' },
              { label: '📊 Management', role: 'management' }
            ].map(d => (
              <button key={d.role} className="btn btn-ghost btn-sm" onClick={() => demoLogin(d.role)}>{d.label}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
