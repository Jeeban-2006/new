import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/dashboard',    icon: '📊', label: 'Dashboard' },
  { to: '/appointments', icon: '📅', label: 'Appointments' },
  { to: '/doctors',      icon: '👨‍⚕️', label: 'Doctors' },
  { to: '/patients',     icon: '🪪', label: 'Patients' },
];

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <span className="brand-icon">🏥</span>
        <div className="brand-text">
          <div className="brand-name">ClinicDesk</div>
          <div className="brand-sub">Patient Management</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">Menu</div>
        {NAV.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <span className="nav-icon">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User Footer */}
      <div className="sidebar-footer">
        <div className="user-card">
          <div className="user-avatar">
            {user?.username?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className="user-info">
            <div className="user-name">{user?.username ?? 'User'}</div>
            <div className="user-role">{user?.email ?? 'Clinic Staff'}</div>
          </div>
        </div>
        <button className="logout-btn" onClick={logout}>
          <span>🚪</span> Sign Out
        </button>
      </div>
    </aside>
  );
}
