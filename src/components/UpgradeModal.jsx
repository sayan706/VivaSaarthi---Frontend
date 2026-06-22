import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function UpgradeModal({ isOpen, onClose }) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-surface-container border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative animate-in fade-in zoom-in duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
        
        <div className="w-16 h-16 bg-error-container/20 rounded-full flex items-center justify-center mb-6 mx-auto relative overflow-hidden">
          <div className="absolute inset-0 bg-error/20 blur-xl"></div>
          <span className="material-symbols-outlined text-error text-3xl relative z-10">account_balance_wallet</span>
        </div>
        
        <h2 className="text-2xl font-bold text-on-surface text-center mb-2">Out of Credits!</h2>
        <p className="text-on-surface-variant text-center mb-8 text-sm">
          You've used all your available mock interview credits for this billing cycle. Upgrade your plan to get unlimited practice.
        </p>
        
        <div className="flex flex-col gap-4">
          <button 
            onClick={() => {
              onClose();
              navigate('/billing');
            }}
            className="w-full bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold py-3 rounded-xl shadow-[0_10px_25px_rgba(20,184,166,0.3)] hover:shadow-[0_15px_35px_rgba(20,184,166,0.5)] hover:-translate-y-1 transition-all flex items-center justify-center gap-2 group"
          >
            <span className="material-symbols-outlined group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform">rocket_launch</span>
            Upgrade Plan
          </button>
          
          <button 
            onClick={onClose}
            className="w-full bg-transparent border border-white/10 text-on-surface py-3 rounded-xl hover:bg-white/5 transition-all font-bold"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
