import React, { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext(null);

export const useNotification = () => useContext(NotificationContext);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((message, type = 'info') => {
    const id = Date.now().toString();
    setNotifications((prev) => [...prev, { id, message, type }]);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((notif) => notif.id !== id));
    }, 3000);
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {children}
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
        {notifications.map((notif) => (
          <div 
            key={notif.id} 
            className={`px-4 py-3 rounded-lg shadow-lg flex items-center justify-between min-w-[250px] animate-fade-in-down backdrop-blur-md border ${
              notif.type === 'success' ? 'bg-primary/20 border-primary/50 text-primary' : 
              notif.type === 'error' ? 'bg-error/20 border-error/50 text-error' : 
              'bg-surface-container border-white/10 text-on-surface'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">
                {notif.type === 'success' ? 'check_circle' : notif.type === 'error' ? 'error' : 'info'}
              </span>
              <span className="font-bold text-sm">{notif.message}</span>
            </div>
            <button 
              onClick={() => removeNotification(notif.id)}
              className="ml-4 opacity-70 hover:opacity-100 transition-opacity"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}
