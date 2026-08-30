import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import './LoginPage.css';

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get('tab') === 'register' ? 'register' : 'login');
  const { login, loginWithToken } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState(false);

  const [googleAuthAvailable, setGoogleAuthAvailable] = useState(true);

  // Load Google Auth Script for Google Sign-In
  useEffect(() => {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!googleClientId || googleClientId.trim() === '') {
      setGoogleAuthAvailable(false);
      return;
    }

    const initGoogleButton = (clientId) => {
      try {
        if (window.google?.accounts?.id) {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleGoogleResponse,
            error_callback: (err) => {
              console.warn('⚠️ Google Sign-In Origin Error (Requires Google Console setup):', err);
              setGoogleAuthAvailable(false);
            },
          });

          const btnElem = document.getElementById('google-signin-btn');
          if (btnElem) {
            btnElem.innerHTML = '';
            window.google.accounts.id.renderButton(
              btnElem,
              { theme: 'outline', size: 'large', width: '100%', text: 'continue_with' }
            );
          }
        }
      } catch (e) {
        console.warn('⚠️ Google Sign-In Init Exception:', e);
        setGoogleAuthAvailable(false);
      }
    };

    const loadGoogleScript = () => {
      if (window.google?.accounts?.id) {
        initGoogleButton(googleClientId);
        return;
      }
      if (document.getElementById('google-jssdk')) {
        setTimeout(() => initGoogleButton(googleClientId), 200);
        return;
      }

      const script = document.createElement('script');
      script.id = 'google-jssdk';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        initGoogleButton(googleClientId);
      };
      script.onerror = () => {
        console.warn('⚠️ Google JSSDK script failed to load.');
        setGoogleAuthAvailable(false);
      };
      document.body.appendChild(script);
    };

    loadGoogleScript();
  }, [tab]);

  // Handle Google OAuth Callback Response
  const handleGoogleResponse = async (response) => {
    if (!response.credential) return;
    setLoading(true);
    setLoginError('');
    setRegError('');

    try {
      const res = await api.googleAuth(response.credential);
      if (res.token) {
        localStorage.setItem('civicsync_token', res.token);
        if (loginWithToken) {
          await loginWithToken(res.token, res.user);
        }
        navigate('/profile');
      } else {
        setLoginError('Google authentication failed. Please try again.');
      }
    } catch (err) {
      setLoginError(err.message || 'Google authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Citizen Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        navigate('/profile');
      } else {
        setLoginError(result.error || 'Invalid email or password. Please try again.');
      }
    } catch (err) {
      console.error('❌ Login error:', err);
      setLoginError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Send OTP for Citizen Registration (REMOVED - Backend signup doesn't require OTP)
  // Backend citizenSignup creates user and sends confirmation email automatically
  
  // Handle Citizen Signup (Simplified - no OTP required)
  const handleRegister = async (e) => {
    e.preventDefault();
    setRegError('');
    setLoading(true);

    // Frontend validation
    if (!regName || regName.trim().length < 2) {
      setRegError('Please enter your full name (at least 2 characters).');
      setLoading(false);
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(regEmail)) {
      setRegError('Please enter a valid email address (e.g., anuj@gmail.com).');
      setLoading(false);
      return;
    }

    // Validate password
    if (regPassword.length < 6) {
      setRegError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    try {
      console.log('📝 Registering user:', { regName, regEmail });
      const res = await api.signup(regName, regEmail, regPassword);
      console.log('✅ Signup response:', res);

      setRegSuccess(true);
      
      // Signup successful - user needs to confirm email or can login directly
      // depending on Supabase email confirmation settings
      setTimeout(() => {
        setEmail(regEmail);
        setTab('login');
        setRegSuccess(false);
        setRegName('');
        setRegEmail('');
        setRegPassword('');
      }, 2000);
    } catch (err) {
      console.error('❌ Signup error:', err);
      setRegError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
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
              onClick={() => {
                setTab('login');
                setLoginError('');
              }}
            >
              Sign In
            </button>
            <button
              className={`login-tab ${tab === 'register' ? 'login-tab--active' : ''}`}
              role="tab"
              aria-selected={tab === 'register'}
              id="register-tab-btn"
              onClick={() => {
                setTab('register');
                setRegError('');
              }}
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
                  onChange={(e) => setEmail(e.target.value)}
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
                  onChange={(e) => setPassword(e.target.value)}
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

              {googleAuthAvailable && (
                <>
                  <div className="social-divider" style={{ textAlign: 'center', margin: '16px 0 12px 0', fontSize: '13px', color: 'var(--color-text-muted, #888)' }}>
                    <span>OR</span>
                  </div>
                  <div id="google-signin-btn" style={{ width: '100%', minHeight: '40px' }}></div>
                </>
              )}

              <p className="login-form__switch" style={{ marginTop: '16px' }}>
                New to CivicSync?{' '}
                <button
                  type="button"
                  className="login-form__link"
                  onClick={() => {
                    setTab('register');
                    setRegError('');
                  }}
                  id="switch-to-register-btn"
                >
                  Create an account
                </button>
              </p>
            </form>
          )}

          {/* Register Form */}
          {tab === 'register' && (
            <form
              className="login-form"
              onSubmit={handleRegister}
              id="register-form"
            >
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
                  onChange={(e) => setRegName(e.target.value)}
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
                  onChange={(e) => setRegEmail(e.target.value)}
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
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                  minLength={6}
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

              {googleAuthAvailable && (
                <>
                  <div className="social-divider" style={{ textAlign: 'center', margin: '16px 0 12px 0', fontSize: '13px', color: 'var(--color-text-muted, #888)' }}>
                    <span>OR</span>
                  </div>
                  <div id="google-signin-btn" style={{ width: '100%', minHeight: '40px' }}></div>
                </>
              )}

              <p className="login-form__switch" style={{ marginTop: '16px' }}>
                Already registered?{' '}
                <button
                  type="button"
                  className="login-form__link"
                  onClick={() => {
                    setTab('login');
                    setLoginError('');
                  }}
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