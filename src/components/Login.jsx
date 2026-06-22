import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setIsSubmitting(true);
    const result = await login(email, password);
    setIsSubmitting(false);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#0b1326] relative overflow-hidden font-body-md text-on-surface">
      {/* Dynamic Animated Background Mesh */}
      <div className="absolute inset-0 z-0 opacity-30">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px] animate-[pulse_6s_infinite_alternate]" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[60%] h-[60%] rounded-full bg-tertiary-container/15 blur-[150px] animate-[pulse_8s_infinite_alternate_reverse]" />
      </div>

      {/* Left Panel: High Fidelity Tech Graphic (Desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative z-10 border-r border-white/5 bg-gradient-to-b from-[#060e20] to-[#0b1326]">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain drop-shadow-[0_0_10px_rgba(79,219,200,0.5)]" />
          <span className="font-headline-md text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-fixed text-glow">
            VivaSaarthi
          </span>
        </div>

        {/* Floating Widgets Canvas */}
        <div className="my-auto space-y-8 max-w-lg">
          <h1 className="font-display-xl text-5xl font-bold leading-tight tracking-tight text-on-surface">
            Elevate Your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary-fixed to-secondary text-glow">
              Interview Readiness
            </span>
          </h1>
          <p className="text-body-lg text-on-surface-variant leading-relaxed">
            Practice structural system design, coding algorithms, and behavioral patterns with real-time telemetry and customized AI assessments.
          </p>

          {/* Interactive Floating Feedback Dashboard Widget */}
          <div className="glass-card rounded-2xl p-6 border border-white/10 space-y-4 hover:border-primary/30 hover:shadow-[0_0_30px_rgba(79,219,200,0.15)] transition-all duration-500 transform hover:-translate-y-1">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <span className="font-bold text-sm tracking-wide text-primary flex items-center gap-2">
                <span className="material-symbols-outlined animate-pulse">analytics</span>
                REALTIME INSIGHTS
              </span>
              <span className="text-xs text-on-surface-variant font-mono">ID: 868-VSA</span>
            </div>
            
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-on-surface-variant">System Design Rigor</span>
                  <span className="text-primary font-bold">88%</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full w-[88%] shadow-[0_0_10px_rgba(79,219,200,0.8)]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-on-surface-variant">Confidence Index</span>
                  <span className="text-secondary font-bold">92%</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-secondary rounded-full w-[92%] shadow-[0_0_10px_rgba(192,193,255,0.8)]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-on-surface-variant">Communication Clarity</span>
                  <span className="text-tertiary font-bold">75%</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-tertiary rounded-full w-[75%] shadow-[0_0_10px_rgba(219,184,255,0.8)]" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-xs text-on-surface-variant">
          &copy; {new Date().getFullYear()} VivaSaarthi AI. Powered by Advanced Intelligence.
        </div>
      </div>

      {/* Right Panel: Beautiful Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-10">
        {/* Mobile Header Logo */}
        <div className="absolute top-6 left-6 flex items-center gap-2 lg:hidden">
          <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
          <span className="font-headline-md text-xl font-bold text-primary">VivaSaarthi</span>
        </div>

        <div className="w-full max-w-md bg-[#131b2e]/60 backdrop-blur-xl border border-white/10 rounded-[28px] p-8 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col gap-6 relative">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-headline-lg font-bold tracking-tight text-on-surface">
              Welcome Back
            </h2>
            <p className="text-sm text-on-surface-variant">
              Access your personalized dashboard & prep center.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="p-4 bg-error-container/20 border border-error/30 text-error rounded-xl text-sm flex items-center gap-2 animate-[shake_0.4s_ease-in-out]">
                <span className="material-symbols-outlined text-[20px] flex-shrink-0">error</span>
                <span>{error}</span>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-on-surface-variant ml-1 uppercase tracking-wider">
                Work Email
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors text-[20px]">
                  mail
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-[#0b1326]/40 border border-white/10 hover:border-white/20 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 rounded-xl py-3.5 pl-10 pr-4 text-on-surface font-body-md placeholder:text-on-surface-variant/40 outline-none transition-all duration-200"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  Password
                </label>
                <a href="#forgot" className="text-xs text-primary hover:text-primary-fixed transition-colors">
                  Forgot?
                </a>
              </div>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors text-[20px]">
                  lock
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0b1326]/40 border border-white/10 hover:border-white/20 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 rounded-xl py-3.5 pl-10 pr-10 text-on-surface font-body-md placeholder:text-on-surface-variant/40 outline-none transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 w-full bg-gradient-to-r from-primary to-primary-container text-on-primary-fixed font-bold py-3.5 rounded-xl shadow-[0_5px_15px_rgba(79,219,200,0.2)] hover:shadow-[0_8px_25px_rgba(79,219,200,0.4)] hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-on-primary-fixed" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Verifying Session...</span>
                </>
              ) : (
                <>
                  <span>Access Prep Center</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 py-2">
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-xs text-on-surface-variant tracking-wider uppercase">Don't have credentials?</span>
            <div className="flex-1 h-px bg-white/5" />
          </div>

          {/* Link to Signup */}
          <Link
            to="/signup"
            className="w-full text-center py-3 border border-white/5 hover:border-primary/20 bg-white/5 hover:bg-primary/5 rounded-xl font-bold text-sm text-on-surface transition-all duration-300 flex items-center justify-center gap-2"
          >
            <span>Create New Account</span>
            <span className="material-symbols-outlined text-[16px]">person_add</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
