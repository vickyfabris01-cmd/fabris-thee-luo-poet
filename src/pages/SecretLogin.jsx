import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';

export default function SecretLogin() {
  const navigate = useNavigate();
  const { user, signInWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If user is already signed in, redirect to dashboard
  if (user) {
    navigate('/dashboard');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Email and password are required');
      return;
    }

    setLoading(true);
    const res = await signInWithEmail(email.trim(), password.trim());
    setLoading(false);

    if (res.success) {
      navigate('/dashboard');
    } else {
      setError(res.error || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="page" style={{ maxWidth: 400, margin: '0 auto', padding: '2rem 1rem' }}>
      

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
        {error && (
          <div style={{ padding: 12, background: '#f8d7da', color: '#721c24', borderRadius: 4 }}>
            {error}
          </div>
        )}

        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            style={{ width: '100%', padding: '8px', marginTop: '4px' }}
          />
        </div>

        <div>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            style={{ width: '100%', padding: '8px', marginTop: '4px' }}
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
