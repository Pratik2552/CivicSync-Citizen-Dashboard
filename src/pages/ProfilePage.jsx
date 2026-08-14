import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { StatusBadge } from '../components/common/StatusBadge.jsx';
import Modal from '../components/common/Modal.jsx';
import { User, Bell, Award, Edit2, Save, X, ChevronRight, ShieldCheck, Phone, MapPin, Mail } from 'lucide-react';
import { api } from '../services/api.js'; // 👈 Fixed: imported correct centralized api object
import './ProfilePage.css';

const BADGES = {
  'First Reporter': { icon: '🚩', desc: 'Submitted your first municipal grievance.' },
  'Eco Champion':   { icon: '🌿', desc: 'Active participant in community cleanliness.' },
  'Verified Citizen':{ icon: '✅', desc: 'Registered user on CivicSync Nashik portal.' },
};

export default function ProfilePage() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [myReports, setMyReports] = useState([]);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ full_name: '', phone: '', address: '', locality: '' });
  
  const [notifications, setNotifications] = useState({ sms: true, push: false, whatsapp: false });
  const [notifSaved, setNotifSaved] = useState(false);

  // Fetch profile and user complaints on mount
  useEffect(() => {
    const token = localStorage.getItem('civicsync_token');
    if (!token) {
      setLoading(false);
      return;
    }

    const fetchUserData = async () => {
      try {
        setLoading(true);
        // Fetch user complaints via api object method
        const reportsRes = await api.getMyComplaints();
        const complaints = reportsRes.complaints || [];
        setMyReports(complaints);

        const storedUser = JSON.parse(localStorage.getItem('civicsync_user') || '{}');
        
        const userData = {
          id: storedUser.id || 'C-9042',
          name: storedUser.full_name || storedUser.name || 'Aditya Jadhav',
          email: storedUser.email || 'aditya@civicsync.nashik',
          phone: storedUser.phone || '+91 98765 43210',
          address: storedUser.address || 'College Road, Gangapur',
          locality: storedUser.locality || 'Nashik West Ward 14',
          points: complaints.length * 50 + 150, // Dynamic civic score based on activity
          badges: complaints.length > 0 ? ['First Reporter', 'Verified Citizen'] : ['Verified Citizen'],
        };

        setUser(userData);
        setForm({
          full_name: userData.name,
          phone: userData.phone,
          address: userData.address,
          locality: userData.locality,
        });
      } catch (err) {
        console.error('Failed to load profile data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleSaveProfile = () => {
    const updatedUser = {
      ...user,
      name: form.full_name,
      phone: form.phone,
      address: form.address,
      locality: form.locality,
    };
    setUser(updatedUser);
    localStorage.setItem('civicsync_user', JSON.stringify(updatedUser));
    setEditing(false);
  };

  const toggleNotif = (key) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
    setNotifSaved(false);
  };

  const saveNotifications = () => {
    setNotifSaved(true);
    setTimeout(() => setNotifSaved(false), 3000);
  };

  const handleLogout = () => {
    localStorage.removeItem('civicsync_token');
    localStorage.removeItem('civicsync_user');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="page-wrapper" style={{ padding: '4rem', textAlign: 'center' }}>
        <p>Loading your profile...</p>
      </div>
    );
  }

  if (!user || !localStorage.getItem('civicsync_token')) {
    return (
      <div className="page-wrapper">
        <div className="page-hero">
          <div className="container"><h1>My Citizen Profile</h1></div>
        </div>
        <div className="container profile-login-prompt" id="login-prompt" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <User size={56} style={{ margin: '0 auto 1rem', color: '#64748b' }} />
          <h2>Sign In to View Your Profile</h2>
          <p>You need to be signed in to access your profile, live complaint tracking, and alert preferences.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 20 }}>
            <Link to="/login" className="btn btn-primary btn-lg" id="sign-in-prompt-btn">Sign In</Link>
            <Link to="/login" className="btn btn-secondary btn-lg" id="register-prompt-btn">Register</Link>
          </div>
        </div>
      </div>
    );
  }

  const recentReports = myReports.slice(0, 3);

  return (
    <div className="page-wrapper">
      <div className="page-hero">
        <div className="container profile-hero-inner" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div className="profile-hero-avatar" style={{ width: 64, height: 64, borderRadius: '50%', background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', fontWeight: 700 }}>
            {user.name.charAt(0)}
          </div>
          <div>
            <h1>{user.name}</h1>
            <p style={{ opacity: 0.85, fontSize: '0.9rem' }}>Citizen ID: {String(user.id).substring(0, 8)} · {user.locality}</p>
          </div>
        </div>
      </div>

      <div className="container profile-layout" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', padding: '2rem 1rem' }}>

        {/* LEFT COLUMN */}
        <div className="profile-main" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Personal Information */}
          <div className="card profile-section" id="personal-info" style={{ background: '#fff', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div className="profile-section__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 className="profile-section__title" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.1rem', margin: 0 }}>
                <User size={18} /> Personal Information
              </h2>
              {!editing ? (
                <button className="btn btn-secondary btn-sm" id="edit-profile-btn" onClick={() => setEditing(true)}>
                  <Edit2 size={14} /> Edit
                </button>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary btn-sm" id="save-profile-btn" onClick={handleSaveProfile}>
                    <Save size={14} /> Save
                  </button>
                  <button className="btn btn-sm" style={{ background: '#eee', border: '1px solid #cbd5e1' }} onClick={() => setEditing(false)}>
                    <X size={14} /> Cancel
                  </button>
                </div>
              )}
            </div>

            {editing ? (
              <div className="profile-edit-form" id="edit-profile-form" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="profile-name">Full Name</label>
                  <input id="profile-name" className="form-input" value={form.full_name} onChange={e => setForm(p => ({...p, full_name: e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="profile-phone">Phone Number</label>
                  <input id="profile-phone" className="form-input" value={form.phone} onChange={e => setForm(p => ({...p, phone: e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="profile-address">Address</label>
                  <input id="profile-address" className="form-input" value={form.address} onChange={e => setForm(p => ({...p, address: e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="profile-locality">Locality / Ward</label>
                  <input id="profile-locality" className="form-input" value={form.locality} onChange={e => setForm(p => ({...p, locality: e.target.value}))} />
                </div>
              </div>
            ) : (
              <dl className="profile-dl" id="profile-info-display" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem 1.5rem', margin: 0 }}>
                <div><dt style={{ fontSize: '0.8rem', color: '#64748b' }}>Name</dt><dd style={{ fontWeight: 600, margin: 0 }}>{user.name}</dd></div>
                <div><dt style={{ fontSize: '0.8rem', color: '#64748b' }}>Phone</dt><dd style={{ fontWeight: 600, margin: 0 }}>{user.phone}</dd></div>
                <div><dt style={{ fontSize: '0.8rem', color: '#64748b' }}>Email</dt><dd style={{ fontWeight: 600, margin: 0 }}>{user.email}</dd></div>
                <div><dt style={{ fontSize: '0.8rem', color: '#64748b' }}>Address</dt><dd style={{ fontWeight: 600, margin: 0 }}>{user.address}</dd></div>
                <div style={{ gridColumn: 'span 2' }}><dt style={{ fontSize: '0.8rem', color: '#64748b' }}>Locality / Ward</dt><dd style={{ fontWeight: 600, margin: 0 }}>{user.locality}</dd></div>
              </dl>
            )}
          </div>

          {/* Notification Settings */}
          <div className="card profile-section" id="notification-settings" style={{ background: '#fff', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div className="profile-section__header" style={{ marginBottom: '0.5rem' }}>
              <h2 className="profile-section__title" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.1rem', margin: 0 }}>
                <Bell size={18} /> Alert Preferences
              </h2>
            </div>
            <p className="profile-section__desc" style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
              Choose how you want to receive updates about your complaints and assigned municipal authority movements.
            </p>
            <div className="notif-settings" id="notification-toggles" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { key: 'sms',      label: 'SMS Alerts',      desc: 'Receive text messages for complaint status changes.' },
                { key: 'push',     label: 'Push Notifications', desc: 'Browser or app real-time push alerts.' },
                { key: 'whatsapp', label: 'WhatsApp Updates',  desc: 'Get status updates directly on WhatsApp.' },
              ].map(n => (
                <div key={n.key} className="notif-row" id={`notif-${n.key}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <div className="notif-row__info">
                    <div className="notif-row__label" style={{ fontWeight: 600, fontSize: '0.9rem' }}>{n.label}</div>
                    <div className="notif-row__desc" style={{ fontSize: '0.8rem', color: '#64748b' }}>{n.desc}</div>
                  </div>
                  <label className="toggle-switch" aria-label={n.label} style={{ cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={notifications[n.key]}
                      onChange={() => toggleNotif(n.key)}
                      id={`toggle-${n.key}`}
                      style={{ cursor: 'pointer' }}
                    />
                  </label>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              <button className="btn btn-primary btn-sm" id="save-notifications-btn" onClick={saveNotifications}>
                Save Preferences
              </button>
              {notifSaved && <span style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 600 }}>✓ Preferences Saved</span>}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card profile-section" id="recent-activity" style={{ background: '#fff', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div className="profile-section__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 className="profile-section__title" style={{ fontSize: '1.1rem', margin: 0 }}>Recent Complaints</h2>
              <Link to="/my-reports" className="btn btn-secondary btn-sm" id="view-all-reports-btn">View All ({myReports.length})</Link>
            </div>
            {recentReports.length > 0 ? (
              recentReports.map(r => (
                <Link to={`/track/${r.id}`} key={r.id} className="profile-report-row" id={`profile-report-${r.id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9', textDecoration: 'none', color: 'inherit' }}>
                  <div>
                    <div className="profile-report-row__id" style={{ fontWeight: 600, fontSize: '0.85rem', color: '#2563eb' }}>#{String(r.id).substring(0, 8)}</div>
                    <div className="profile-report-row__cat" style={{ fontSize: '0.8rem', color: '#64748b' }}>{r.category} · {r.gps_source || 'Nashik Ward'}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <StatusBadge status={r.status} />
                    <ChevronRight size={16} style={{ color: '#94a3b8' }} />
                  </div>
                </Link>
              ))
            ) : (
              <p style={{ fontSize: '0.875rem', color: '#64748b', textAlign: 'center', padding: '1rem 0' }}>
                You have not submitted any complaints yet.
              </p>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN */}
        <div className="profile-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Points */}
          <div className="card profile-points" id="civic-points" style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', color: '#fff', padding: '1.5rem', borderRadius: '8px', textAlign: 'center', boxShadow: '0 4px 6px rgba(37,99,235,0.2)' }}>
            <div className="profile-points__label" style={{ fontSize: '0.85rem', opacity: 0.9, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Civic Participation Score</div>
            <div className="profile-points__value" style={{ fontSize: '2.5rem', fontWeight: 700, margin: '0.5rem 0' }}>{user.points}</div>
            <p className="profile-points__desc" style={{ fontSize: '0.8rem', opacity: 0.85, margin: 0 }}>
              Earned by reporting municipal issues and tracking resolution progress in Nashik.
            </p>
          </div>

          {/* Badges */}
          <div className="card profile-section" id="badges-section" style={{ background: '#fff', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 className="profile-section__title" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.1rem', marginBottom: 12, margin: '0 0 12px 0' }}>
              <Award size={18} /> Badges Earned
            </h3>
            {user.badges.length === 0 ? (
              <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
                No badges yet. Start reporting waste issues to earn badges!
              </p>
            ) : (
              <div className="badges-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {user.badges.map(badge => {
                  const b = BADGES[badge] || { icon: '🏅', desc: badge };
                  return (
                    <div key={badge} className="badge-item" id={`badge-${badge.replace(/\s+/g, '-').toLowerCase()}`} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: '#f8fafc', padding: '8px', borderRadius: '6px' }}>
                      <span className="badge-item__icon" style={{ fontSize: '1.25rem' }}>{b.icon}</span>
                      <div>
                        <div className="badge-item__name" style={{ fontWeight: 600, fontSize: '0.85rem', color: '#0f172a' }}>{badge}</div>
                        <div className="badge-item__desc" style={{ fontSize: '0.75rem', color: '#64748b' }}>{b.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sign Out */}
          <div className="card" style={{ background: '#fff', padding: '1rem', borderRadius: '8px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <button
              className="btn btn-danger btn-sm btn-full"
              id="sign-out-btn"
              onClick={handleLogout}
              style={{ width: '100%', padding: '8px' }}
            >
              Sign Out
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}