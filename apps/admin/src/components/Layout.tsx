import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '@cifra-app/shared';

const NAV = [
  { to: '/', label: 'Dashboard', icon: '📊', end: true },
  { to: '/cifras', label: 'Cifras', icon: '🎵' },
  { to: '/repertorios', label: 'Repertório', icon: '📁' },
  { to: '/membros', label: 'Membros', icon: '👥', adminOnly: true },
];

export default function Layout() {
  const { profile, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const initials = (profile?.nome ?? '?')
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

  return (
    <div className="app-shell">
      <nav className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="brand">🎸 Cifra App</div>
        {NAV.filter((item) => !item.adminOnly || profile?.role === 'administrador').map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <span className="nav-icon">{item.icon}</span> {item.label}
          </NavLink>
        ))}
        <div className="sidebar-foot">Cifra App — painel administrativo</div>
      </nav>

      <div className="main">
        <div className="topbar">
          <button className="menu-btn" onClick={() => setSidebarOpen((v) => !v)}>☰</button>
          <div style={{ flex: 1 }} />
          <div className="account-wrap">
            <div className="admin-chip" onClick={() => setMenuOpen((v) => !v)}>
              <div className="avatar">{initials || '?'}</div> {profile?.nome?.split(' ')[0]}
            </div>
            {menuOpen && (
              <div className="account-menu open">
                <div className="acc-name">{profile?.nome}</div>
                <div className="acc-email">{profile?.email}</div>
                <div className="acc-org">{roleLabel(profile?.role)}</div>
                <hr />
                <button className="acc-logout" onClick={signOut}>Deslogar</button>
              </div>
            )}
          </div>
        </div>
        <div className="view">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

function roleLabel(role?: string) {
  if (role === 'administrador') return 'Administrador';
  if (role === 'editor') return 'Editor';
  if (role === 'colaborador') return 'Colaborador (leitura)';
  return '';
}
