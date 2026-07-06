import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const [isRightPanelActive, setIsRightPanelActive] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { login, signup } = useAuth();

  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Signup State
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupError, setSignupError] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);

  useEffect(() => {
    // If user navigates to /signup, set the panel right away
    if (location.pathname === '/signup') {
      setIsRightPanelActive(true);
    } else {
      setIsRightPanelActive(false);
    }
  }, [location.pathname]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    if (!loginEmail || !loginPassword) {
      setLoginError('Please fill in all fields.');
      return;
    }
    setIsLoggingIn(true);
    const result = await login(loginEmail, loginPassword);
    setIsLoggingIn(false);
    if (result.success) {
      navigate('/');
    } else {
      setLoginError(result.message);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setSignupError('');
    if (!signupName || !signupEmail || !signupPassword) {
      setSignupError('Please fill in all fields.');
      return;
    }
    if (signupPassword.length < 6) {
      setSignupError('Password must be at least 6 characters long.');
      return;
    }
    setIsSigningUp(true);
    const result = await signup(signupName, signupEmail, signupPassword);
    setIsSigningUp(false);
    if (result.success) {
      navigate('/');
    } else {
      setSignupError(result.message);
    }
  };

  const togglePanel = () => {
    setIsRightPanelActive(!isRightPanelActive);
    // Optionally update URL without reloading
    navigate(isRightPanelActive ? '/login' : '/signup', { replace: true });
  };

  return (
    <div className="auth-page-wrapper">
      {/* Top Left Logo */}
      <div className="top-left-logo">
        <img src="/logo.png" alt="Logo" />
        <span className="logo-text-top">VivaSaarthi</span>
      </div>

      {/* Giant Background Text */}
      <div className="bg-text">VivaSaarthi</div>

      <div className={`container ${isRightPanelActive ? 'right-panel-active' : ''}`} id="container">
        
        {/* Sign Up Form */}
        <div className="form-container sign-up-container">
          <form onSubmit={handleSignup}>
            <h1>Create Account</h1>
            <div className="social-container">
              <a href="#" className="social"><i className="ph-fill ph-facebook-logo"></i></a>
              <a href="#" className="social"><i className="ph-fill ph-google-logo"></i></a>
              <a href="#" className="social"><i className="ph-fill ph-linkedin-logo"></i></a>
            </div>
            <span>or use your email for registration</span>
            
            {signupError && <p className="text-red-500 text-xs mt-2">{signupError}</p>}
            
            <input type="text" placeholder="Name" value={signupName} onChange={(e) => setSignupName(e.target.value)} />
            <input type="email" placeholder="Email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} />
            <input type="password" placeholder="Password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} />
            <button type="submit" className="action-btn" disabled={isSigningUp}>
              {isSigningUp ? 'Signing Up...' : 'Sign Up'}
            </button>
          </form>
          {/* Mobile Toggle */}
          <div className="mobile-toggle d-mobile-only">
            <p>Already have an account?</p>
            <button className="ghost" onClick={togglePanel}>Sign In</button>
          </div>
        </div>

        {/* Sign In Form */}
        <div className="form-container sign-in-container">
          <form onSubmit={handleLogin}>
            <h1>Sign in</h1>
            <div className="social-container">
              <a href="#" className="social"><i className="ph-fill ph-facebook-logo"></i></a>
              <a href="#" className="social"><i className="ph-fill ph-google-logo"></i></a>
              <a href="#" className="social"><i className="ph-fill ph-linkedin-logo"></i></a>
            </div>
            <span>or use your account</span>
            
            {loginError && <p className="text-red-500 text-xs mt-2">{loginError}</p>}
            
            <input type="email" placeholder="Email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
            <input type="password" placeholder="Password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
            <a href="#" className="forgot-password">Forgot your password?</a>
            <button type="submit" className="action-btn" disabled={isLoggingIn}>
              {isLoggingIn ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
          {/* Mobile Toggle */}
          <div className="mobile-toggle d-mobile-only">
            <p>Don't have an account?</p>
            <button className="ghost" onClick={togglePanel}>Sign Up</button>
          </div>
        </div>

        {/* Overlay Container for Animation */}
        <div className="overlay-container">
          <div className="overlay">
            {/* Left Overlay (visible when Sign Up is active) */}
            <div className="overlay-panel overlay-left">
              <img src="/logo.png" className="login-logo" alt="VivaSaarthi Logo" />
              <h1>Welcome Back!</h1>
              <p>To keep connected with us please login with your personal info</p>
              <button className="ghost" onClick={togglePanel}>Sign In</button>
            </div>
            {/* Right Overlay (visible when Sign In is active) */}
            <div className="overlay-panel overlay-right">
              <img src="/logo.png" className="login-logo" alt="VivaSaarthi Logo" />
              <h1>Hello, Student!</h1>
              <p>Enter your personal details and start journey with us</p>
              <button className="ghost" onClick={togglePanel}>Sign Up</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
