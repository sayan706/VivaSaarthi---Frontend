import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

export default function Settings() {
  const { user, login, setUser } = useAuth(); // Need login to potentially refresh user context
  const { addNotification } = useNotification();
  
  const [subscription, setSubscription] = useState(null);
  const [loadingSub, setLoadingSub] = useState(true);
  
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const isPro = subscription && String(subscription.plan_id) !== '1';
  
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

  const handleImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      addNotification('File size must be less than 5MB', 'error');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/auth/profile-image', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        addNotification('Profile image updated successfully', 'success');
      } else {
        const errData = await response.json();
        addNotification(errData.message || 'Failed to upload image', 'error');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      addNotification('Network error while uploading image', 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-12 pb-12">
      {/* Page Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 mt-8 md:mt-0">
        <div>
          <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface font-semibold tracking-tight">Configuration Center</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-2">Manage your profile, AI mentor preferences, and system settings.</p>
        </div>

      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Column 1: Profile & Subscription */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Card */}
          <section className="bg-white shadow-sm border border-gray-100 rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
            <h3 className="font-headline-md text-headline-md text-on-surface mb-6 flex items-center gap-2">
              <i className="ph ph-user text-teal-600"></i>
              Personal Details
            </h3>
            
              <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                {isUploading && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 rounded-full">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                )}
                <img 
                  className="w-16 h-16 rounded-full object-cover border border-gray-200" 
                  alt="Profile Avatar" 
                  src={user?.profile_image || "https://lh3.googleusercontent.com/aida-public/AB6AXuB6CeEgpTbQhXw1wzWZzdqcoX_VzG1Le3MeOCkL_3qPn5SqHRwJxNkd1Gqh1dULdr6_BBAOofhbUejdD3cyv349BppI6VaxJr9FLQoFNMwWe3Vz3wMd_C3i01jFHkYBxrUy1_ai1FPCbOOe-FgxezwcSBNeuGrIj3NHmCrRv42qD503JWhNBecVo2jl97qswCzQbjbfVfYouvC6wpTaUZBqitr2AzM8lSU0DEKC777fJXM0MLBURNaYjo0qTWD831Z9wnQj-3ks8z0"}
                />
                <button 
                  onClick={handleImageClick}
                  disabled={isUploading}
                  className="absolute -bottom-1 -right-1 bg-gray-50 rounded-full p-1 border border-gray-200 hover:text-primary transition-colors cursor-pointer z-20"
                  title="Change Profile Picture"
                >
                  <i className="ph ph-pencil-simple text-[16px]"></i>
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/png, image/jpeg, image/jpg, image/gif, image/webp" 
                  onChange={handleFileChange} 
                />
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
                  className="w-full bg-gray-50 rounded-md px-3 py-2 font-body-md text-body-md text-on-surface border border-white/5" 
                  type="text" 
                  defaultValue={user?.name || ""} 
                  readOnly 
                />
              </div>
              <div>
                <label className="font-label-md text-label-md text-on-surface-variant mb-1 block">Email Address</label>
                <input 
                  className="w-full bg-gray-50 rounded-md px-3 py-2 font-body-md text-body-md text-on-surface border border-white/5" 
                  type="email" 
                  defaultValue={user?.email || ""} 
                  readOnly 
                />
              </div>
            </div>
          </section>

        </div>

        {/* Column 2 & 3: Subscription & Billing */}
        <div className="lg:col-span-2 space-y-6">
          {/* Subscription Card Moved Here For Cooler Layout */}
          <section className={`rounded-xl p-8 relative overflow-hidden group transition-all duration-300 flex flex-col md:flex-row items-center justify-between gap-6 ${isPro ? 'bg-gray-50 border border-tertiary/30 shadow-[0_0_20px_rgba(20,184,166,0.1)]' : 'bg-white shadow-sm border border-gray-100'}`}>
            {isPro ? (
              <div className="absolute -right-20 -top-20 w-64 h-64 bg-tertiary-container/20 rounded-full blur-[60px] group-hover:bg-tertiary-container/30 transition-all duration-500"></div>
            ) : (
              <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-[60px] transition-all duration-500"></div>
            )}
            
            <div className="relative z-10 flex-1 w-full">
              <h3 className="font-headline-md text-headline-md text-on-surface mb-2 flex items-center gap-2">
                <span className={`material-symbols-outlined ${isPro ? 'text-tertiary' : 'text-on-surface-variant'}`}>workspace_premium</span>
                Subscription & Billing
              </h3>
              <p className="text-on-surface-variant font-body-md text-body-md mb-6">Manage your plan, check your credit usage, and renew your subscription.</p>
              
              <div className="flex items-center gap-4 mb-2">
                 {loadingSub ? (
                  <div className="animate-pulse flex space-x-4">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </div>
                ) : subscription ? (
                  <>
                    <span className="font-display-xl text-display-xl text-on-surface">{isPro ? 'Pro Plan' : 'Free Plan'}</span>
                    <div className={`px-3 py-1 rounded-full border font-label-md text-caption capitalize ${isPro ? 'bg-tertiary/10 border-tertiary/20 text-tertiary' : 'bg-gray-50 border-gray-200 text-on-surface'}`}>
                      {subscription.status}
                    </div>
                  </>
                ) : (
                  <>
                    <span className="font-display-xl text-display-xl text-on-surface">Free Tier</span>
                    <div className="px-3 py-1 rounded-full bg-gray-50 border border-gray-200 text-on-surface font-label-md text-caption">
                      No Active Plan
                    </div>
                  </>
                )}
              </div>
              
              {subscription ? (
                <p className="font-caption text-caption text-on-surface-variant">
                  Valid until: {new Date(subscription.end_date).toLocaleDateString()}
                </p>
              ) : (
                <p className="font-caption text-caption text-on-surface-variant">Upgrade to unlock more AI credits.</p>
              )}
            </div>

            <div className="relative z-10 w-full md:w-auto">
              <button 
                onClick={handleRenew}
                disabled={isRenewing}
                className={`w-full md:w-auto px-8 py-4 font-label-md text-label-md rounded-lg transition-all flex justify-center items-center gap-2 shadow-sm hover:shadow-md ${isPro ? 'bg-tertiary text-white hover:bg-tertiary/90' : 'bg-primary text-on-primary-fixed hover:bg-primary/90'}`}
              >
                {isRenewing ? (
                  <><i className="ph ph-spinner animate-spin"></i> Processing...</>
                ) : (
                  <><i className="ph ph-lightning"></i> Manage & Renew Credits</>
                )}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
