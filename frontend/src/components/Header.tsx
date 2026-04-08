import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LogOut, LayoutDashboard, User, BarChart3, X, AlertTriangle } from 'lucide-react';

export function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const isLogin = location.pathname === '/login';

  const [showProfile, setShowProfile] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    logout();
  };

  const getNavLinkClass = (path: string) => {
    return location.pathname === path ? "nav-link active" : "nav-link";
  };

  return (
    <>
      <header className="header">
        <Link to="/" className="logo" style={{ textDecoration: 'none' }}>LinkZap</Link>
        <nav style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className={getNavLinkClass('/dashboard')} title="Dashboard">
                <LayoutDashboard size={20} />
                <span>Dashboard</span>
              </Link>
              <Link to="/analytics" className={getNavLinkClass('/analytics')} title="Analytics">
                <BarChart3 size={20} />
                <span>Analytics</span>
              </Link>
              <div className="user-badge" onClick={() => setShowProfile(true)} title="Profile">
                <User size={16} />
                <span>{user?.username}</span>
              </div>
              <button onClick={() => setShowLogoutConfirm(true)} className="logout-btn" title="Logout">
                <LogOut size={20} />
              </button>
            </>
          ) : (
            <>
              <Link 
                to="/login" 
                className={isLogin ? "btn btn-primary" : "nav-link"}
                style={isLogin ? { padding: '0.6rem 1.2rem', fontSize: '0.9rem' } : undefined}
              >
                Login
              </Link>
              <Link 
                to="/signup" 
                className={!isLogin ? "btn btn-primary" : "nav-link"}
                style={!isLogin ? { padding: '0.6rem 1.2rem', fontSize: '0.9rem' } : undefined}
              >
                Sign Up
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* Profile Modal */}
      {showProfile && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setShowProfile(false); }}>
          <div className="modal-card" style={{ maxWidth: '400px' }}>
            <div className="modal-header" style={{ marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontFamily: 'Outfit, sans-serif' }}>My Profile</h3>
              <button className="modal-close" onClick={() => setShowProfile(false)}><X size={20} /></button>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
              <div style={{ 
                width: '60px', height: '60px', borderRadius: '50%', 
                background: 'var(--brand-gradient)', display: 'flex', 
                alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 600
              }}>
                {user?.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.2rem' }}>{user?.username}</h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>ID: {user?.id.substring(0, 8)}...</p>
              </div>
            </div>
            
            <button className="btn btn-secondary" style={{ width: '100%', marginTop: '1.5rem' }} onClick={() => setShowProfile(false)}>Close</button>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setShowLogoutConfirm(false); }}>
          <div className="modal-card" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <AlertTriangle size={48} style={{ color: '#ff4d4f', margin: '0 auto 1rem auto' }} />
            <h3 style={{ margin: '0 0 1rem 0', fontFamily: 'Outfit, sans-serif' }}>Ready to leave?</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
              You will need to log back in to manage your short links and view analytics.
            </p>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowLogoutConfirm(false)}>Cancel</button>
              <button className="btn" style={{ flex: 1, background: '#ff4d4f', color: '#fff' }} onClick={handleLogout}>Log Out</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
