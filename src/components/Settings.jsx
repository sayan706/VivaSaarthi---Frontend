import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

export default function Settings() {
  const { user, login } = useAuth(); // Need login to potentially refresh user context
  const { addNotification } = useNotification();
  
  const [subscription, setSubscription] = useState(null);
  const [loadingSub, setLoadingSub] = useState(true);
  
  // Initialize dark theme state based on current document class
  const [isDarkTheme, setIsDarkTheme] = useState(() => !document.documentElement.classList.contains('light'));
  const [isRenewing, setIsRenewing] = useState(false);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/subscription/current', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSubscription(data.subscription);
        }
      } catch (error) {
        console.error('Error fetching subscription:', error);
      } finally {
        setLoadingSub(false);
      }
    };
    fetchSubscription();
  }, []);

  const handleRenew = async () => {
    setIsRenewing(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/subscription/upgrade', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        addNotification(data.message || 'Plan renewed successfully!', 'success');
        
        // Since we update credits in backend, we should refetch or update context
        // We'll simulate a user context update by updating the credits field directly
        // Usually, a /me endpoint would be called to refresh user data.
        if (user) {
           user.credits_remaining = data.credits_remaining;
        }
        
        // Update subscription state instantly
        if (data.subscription) {
          setSubscription(data.subscription);
        }
      } else {
        addNotification('Failed to renew plan.', 'error');
      }
    } catch (error) {
      console.error(error);
      addNotification('Network error.', 'error');
    } finally {
      setIsRenewing(false);
    }
  };

  const handleSaveConfiguration = () => {
    if (isDarkTheme) {
      document.documentElement.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.add('light');
      localStorage.setItem('theme', 'light');
    }
    addNotification('Configuration saved successfully!', 'success');
  };

  return (
    <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop pb-margin-desktop">
      {/* Page Header */}
      <div className="mb-stack-lg flex flex-col md:flex-row md:items-end justify-between gap-4 mt-8 md:mt-0">
        <div>
          <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface font-semibold tracking-tight">Configuration Center</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-2">Manage your profile, AI mentor preferences, and system settings.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 rounded-md font-label-md text-label-md text-on-surface-variant hover:text-on-surface transition-colors">Discard Changes</button>
          <button 
            onClick={handleSaveConfiguration}
            className="px-6 py-2 rounded-md font-label-md text-label-md bg-primary text-on-primary-fixed shadow-[0_0_15px_rgba(79,219,200,0.2)] hover:shadow-[0_0_25px_rgba(79,219,200,0.4)] transition-all"
          >
            Save Configuration
          </button>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        
        {/* Column 1: Profile & Subscription */}
        <div className="lg:col-span-1 space-y-gutter">
          {/* Profile Card */}
          <section className="glass-card rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
            <h3 className="font-headline-md text-headline-md text-on-surface mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">person</span>
              Personal Details
            </h3>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                <img 
                  className="w-16 h-16 rounded-full object-cover border border-white/10" 
                  alt="Profile Avatar" 
                  src={user?.profile_image || "https://lh3.googleusercontent.com/aida-public/AB6AXuB6CeEgpTbQhXw1wzWZzdqcoX_VzG1Le3MeOCkL_3qPn5SqHRwJxNkd1Gqh1dULdr6_BBAOofhbUejdD3cyv349BppI6VaxJr9FLQoFNMwWe3Vz3wMd_C3i01jFHkYBxrUy1_ai1FPCbOOe-FgxezwcSBNeuGrIj3NHmCrRv42qD503JWhNBecVo2jl97qswCzQbjbfVfYouvC6wpTaUZBqitr2AzM8lSU0DEKC777fJXM0MLBURNaYjo0qTWD831Z9wnQj-3ks8z0"}
                />
                <button className="absolute -bottom-1 -right-1 bg-surface-variant rounded-full p-1 border border-white/10 hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                </button>
              </div>
              <div>
                <h4 className="font-body-lg text-body-lg text-on-surface font-medium">{user?.name || "User Name"}</h4>
                <p className="font-caption text-caption text-on-surface-variant">Credits: {user?.credits_remaining || 0}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="font-label-md text-label-md text-on-surface-variant mb-1 block">Full Name</label>
                <input 
                  className="w-full bg-surface-variant rounded-md px-3 py-2 font-body-md text-body-md text-on-surface border border-white/5" 
                  type="text" 
                  defaultValue={user?.name || ""} 
                  readOnly 
                />
              </div>
              <div>
                <label className="font-label-md text-label-md text-on-surface-variant mb-1 block">Email Address</label>
                <input 
                  className="w-full bg-surface-variant rounded-md px-3 py-2 font-body-md text-body-md text-on-surface border border-white/5" 
                  type="email" 
                  defaultValue={user?.email || ""} 
                  readOnly 
                />
              </div>
            </div>
          </section>

          {/* Subscription Card */}
          <section className="glass-card rounded-xl p-6 relative overflow-hidden group">
            <div className="absolute -right-20 -top-20 w-40 h-40 bg-tertiary-container/20 rounded-full blur-[50px] group-hover:bg-tertiary-container/30 transition-all duration-500"></div>
            <h3 className="font-headline-md text-headline-md text-on-surface mb-4 flex items-center gap-2 relative z-10">
              <span className="material-symbols-outlined text-tertiary">workspace_premium</span>
              Subscription
            </h3>
            
            <div className="relative z-10">
              {loadingSub ? (
                <div className="animate-pulse flex space-x-4">
                  <div className="h-4 bg-white/10 rounded w-3/4"></div>
                </div>
              ) : subscription ? (
                <>
                  <div className="inline-block px-3 py-1 rounded-full bg-tertiary/10 border border-tertiary/20 text-tertiary font-label-md text-caption mb-3 capitalize">
                    {subscription.status}
                  </div>
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="font-display-xl text-display-xl text-on-surface">Pro</span>
                    <span className="font-body-md text-body-md text-on-surface-variant">Active</span>
                  </div>
                  <p className="font-caption text-caption text-on-surface-variant mb-6">
                    Valid until: {new Date(subscription.end_date).toLocaleDateString()}
                  </p>
                </>
              ) : (
                <>
                  <div className="inline-block px-3 py-1 rounded-full bg-surface-variant border border-white/20 text-on-surface font-label-md text-caption mb-3">
                    Free Tier
                  </div>
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="font-display-xl text-display-xl text-on-surface">$0</span>
                    <span className="font-body-md text-body-md text-on-surface-variant">/ month</span>
                  </div>
                  <p className="font-caption text-caption text-on-surface-variant mb-6">Upgrade to unlock more AI credits.</p>
                </>
              )}

              <button 
                onClick={handleRenew}
                disabled={isRenewing}
                className="w-full bg-surface-variant border border-white/10 hover:border-tertiary/50 text-on-surface font-label-md text-label-md py-2 rounded-lg transition-all flex justify-center items-center gap-2"
              >
                {isRenewing ? 'Processing...' : 'Manage Billing & Renew Credits'}
              </button>
            </div>
          </section>
        </div>

        {/* Column 2 & 3: AI Co-pilot & System */}
        <div className="lg:col-span-2 space-y-gutter">

          {/* System Preferences */}
          <section className="glass-card rounded-xl p-6 relative overflow-hidden">
            <h3 className="font-headline-md text-headline-md text-on-surface mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary-container">tune</span>
              App Preferences
            </h3>
            
            <div className="space-y-6">
              {/* Theme Toggle */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <div className="font-body-md text-body-md text-on-surface font-medium">Dark Theme</div>
                  <div className="font-caption text-caption text-on-surface-variant">Recommended for focus and depth</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={isDarkTheme}
                    onChange={(e) => setIsDarkTheme(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-surface-bright peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
