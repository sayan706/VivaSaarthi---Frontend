import React, { useState, useEffect } from 'react';
import { useBilling } from '../context/BillingContext';
import { useNotification } from '../context/NotificationContext';

export default function Billing() {
  const { credits, maxCredits, subscription, subscriptionStatus, renewalDate } = useBilling();
  const { addNotification } = useNotification();
  
  const [plans, setPlans] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(true);

  const creditPercentage = maxCredits > 0 ? (credits / maxCredits) * 100 : 0;

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch('/api/subscription/plans');
        if (res.ok) {
          const data = await res.json();
          setPlans(data.plans || []);
        }
      } catch (err) {
        console.error('Failed to fetch plans', err);
      }
    };
    
    const fetchTransactions = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/payments/history', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setTransactions(data.payment_history || []);
        }
      } catch (err) {
        console.error('Failed to fetch transactions', err);
      } finally {
        setLoadingTransactions(false);
      }
    };

    fetchPlans();
    fetchTransactions();
  }, []);

  const currentPlanId = subscription?.plan_id;
  const currentPlan = plans.find(p => String(p.id) === String(currentPlanId));
  const currentPlanName = currentPlan ? currentPlan.name : 'Free Tier';
  const currentPlanPrice = currentPlan ? currentPlan.price : 0;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full animate-in fade-in duration-500">
      <div className="mb-8">
        <h2 className="text-3xl md:text-4xl font-bold text-on-surface flex items-center gap-3">
          <i className="ph ph-receipt text-teal-600 text-[36px]"></i>
          Billing & Usage
        </h2>
        <p className="text-base text-on-surface-variant mt-2">
          Manage your subscription, track mock interview credits, and view payment history.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Plan Card */}
        <div className="lg:col-span-2 bg-white shadow-sm border border-gray-100 rounded-2xl p-8 border border-gray-200 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-6">
            <div>
              <p className="text-sm font-bold text-primary uppercase tracking-widest mb-2 flex items-center gap-1">
                <i className="ph ph-seal-check text-[16px]"></i>
                Current Plan
              </p>
              <h3 className="text-4xl font-bold text-on-surface mb-2 capitalize">{currentPlanName}</h3>
              <p className="text-on-surface-variant">
                Status: <span className="text-primary font-bold capitalize">{subscriptionStatus}</span>
              </p>
            </div>
            
            <div className="text-left md:text-right">
              <h4 className="text-3xl font-bold text-on-surface mb-1">${currentPlanPrice}<span className="text-lg text-on-surface-variant font-normal">/mo</span></h4>
              <p className="text-sm text-on-surface-variant">
                Renews on <span className="font-bold text-on-surface">{renewalDate ? new Date(renewalDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}</span>
              </p>
            </div>
          </div>

          <div className="relative z-10 mt-10">
            <div className="flex justify-between items-end mb-3">
              <span className="font-bold text-on-surface flex items-center gap-2">
                <i className="ph ph-chart-bar text-teal-600"></i>
                Credit Usage
              </span>
              <span className="text-sm font-bold text-on-surface-variant">
                <span className="text-primary text-xl mr-1">{credits}</span> / {maxCredits} remaining
              </span>
            </div>
            
            <div className="w-full h-4 bg-surface-container-highest rounded-full overflow-hidden shadow-inner">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(20,184,166,0.5)] ${
                  creditPercentage > 20 
                    ? 'bg-gradient-to-r from-primary-container to-primary' 
                    : 'bg-gradient-to-r from-error-container to-error shadow-[0_0_15px_rgba(255,180,171,0.5)]'
                }`}
                style={{ width: `${creditPercentage}%` }}
              ></div>
            </div>
            {creditPercentage <= 20 && (
              <p className="text-error text-xs mt-2 font-bold flex items-center gap-1">
                <i className="ph ph-warning text-[14px]"></i>
                You are running low on credits!
              </p>
            )}
          </div>
        </div>

        {/* Upgrade Card */}
        <div className="bg-white shadow-sm border border-gray-100 rounded-2xl p-8 border border-gray-200 flex flex-col justify-center text-center relative overflow-hidden group hover:border-primary/30 transition-colors">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none"></div>
          
          <div className="w-16 h-16 bg-surface-variant rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:bg-primary/20 transition-all">
            <i className="ph ph-rocket-launch text-gray-900 group-hover:text-teal-600 text-3xl transition-colors"></i>
          </div>
          
          <h3 className="text-xl font-bold text-on-surface mb-2">Need more power?</h3>
          <p className="text-sm text-on-surface-variant mb-6">
            Upgrade to the Ultra tier for unlimited mock interviews and priority AI processing.
          </p>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-full bg-on-surface text-surface font-bold py-3 px-6 rounded-xl hover:bg-primary hover:text-on-primary hover:shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:-translate-y-1 transition-all duration-300"
          >
            View Pricing Plans
          </button>
        </div>
      </div>
      
      {/* Transaction History */}
      <div className="mt-8 bg-white shadow-sm border border-gray-100 rounded-2xl p-6 border border-gray-200">
        <h3 className="font-bold text-xl text-on-surface mb-6 flex items-center gap-2">
          <i className="ph ph-clock-counter-clockwise text-gray-500"></i>
          Recent Transactions
        </h3>
        
        {loadingTransactions ? (
           <div className="animate-pulse h-10 bg-white/5 rounded-lg w-full"></div>
        ) : transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-on-surface-variant text-sm uppercase tracking-wider">
                  <th className="pb-4 font-bold">Date</th>
                  <th className="pb-4 font-bold">Description</th>
                  <th className="pb-4 font-bold">Amount</th>
                  <th className="pb-4 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {transactions.map((tx, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    <td className="py-4 text-sm text-on-surface-variant">{new Date(tx.date).toLocaleDateString()}</td>
                    <td className="py-4 text-sm font-bold text-on-surface">{tx.description}</td>
                    <td className="py-4 text-sm font-bold text-on-surface">${tx.amount}</td>
                    <td className="py-4">
                      <span className="bg-primary/20 text-primary border border-primary/30 px-3 py-1 rounded-full text-xs font-bold">PAID</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10 border border-dashed border-gray-200 rounded-xl bg-surface-variant/30">
            <i className="ph ph-receipt text-4xl text-gray-500 mb-2 opacity-50"></i>
            <p className="text-on-surface-variant font-bold">No recent transactions</p>
            <p className="text-sm text-on-surface-variant/70 mt-1">You have not made any payments yet.</p>
          </div>
        )}
      </div>

      {/* Pricing Plans Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative w-full max-w-4xl bg-surface-container border border-gray-200 rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-surface-container-high relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none"></div>
              <h3 className="text-2xl font-bold text-on-surface flex items-center gap-2 relative z-10">
                <i className="ph ph-rocket-launch text-teal-600"></i>
                Upgrade Your Experience
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 bg-white/5 hover:bg-error/20 text-on-surface-variant hover:text-error rounded-full transition-colors relative z-10"
              >
                <i className="ph ph-x"></i>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {plans.length > 0 ? plans.map(plan => (
                  <div key={plan.id} className={`bg-white shadow-sm border border-gray-100 rounded-xl p-6 border ${String(plan.id) === String(currentPlanId) ? 'border-primary shadow-[0_0_20px_rgba(20,184,166,0.15)] bg-teal-50' : 'border-gray-200 hover:border-gray-300'} transition-all relative flex flex-col justify-between`}>
                    {String(plan.id) === String(currentPlanId) && (
                      <div className="absolute -top-3 -right-3 bg-primary text-on-primary text-xs font-bold px-3 py-1 rounded-full shadow-lg border border-primary-container">Current Plan</div>
                    )}
                    <div>
                      <h4 className="text-2xl font-bold text-on-surface mb-2 capitalize">{plan.name}</h4>
                      <p className="text-on-surface-variant text-sm mb-6 h-10">{plan.description || `Get access to ${plan.credits} premium credits for ${plan.duration_days} days.`}</p>
                      
                      <div className="mb-6 flex items-end gap-1">
                        <span className="text-4xl font-bold text-on-surface">${plan.price}</span>
                        <span className="text-on-surface-variant mb-1">/ {plan.duration_days > 30 ? 'year' : 'month'}</span>
                      </div>
                      
                      <ul className="space-y-3 mb-8">
                        <li className="flex items-center gap-2 text-sm text-on-surface-variant">
                          <i className="ph ph-check-circle text-teal-600 text-[18px]"></i>
                          <span className="font-bold text-on-surface">{plan.credits}</span> Interview Credits
                        </li>
                        <li className="flex items-center gap-2 text-sm text-on-surface-variant">
                          <i className="ph ph-check-circle text-teal-600 text-[18px]"></i>
                          {plan.duration_days} Days Validity
                        </li>
                        {plan.price > 0 && (
                          <li className="flex items-center gap-2 text-sm text-on-surface-variant">
                            <i className="ph ph-check-circle text-teal-600 text-[18px]"></i>
                            Priority Support & Analytics
                          </li>
                        )}
                      </ul>
                    </div>
                    
                    <button 
                      className={`w-full py-3 rounded-lg font-bold transition-all flex justify-center items-center gap-2 ${String(plan.id) === String(currentPlanId) ? 'bg-surface-variant text-on-surface cursor-default opacity-70' : 'bg-primary text-on-primary-fixed hover:shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:-translate-y-0.5'}`}
                      disabled={String(plan.id) === String(currentPlanId)}
                    >
                      {String(plan.id) === String(currentPlanId) ? 'Current Plan' : 'Select Plan'}
                    </button>
                  </div>
                )) : (
                  <div className="col-span-full py-12 text-center text-on-surface-variant flex flex-col items-center gap-3">
                    <i className="ph ph-hourglass text-4xl opacity-50"></i>
                    <p>Loading plans from the server...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
