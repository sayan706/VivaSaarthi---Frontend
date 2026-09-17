import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBilling } from '../context/BillingContext';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import '../assets/styles/dashboard.css'; // New Dashboard UI styles

export default function Layout({ children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();
  const { credits } = useBilling();
  
  const [sidebarVisible, setSidebarVisible] = useState(true);

  // Refs for GSAP animation
  const indicatorDesktopRef = useRef(null);
  const navItemsRef = useRef([]);
  const navContainerRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleToggle = (e) => setSidebarVisible(e.detail);
    window.addEventListener('toggle-sidebar', handleToggle);
    return () => window.removeEventListener('toggle-sidebar', handleToggle);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { name: 'Dashboard', icon: 'ph-house', path: '/' },
    { name: 'Live Interview', icon: 'ph-video-camera', path: '/live-interview' },
    { name: 'Interview Reports', icon: 'ph-chart-bar', path: '/interview-report' },
    { name: 'Billing & Usage', icon: 'ph-wallet', path: '/billing' },
    { name: 'Settings', icon: 'ph-gear', path: '/settings' },
  ];

  // GSAP Entrance Animation
  useGSAP(() => {
    const tl = gsap.timeline();

    tl.from(".dashboard-wrapper", {
      y: 40,
      opacity: 0,
      duration: 1,
      ease: "power3.out"
    });

    tl.from(".sidebar", {
      x: -20,
      opacity: 0,
      duration: 0.6,
      ease: "power2.out"
    }, "-=0.5")
    .from(".logo", {
      scale: 0.5,
      opacity: 0,
      duration: 0.4,
      ease: "back.out(1.5)"
    }, "-=0.3")
    .from(".nav-link", {
      x: -10,
      opacity: 0,
      duration: 0.4,
      stagger: 0.05,
      ease: "power1.out"
    }, "-=0.2");

    tl.from(".top-header", {
      y: -15,
      opacity: 0,
      duration: 0.5,
      ease: "power2.out"
    }, "-=0.4");
  }, { scope: wrapperRef });

  // GSAP Animation for Sidebar Indicator
  useEffect(() => {
    const activeIndex = navLinks.findIndex(
      (link) => location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path))
    );

    if (activeIndex !== -1 && navItemsRef.current[activeIndex]) {
      const activeLink = navItemsRef.current[activeIndex];
      const offsetTop = activeLink.offsetTop;

      if (indicatorDesktopRef.current) {
        gsap.to(indicatorDesktopRef.current, {
          top: offsetTop,
          duration: 0.4,
          ease: "power2.out"
        });
      }

      // Content reveal animation on route change
      gsap.fromTo(".gs-reveal",
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: "power1.out", overwrite: true }
      );
    }
  }, [location.pathname]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="dashboard-wrapper" ref={wrapperRef}>
      <div className="dashboard">
        {/* Sidebar Overlay (mobile only) */}
        <div
          className={`sidebar-overlay ${isMobileMenuOpen ? 'active' : ''}`}
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>

        {/* Sidebar */}
        {sidebarVisible && (
          <nav className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
            <div className="logo">
              <img src="/VivaSaarthi-logo.png" alt="VivaSaarthi Logo" />
              <div className="logo-text">
                <div className="logo-title">VivaSaarthi</div>
                <div className="logo-subtitle">An Ultimate AI<br/>Interview Coach</div>
              </div>
            </div>
            
            <div className="nav-items" ref={navContainerRef}>
              {/* Desktop Curve Indicator */}
              <div className="nav-indicator-desktop" ref={indicatorDesktopRef}>
                <div className="curve-top"></div>
                <div className="curve-bottom"></div>
              </div>

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
                    <span className="nav-label">{link.name}</span>
                  </Link>
                );
              })}
            </div>

            <a href="#" onClick={(e) => { e.preventDefault(); logout(); }} className="nav-link logout" title="Logout">
              <i className="ph ph-sign-out"></i>
              <span className="nav-label">Logout</span>
            </a>
          </nav>
        )}

        {/* Main Content Area */}
        <main 
          className={`main-content overflow-x-hidden ${
            !sidebarVisible 
              ? '!ml-0 !max-w-full !h-screen !p-2 md:!p-4 bg-gray-50/50 flex flex-col items-center justify-center overflow-hidden' 
              : ''
          }`}
        >
          {/* Mobile Top Navbar */}
          {sidebarVisible && (
            <div className="mobile-top-navbar">
              <div className="mobile-logo">
                <img src="/VivaSaarthi-logo.png" alt="VivaSaarthi Logo" />
                <div className="logo-text">
                  <div className="logo-title">VivaSaarthi</div>
                  <div className="logo-subtitle">AI Interview Coach</div>
                </div>
              </div>
              <button
                className="p-1 rounded-md active:bg-gray-100 transition-colors"
                onClick={toggleMobileMenu}
                aria-label="Toggle Menu"
              >
                <i className={`ph ${isMobileMenuOpen ? 'ph-x' : 'ph-list'} text-[32px] text-[#0E3386]`}></i>
              </button>
            </div>
          )}

          {/* Top Header */}
          {sidebarVisible && (
            <header className="top-header hidden md:flex" style={{ marginBottom: '16px', justifyContent: 'flex-end' }}>
              <div className="header-right">
                {user && (
                <div className="profile">
                  <div className="profile-text">
                    <span className="name text-sm md:text-base">{user.name}</span>
                    <span className="role text-xs">{credits} Credits</span>
                  </div>
                  {/* Mobile Logout */}
                  <button 
                    onClick={(e) => { e.preventDefault(); logout(); }}
                    className="md:hidden ml-2 flex items-center justify-center w-9 h-9 bg-red-50 hover:bg-red-100 text-red-600 rounded-full border border-red-100 transition-colors shadow-sm"
                    title="Logout"
                  >
                    <i className="ph ph-sign-out text-lg"></i>
                  </button>
                </div>
                )}
              </div>
            </header>
          )}

          {/* Render Page Content */}
          <div className="gs-reveal">
            {children}
          </div>

        </main>
      </div>
    </div>
  );
}
