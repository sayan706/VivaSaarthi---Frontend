import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  const navLinks = [
    { name: 'Dashboard', icon: 'dashboard', path: '/' },
    { name: 'Settings', icon: 'settings', path: '/settings' },
    { name: 'Live Interview', icon: 'video_chat', path: '/live-interview' },
    { name: 'Interview Report', icon: 'analytics', path: '/interview-report' },
  ];

  return (
    <div className="bg-background text-on-surface font-body-md min-h-screen overflow-x-hidden antialiased selection:bg-primary/30 selection:text-primary">
      
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-surface-container border-b border-white/5 fixed w-full top-0 z-50 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
          <span className="font-headline-md font-bold text-primary">VivaSaarthi</span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-on-surface-variant">
          <span className="material-symbols-outlined">{mobileMenuOpen ? 'close' : 'menu'}</span>
        </button>
      </div>

      {/* SideNavBar */}
      <nav className={`${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 bg-surface-container/40 backdrop-blur-3xl w-72 h-screen fixed left-0 top-0 border-r border-white/10 shadow-[0px_20px_50px_rgba(0,0,0,0.5)] flex flex-col gap-4 py-8 z-40`}>
        {/* Header */}
        <div className="px-6 mb-8 mt-12 md:mt-0">
          <div className="flex items-center gap-2 mb-2">
            <img alt="VivaSaarthi Logo" className="w-10 h-10 object-contain" src="/logo.png" />
            <span className="font-headline-md text-xl font-bold text-primary">VivaSaarthi</span>
          </div>
          <p className="text-xs text-on-surface-variant uppercase tracking-wider">AI Interview Co-pilot</p>
        </div>

        {/* Primary CTA */}
        <div className="px-6 mb-4">
          <Link
            to="/live-interview"
            className="w-full bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold text-sm py-3 rounded-lg shadow-[0px_0px_20px_rgba(20,184,166,0.15)] hover:shadow-[0px_0px_25px_rgba(20,184,166,0.3)] transition-all duration-300 flex items-center justify-center gap-2 scale-95 active:scale-90"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span>
            Start New Session
          </Link>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-6 flex flex-col gap-2">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path));
            return (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-bold text-sm transition-all duration-300 ${
                  isActive
                    ? 'text-primary border-r-2 border-primary bg-primary/10'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5 scale-95 active:scale-90'
                }`}
              >
                <span className="material-symbols-outlined">{link.icon}</span>
                {link.name}
              </Link>
            );
          })}
        </div>

        {/* Log Out Button */}
        <div className="px-6 mt-auto border-t border-white/5 pt-4 mb-4">
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              logout();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-bold text-sm text-error hover:bg-error/10 hover:text-error transition-all duration-300 scale-95 active:scale-90 cursor-pointer"
          >
            <span className="material-symbols-outlined">logout</span>
            Log Out
          </button>
        </div>
      </nav>

      {/* TopNavBar */}
      <header className="fixed top-0 right-0 w-[calc(100%-288px)] z-30 bg-background/80 backdrop-blur-md border-b border-white/5 shadow-sm hidden md:flex justify-between items-center px-6 h-20">
        <div className="flex-1 max-w-md">
          <div className="relative focus-within:ring-1 focus-within:ring-primary/50 rounded-lg">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
            <input className="w-full bg-surface-container/50 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-on-surface focus:outline-none focus:border-primary/50 transition-colors text-sm placeholder:text-on-surface-variant/50" placeholder="Search sessions, reports..." type="text" />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="bg-surface-variant/50 hover:bg-surface-variant text-primary font-bold text-sm px-4 py-2 rounded-lg border border-primary/20 hover:border-primary/50 transition-all duration-300 flex items-center gap-2">
            <span className="material-symbols-outlined">bolt</span>
            Quick Interview
          </button>
          <div className="flex items-center gap-2 text-on-surface-variant">
            <button className="p-2 hover:text-primary transition-colors hover:bg-white/5 rounded-full relative">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full animate-pulse"></span>
            </button>
            
            {user && (
              <span className="text-xs font-bold text-on-surface-variant hidden md:inline ml-2 border border-white/10 bg-white/5 px-3 py-1.5 rounded-lg select-none">
                {user.name}
              </span>
            )}
            
            <button
              onClick={logout}
              className="p-2 text-on-surface-variant hover:text-error transition-colors hover:bg-error/10 rounded-full flex items-center gap-1 cursor-pointer"
              title="Log Out"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="md:pl-72 pt-20 md:pt-20 min-h-screen">
        {children}
      </main>
    </div>
  );
}
