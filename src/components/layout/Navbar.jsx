import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Menu, X, ChevronDown, User, LogOut, Bell, QrCode, Award, Coins } from 'lucide-react';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown if user clicks outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setDropOpen(false);
    setMenuOpen(false);
    navigate('/');
  };

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/report-issue', label: 'Report an Issue' },
    { to: '/scan-bin', label: 'Scan Smart Bin' },
    { to: '/my-carbon-card', label: 'My Carbon Card' },
    { to: '/green-rewards', label: 'How to Redeem' },
    { to: '/my-reports', label: 'My Reports' },
  ];

  // Helper to extract display name & avatar initial safely
  const displayName = user?.full_name || user?.name || user?.email || 'Citizen';
  const firstName = displayName.split(' ')[0];
  const avatarInitial = displayName.charAt(0).toUpperCase();

  return (
    <header className="navbar">
      <div className="navbar__inner container">
        {/* Brand Logo */}
        <Link to="/" className="navbar__brand" onClick={() => setMenuOpen(false)}>
          <div className="navbar__logo-mark">
            <span className="navbar__logo-icon">♻</span>
          </div>
          <div className="navbar__brand-text">
            <span className="navbar__brand-name">CivicSync</span>
            <span className="navbar__brand-sub">Smart Waste Management</span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="navbar__nav" aria-label="Primary navigation">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `navbar__link ${isActive ? 'navbar__link--active' : ''}`
              }
            >
              {/* Add small icons next to specific links for emphasis */}
              {link.to === '/scan-bin' && <QrCode size={16} style={{ marginRight: '6px', marginBottom: '-3px' }} />}
              {link.to === '/my-carbon-card' && <Award size={16} style={{ marginRight: '6px', marginBottom: '-3px' }} />}
              {link.to === '/green-rewards' && <Coins size={16} style={{ marginRight: '6px', marginBottom: '-3px' }} />}
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Desktop Right Actions / Profile Menu */}
        <div className="navbar__right">
          {user ? (
            <div className="navbar__user-menu" ref={dropdownRef}>
              <button
                className="navbar__user-btn"
                onClick={() => setDropOpen((o) => !o)}
                aria-expanded={dropOpen}
                aria-haspopup="true"
              >
                <div className="navbar__avatar">{avatarInitial}</div>
                <span className="navbar__user-name">{firstName}</span>
                <ChevronDown
                  size={14}
                  className={`navbar__chevron ${dropOpen ? 'navbar__chevron--open' : ''}`}
                />
              </button>

              {dropOpen && (
                <div className="navbar__dropdown" role="menu">
                  <Link
                    to="/profile"
                    className="navbar__dropdown-item"
                    onClick={() => setDropOpen(false)}
                    role="menuitem"
                  >
                    <User size={15} /> My Profile
                  </Link>
                  <Link
                    to="/my-reports"
                    className="navbar__dropdown-item"
                    onClick={() => setDropOpen(false)}
                    role="menuitem"
                  >
                    <Bell size={15} /> My Reports
                  </Link>
                  <hr className="navbar__dropdown-divider" />
                  <button
                    className="navbar__dropdown-item navbar__dropdown-item--danger"
                    onClick={handleLogout}
                    role="menuitem"
                  >
                    <LogOut size={15} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="navbar__auth-btns">
              <Link to="/login" className="btn btn-outline-light btn-sm">
                Sign In
              </Link>
              <Link
                to="/login?tab=register"
                className="btn btn-sm"
                style={{ background: '#f57c00', color: '#fff', borderColor: '#f57c00' }}
              >
                Register
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          className="navbar__hamburger"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {menuOpen && (
        <div className="navbar__mobile-menu">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `navbar__mobile-link ${isActive ? 'navbar__mobile-link--active' : ''}`
              }
              onClick={() => setMenuOpen(false)}
            >
              {link.to === '/scan-bin' && <QrCode size={16} style={{ marginRight: '8px', marginBottom: '-3px' }} />}
              {link.to === '/my-carbon-card' && <Award size={16} style={{ marginRight: '8px', marginBottom: '-3px' }} />}
              {link.to === '/green-rewards' && <Coins size={16} style={{ marginRight: '8px', marginBottom: '-3px' }} />}
              {link.label}
            </NavLink>
          ))}

          {user ? (
            <>
              <Link
                to="/profile"
                className="navbar__mobile-link"
                onClick={() => setMenuOpen(false)}
              >
                My Profile ({displayName})
              </Link>
              <button
                className="navbar__mobile-link navbar__mobile-signout"
                onClick={handleLogout}
              >
                Sign Out
              </button>
            </>
          ) : (
            <div className="navbar__mobile-auth">
              <Link
                to="/login"
                className="btn btn-outline-light btn-sm btn-full"
                onClick={() => setMenuOpen(false)}
              >
                Sign In
              </Link>
              <Link
                to="/login?tab=register"
                className="btn btn-sm btn-full"
                style={{ background: '#f57c00', color: '#fff', borderColor: '#f57c00' }}
                onClick={() => setMenuOpen(false)}
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}