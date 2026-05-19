import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/admin/dashboard');
    } catch {
      setError('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-white">G3 <span className="text-cyan">Admin</span></h1>
          <p className="text-muted text-sm mt-2">Sports Management Console</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-card border border-white/5 rounded-2xl p-8 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-widest mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-bg border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-muted/50 focus:outline-none focus:border-cyan/40 transition-colors"
              placeholder="admin@g3sports.app"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-widest mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-bg border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-muted/50 focus:outline-none focus:border-cyan/40 transition-colors"
            />
          </div>
          {error && <p className="text-pink text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-cyan to-lime text-bg font-bold rounded-full py-3 text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
