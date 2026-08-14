import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { issueCategories, mockReports } from '../data/mockData';
import { StatusBadge } from '../components/common/StatusBadge';
import { User, Bell, Award, Edit2, Save, X, ChevronRight } from 'lucide-react';
import './ProfilePage.css';

const BADGES = {
  'First Reporter': { icon: '🚩', desc: 'Submitted your first complaint.' },
  'Eco Champion':   { icon: '🌿', desc: 'Reported 5+ issues. Great civic participation!' },
  'Verified Citizen':{ icon: '✅', desc: 'Identity verified with municipal records.' },
};

export default function ProfilePage() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(user ? { name: user.name, phone: user.phone, address: user.address, locality: user.locality } : {});
  const [notifications, setNotifications] = useState(user?.notifications || { sms: true, push: false, whatsapp: false });
  const [notifSaved, setNotifSaved] = useState(false);

  if (!user) {
    return (
      <div className="page-wrapper">
        <div className="page-hero">
          <div className="container"><h1>My Profile</h1></div>
        </div>
        <div className="container profile-login-prompt" id="login-prompt">
          <User size={56} />
          <h2>Sign In to View Your Profile</h2>
          <p>You need to be signed in to access your profile, complaints, and notification settings.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 20 }}>
            <Link to="/login" className="btn btn-primary btn-lg" id="sign-in-prompt-btn">Sign In</Link>
            <Link to="/login?tab=register" className="btn btn-secondary btn-lg" id="register-prompt-btn">Register</Link>
          </div>
        </div>
      </div>
    );
  }

  const handleSaveProfile = () => {
    updateUser(form);
    setEditing(false);
  };

  const toggleNotif = (key) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
    setNotifSaved(false);
  };

  const saveNotifications = () => {
    updateUser({ notifications });
    setNotifSaved(true);
    setTimeout(() => setNotifSaved(false), 3000);
  };

  const recentReports = mockReports.slice(0, 2);

  return (
    <div className="page-wrapper">
      <div className="page-hero">
        <div className="container profile-hero-inner">
          <div className="profile-hero-avatar">{user.name.charAt(0)}</div>
          <div>
            <h1>{user.name}</h1>
            <p>Citizen ID: {user.id} · {user.locality}</p>
          </div>
        </div>
      </div>

      <div className="container profile-layout">

        {/* LEFT COLUMN */}
        <div className="profile-main">

          {/* Personal Information */}
          <div className="card profile-section" id="personal-info">
            <div className="profile-section__header">
              <h2 className="profile-section__title"><User size={18} /> Personal Information</h2>
              {!editing ? (
                <button className="btn btn-secondary btn-sm" id="edit-profile-btn" onClick={() => setEditing(true)}>
                  <Edit2 size={14} /> Edit
                </button>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary btn-sm" id="save-profile-btn" onClick={handleSaveProfile}>
                    <Save size={14} /> Save
                  </button>
                  <button className="btn btn-sm" style={{ background: '#eee', border: '1px solid var(--color-border)' }} onClick={() => setEditing(false)}>
                    <X size={14} /> Cancel
                  </button>
                </div>
              )}
            </div>
            {editing ? (
              <div className="profile-edit-form" id="edit-profile-form">
                <div className="form-group">
                  <label className="form-label" htmlFor="profile-name">Full Name</label>
                  <input id="profile-name" className="form-input" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} />
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
              <dl className="profile-dl" id="profile-info-display">
                <div><dt>Name</dt><dd>{user.name}</dd></div>
                <div><dt>Phone</dt><dd>{user.phone}</dd></div>
                <div><dt>Email</dt><dd>{user.email}</dd></div>
                <div><dt>Address</dt><dd>{user.address}</dd></div>
                <div><dt>Locality / Ward</dt><dd>{user.locality}</dd></div>
              </dl>
            )}
          </div>

          {/* Notification Settings */}
          <div className="card profile-section" id="notification-settings">
            <div className="profile-section__header">
              <h2 className="profile-section__title"><Bell size={18} /> Alert Preferences</h2>
            </div>
            <p className="profile-section__desc">
              Choose how you want to receive updates about your complaints and collection vehicle arrivals.
            </p>
            <div className="notif-settings" id="notification-toggles">
              {[
                { key: 'sms',      label: 'SMS Alerts',      desc: 'Receive text messages for complaint updates.' },
                { key: 'push',     label: 'Push Notifications', desc: 'Browser or app notifications.' },
                { key: 'whatsapp', label: 'WhatsApp Alerts',  desc: 'Get updates on WhatsApp.' },
              ].map(n => (
                <div key={n.key} className="notif-row" id={`notif-${n.key}`}>
                  <div className="notif-row__info">
                    <div className="notif-row__label">{n.label}</div>
                    <div className="notif-row__desc">{n.desc}</div>
                  </div>
                  <label className="toggle-switch" aria-label={n.label}>
                    <input
                      type="checkbox"
                      checked={notifications[n.key]}
                      onChange={() => toggleNotif(n.key)}
                      id={`toggle-${n.key}`}
                    />
                    <span className="toggle-slider" />
                  </label>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              <button className="btn btn-primary btn-sm" id="save-notifications-btn" onClick={saveNotifications}>
                Save Preferences
              </button>
              {notifSaved && <span style={{ color: 'var(--color-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>✓ Saved</span>}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card profile-section" id="recent-activity">
            <div className="profile-section__header">
              <h2 className="profile-section__title">Recent Complaints</h2>
              <Link to="/my-reports" className="btn btn-secondary btn-sm" id="view-all-reports-btn">View All</Link>
            </div>
            {recentReports.map(r => (
              <Link to={`/track/${r.id}`} key={r.id} className="profile-report-row" id={`profile-report-${r.id}`}>
                <div>
                  <div className="profile-report-row__id">{r.id}</div>
                  <div className="profile-report-row__cat">{r.category} · {r.location.split(',')[0]}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <StatusBadge status={r.status} />
                  <ChevronRight size={16} style={{ color: 'var(--color-text-muted)' }} />
                </div>
              </Link>
            ))}
          </div>

        </div>

        {/* RIGHT COLUMN */}
        <div className="profile-sidebar">

          {/* Points */}
          <div className="card profile-points" id="civic-points">
            <div className="profile-points__label">Civic Participation Points</div>
            <div className="profile-points__value">{user.points}</div>
            <p className="profile-points__desc">
              Earned by reporting issues and providing feedback. Points show your civic participation.
            </p>
          </div>

          {/* Badges */}
          <div className="card profile-section" id="badges-section" style={{ marginTop: 16 }}>
            <h3 className="profile-section__title" style={{ marginBottom: 12 }}>
              <Award size={18} /> Badges Earned
            </h3>
            {user.badges.length === 0 ? (
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                No badges yet. Start reporting to earn your first badge!
              </p>
            ) : (
              <div className="badges-list">
                {user.badges.map(badge => {
                  const b = BADGES[badge] || { icon: '🏅', desc: badge };
                  return (
                    <div key={badge} className="badge-item" id={`badge-${badge.replace(/\s+/g, '-').toLowerCase()}`}>
                      <span className="badge-item__icon">{b.icon}</span>
                      <div>
                        <div className="badge-item__name">{badge}</div>
                        <div className="badge-item__desc">{b.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sign Out */}
          <div className="card" style={{ marginTop: 16, textAlign: 'center' }}>
            <button
              className="btn btn-danger btn-sm btn-full"
              id="sign-out-btn"
              onClick={() => { logout(); navigate('/'); }}
            >
              Sign Out
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
