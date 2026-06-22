import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const BillingContext = createContext(null);

export const useBilling = () => useContext(BillingContext);

export function BillingProvider({ children }) {
  const { user } = useAuth();
  const [credits, setCredits] = useState(0);
  const [maxCredits, setMaxCredits] = useState(100);
  const [subscription, setSubscription] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState('Inactive');
  const [renewalDate, setRenewalDate] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchSubscription = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/subscription/current');
      if (response.ok) {
        const data = await response.json();
        const sub = data.subscription;
        if (sub) {
          setSubscription(sub);
          setMaxCredits(sub.credits_allocated || 100);
          setSubscriptionStatus(sub.status === 'active' ? 'Active' : sub.status);
          setRenewalDate(sub.end_date || '');
        }
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshBilling = useCallback(async () => {
    await fetchSubscription();
    
    try {
      const meRes = await fetch('/api/auth/me');
      if (meRes.ok) {
        const meData = await meRes.json();
        setCredits(meData.user.credits_remaining || 0);
      }
    } catch(e) {
      console.error('Error fetching latest user credits:', e);
    }
  }, [fetchSubscription]);

  useEffect(() => {
    if (user) {
      setCredits(user.credits_remaining || 0);
      fetchSubscription();
    }
  }, [user, fetchSubscription]);

  const value = {
    credits,
    maxCredits,
    subscription,
    subscriptionStatus,
    renewalDate,
    loading,
    refreshBilling
  };

  return (
    <BillingContext.Provider value={value}>
      {children}
    </BillingContext.Provider>
  );
}
