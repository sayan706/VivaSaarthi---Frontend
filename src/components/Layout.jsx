import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBilling } from '../context/BillingContext';
import gsap from 'gsap';
import '../assets/styles/dashboard.css'; // New Dashboard UI styles

export default function Layout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();
  const { credits } = useBilling();
  
  const [sidebarVisible, setSidebarVisible] = useState(true);

  // Refs for GSAP animation
  const indicatorDesktopRef = useRef(null);
  const indicatorMobileRef = useRef(null);
  const navItemsRef = useRef([]);

  useEffect(() => {
    const handleToggle = (e) => setSidebarVisible(e.detail);
    window.addEventListener('toggle-sidebar', handleToggle);
    return () => window.removeEventListener('toggle-sidebar', handleToggle);
  }, []);

  const navLinks = [
    { name: 'Dashboard', icon: 'ph-house', path: '/' },
    { name: 'Live Interview', icon: 'ph-video-camera', path: '/live-interview' },
    { name: 'Interview Reports', icon: 'ph-chart-bar', path: '/interview-report' },
    { name: 'Billing & Usage', icon: 'ph-wallet', path: '/billing' },
    { name: 'Settings', icon: 'ph-gear', path: '/settings' },
  ];

  // GSAP Animation for Sidebar Indicator
  useEffect(() => {
    const activeIndex = navLinks.findIndex(
      (link) => location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path))
    );

    if (activeIndex !== -1 && navItemsRef.current[activeIndex]) {
      const activeLink = navItemsRef.current[activeIndex];
      const linkRect = activeLink.getBoundingClientRect();
      const parentRect = activeLink.parentElement.getBoundingClientRect();
      
      const offsetTop = linkRect.top - parentRect.top;
      const offsetLeft = linkRect.left - parentRect.left;

      if (window.innerWidth > 768) {
        gsap.to(indicatorDesktopRef.current, {
          y: offsetTop,
          duration: 0.5,
          ease: "power3.out"
        });
      } else {
        gsap.to(indicatorMobileRef.current, {
          x: offsetLeft + (linkRect.width / 2) - 23, // 46/2 = 23 (half of circle width)
          duration: 0.4,
          ease: "power2.out"
        });
      }
    }
  }, [location.pathname]);

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard">
        {/* Sidebar */}
        {sidebarVisible && (
          <nav className="sidebar">
            <div className="logo">
              <img src="/logo.png" alt="VivaSaarthi Logo" />
              <div className="logo-text">
                <div className="logo-title">VivaSaarthi</div>
                <div className="logo-subtitle">An Ultimate AI<br/>Interview Coach</div>
              </div>
            </div>
            
            <div className="nav-items relative">
              {/* Desktop Curve Indicator */}
              <div className="nav-indicator-desktop" ref={indicatorDesktopRef}>
                <div className="curve-top"></div>
                <div className="curve-bottom"></div>
              </div>
              
              {/* Mobile Circle Indicator */}
              <div className="nav-indicator-mobile" ref={indicatorMobileRef}></div>

              {navLinks.map((link, index) => {
                const isActive = location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path));
                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    ref={el => navItemsRef.current[index] = el}
                    className={`nav-link ${isActive ? 'active' : ''}`}
                    title={link.name}
                  >
                    <i className={`ph ${isActive ? 'ph-fill' : ''} ${link.icon}`}></i>
                  </Link>
                );
              })}
            </div>

            <a href="#" onClick={(e) => { e.preventDefault(); logout(); }} className="nav-link logout" title="Logout">
              <i className="ph ph-sign-out"></i>
            </a>
          </nav>
        )}

        {/* Main Content Area */}
        <main 
          className={`main-content ${
            !sidebarVisible 
              ? '!ml-0 !max-w-full !h-screen !p-4 bg-gray-50/50 flex flex-col items-center justify-center overflow-hidden' 
              : ''
          }`}
        >
          {/* Top Header */}
          {sidebarVisible && (
            <header className="top-header" style={{ marginBottom: '30px', justifyContent: 'flex-end' }}>
              <div className="header-right">
                {user && (
                <div className="profile">
                  <div className="profile-text">
                    <span className="name">{user.name}</span>
                    <span className="role">{credits} Credits</span>
                  </div>
                  {/* Mobile Logout */}
                  <button 
                    onClick={(e) => { e.preventDefault(); logout(); }}
                    className="md:hidden ml-4 flex items-center justify-center w-10 h-10 bg-red-50 hover:bg-red-100 text-red-600 rounded-full border border-red-100 transition-colors shadow-sm"
                    title="Logout"
                  >
                    <i className="ph ph-sign-out text-xl"></i>
                  </button>
                </div>
                )}
              </div>
            </header>
          )}

          {/* Render Page Content */}
          {children}

        </main>
      </div>
    </div>
  );
}
