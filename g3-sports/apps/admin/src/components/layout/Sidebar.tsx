import { NavLink } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

const links = [
  { to: '/admin/dashboard', label: '📊 Dashboard' },
  { to: '/admin/tournaments', label: '🏆 Tournaments' },
  { to: '/admin/users', label: '👥 Users' },
  { to: '/admin/live', label: '🔴 Live Matches' },
];

export default function Sidebar() {
  const logout = useAuthStore((s) => s.logout);
  return (
    <aside className="w-56 min-h-screen bg-card border-r border-white/5 flex flex-col">
      <div className="px-5 py-6 border-b border-white/5">
        <span className="text-xl font-black text-white">G3 <span className="text-cyan">Admin</span></span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) =>
              `block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive ? 'bg-cyan/10 text-cyan' : 'text-muted hover:text-white hover:bg-white/5'
              }`
            }
          >
            {l.label}
          </NavLink>
        ))}
      </nav>
      <div className="px-5 py-4 border-t border-white/5">
        <button onClick={logout} className="w-full text-left text-sm text-muted hover:text-pink transition-colors">
          Sign out
        </button>
      </div>
    </aside>
  );
}
