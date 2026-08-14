import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get('tab') === 'register' ? 'register' : 'login');
  const { login, register, loading } = useAuth();
  const navigate = useNavigate();

  // Login state (email/password matching backend)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register state (full_name, email, password matching backend)
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState(false);

  // Handle Citizen Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');

    const res = await login(email, password);
    if (res.success) {
      navigate('/profile');
    } else {
      setLoginError(res.error || 'Invalid email or password. Please try again.');
    }
  };

  // Handle Citizen Registration
  const handleRegister = async (e) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess(false);

    const res = await register({
      full_name: regName,
      email: regEmail,
      password: regPassword,
    });

    if (res.success) {
      setRegSuccess(true);
      setTimeout(() => {
        setTab('login');
        setRegSuccess(false);
        setEmail(regEmail); // Pre-fill login email field
      }, 2000);
    } else {
      setRegError(res.error || 'Registration failed. Please try again.');
    }
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
              onClick={() => { setTab('login'); setLoginError(''); }}
            >
              Sign In
            </button>
            <button
              className={`login-tab ${tab === 'register' ? 'login-tab--active' : ''}`}
              role="tab"
              aria-selected={tab === 'register'}
              id="register-tab-btn"
              onClick={() => { setTab('register'); setRegError(''); }}
            >
              Register
            </button>
          </div>

          {/* Login Form */}
          {tab === 'login' && (
            <form className="login-form" onSubmit={handleLogin} id="login-form">
              <p className="login-form__desc">
                Sign in with your email address to track and manage your complaints.
              </p>
              
              {loginError && <div className="alert alert-error" id="login-error">{loginError}</div>}

              <div className="form-group">
                <label className="form-label" htmlFor="login-email">Email Address <span>*</span></label>
                <input
                  id="login-email"
                  className="form-input"
                  type="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
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

              <p className="login-form__switch">
                New to CivicSync?{' '}
                <button
                  type="button"
                  className="login-form__link"
                  onClick={() => { setTab('register'); setRegError(''); }}
                  id="switch-to-register-btn"
                >
                  Create an account
                </button>
              </p>
            </form>
          )}

          {/* Register Form */}
          {tab === 'register' && (
            <form className="login-form" onSubmit={handleRegister} id="register-form">
              <p className="login-form__desc">
                Register with your email to report garbage problems and track complaints.
              </p>

              {regSuccess && (
                <div className="alert alert-success" id="register-success-msg">
                  Registration successful! Redirecting to sign in…
                </div>
              )}

              {regError && (
                <div className="alert alert-error" id="register-error-msg">
                  {regError}
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
                <label className="form-label" htmlFor="reg-email">Email Address <span>*</span></label>
                <input
                  id="reg-email"
                  className="form-input"
                  type="email"
                  placeholder="you@email.com"
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
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
                disabled={loading}
              >
                {loading ? 'Creating Account…' : 'Create Account'}
              </button>

              <p className="login-form__switch">
                Already registered?{' '}
                <button
                  type="button"
                  className="login-form__link"
                  onClick={() => { setTab('login'); setLoginError(''); }}
                  id="switch-to-login-btn"
                >
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