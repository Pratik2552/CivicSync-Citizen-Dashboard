import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get('tab') === 'register' ? 'register' : 'login');
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  // Login state
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register state
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regLocality, setRegLocality] = useState('');
  const [regSuccess, setRegSuccess] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    const ok = await login(phone, password);
    if (ok) navigate('/profile');
    else setLoginError('Invalid phone number or password. Please try again.');
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    // Simulate registration API call
    await new Promise(r => setTimeout(r, 800));
    setRegSuccess(true);
    setTimeout(() => { setTab('login'); setRegSuccess(false); }, 2500);
  };

  return (
    <div className="page-wrapper login-page">
      <div className="container login-container">
        <div className="login-brand">
          <div className="login-brand__logo">♻</div>
          <div>
            <div className="login-brand__name">CivicSync</div>
            <div className="login-brand__sub">Smart Waste Management</div>
          </div>
        </div>

        <div className="login-card card" id="login-card">
          {/* Tabs */}
          <div className="login-tabs" role="tablist">
            <button
              className={`login-tab ${tab === 'login' ? 'login-tab--active' : ''}`}
              role="tab"
              aria-selected={tab === 'login'}
              id="login-tab-btn"
              onClick={() => setTab('login')}
            >
              Sign In
            </button>
            <button
              className={`login-tab ${tab === 'register' ? 'login-tab--active' : ''}`}
              role="tab"
              aria-selected={tab === 'register'}
              id="register-tab-btn"
              onClick={() => setTab('register')}
            >
              Register
            </button>
          </div>

          {/* Login Form */}
          {tab === 'login' && (
            <form className="login-form" onSubmit={handleLogin} id="login-form">
              <p className="login-form__desc">
                Sign in with your registered mobile number to track and manage your complaints.
              </p>
              {loginError && <div className="alert alert-error" id="login-error">{loginError}</div>}
              <div className="form-group">
                <label className="form-label" htmlFor="login-phone">Mobile Number <span>*</span></label>
                <input
                  id="login-phone"
                  className="form-input"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  required
                  autoComplete="tel"
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="login-password">Password <span>*</span></label>
                <input
                  id="login-password"
                  className="form-input"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
              <div className="login-form__forgot">
                <a href="#" className="login-form__link">Forgot password?</a>
              </div>
              <button
                type="submit"
                className="btn btn-primary btn-lg btn-full"
                id="login-submit-btn"
                disabled={loading}
              >
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
              <p className="login-form__demo">
                <strong>Demo:</strong> Enter any phone/password to log in with a sample account.
              </p>
              <p className="login-form__switch">
                New to CivicSync?{' '}
                <button type="button" className="login-form__link" onClick={() => setTab('register')} id="switch-to-register-btn">
                  Create an account
                </button>
              </p>
            </form>
          )}

          {/* Register Form */}
          {tab === 'register' && (
            <form className="login-form" onSubmit={handleRegister} id="register-form">
              <p className="login-form__desc">
                Register with your mobile number to report garbage problems and track complaints.
              </p>
              {regSuccess && (
                <div className="alert alert-success" id="register-success-msg">
                  Registration successful! Redirecting to sign in…
                </div>
              )}
              <div className="form-group">
                <label className="form-label" htmlFor="reg-name">Full Name <span>*</span></label>
                <input
                  id="reg-name"
                  className="form-input"
                  placeholder="Priya Sharma"
                  value={regName}
                  onChange={e => setRegName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-phone">Mobile Number <span>*</span></label>
                <input
                  id="reg-phone"
                  className="form-input"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={regPhone}
                  onChange={e => setRegPhone(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-email">Email Address</label>
                <input
                  id="reg-email"
                  className="form-input"
                  type="email"
                  placeholder="you@email.com"
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-locality">Locality / Ward <span>*</span></label>
                <input
                  id="reg-locality"
                  className="form-input"
                  placeholder="e.g. Deccan, Pune"
                  value={regLocality}
                  onChange={e => setRegLocality(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-password">Create Password <span>*</span></label>
                <input
                  id="reg-password"
                  className="form-input"
                  type="password"
                  placeholder="Minimum 8 characters"
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary btn-lg btn-full"
                id="register-submit-btn"
              >
                Create Account
              </button>
              <p className="login-form__switch">
                Already registered?{' '}
                <button type="button" className="login-form__link" onClick={() => setTab('login')} id="switch-to-login-btn">
                  Sign in here
                </button>
              </p>
            </form>
          )}
        </div>

        <div className="login-info">
          <p>
            CivicSync is the official digital waste management portal.<br />
            Your data is protected under the <a href="#">Municipal Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
