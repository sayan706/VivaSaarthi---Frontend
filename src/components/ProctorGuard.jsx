import React, { useEffect, useRef, useState, useCallback } from 'react';

export default function ProctorGuard({ isActive, onAutoTerminate }) {
  const [warnings, setWarnings] = useState([]);
  const [warningCount, setWarningCount] = useState(0);
  const [showFinalWarning, setShowFinalWarning] = useState(false);
  const warningCountRef = useRef(0);
  const lastBlurTime = useRef(0);

  const MAX_WARNINGS = 5;
  const FINAL_WARNING_AT = 3;

  const addWarning = useCallback((type, message) => {
    const newCount = warningCountRef.current + 1;
    warningCountRef.current = newCount;
    setWarningCount(newCount);

    const warning = {
      id: Date.now(),
      type,
      message,
      count: newCount,
      timestamp: new Date().toLocaleTimeString(),
    };

    setWarnings(prev => [...prev.slice(-4), warning]); // Keep last 5 warnings

    // Auto-remove warning toast after 5 seconds
    setTimeout(() => {
      setWarnings(prev => prev.filter(w => w.id !== warning.id));
    }, 5000);

    // Show final warning overlay
    if (newCount === FINAL_WARNING_AT) {
      setShowFinalWarning(true);
      setTimeout(() => setShowFinalWarning(false), 6000);
    }

    // Auto-terminate at maximum warnings
    if (newCount >= MAX_WARNINGS) {
      onAutoTerminate?.('Maximum violations reached. Interview terminated due to malpractice.');
    }
  }, [onAutoTerminate]);

  useEffect(() => {
    if (!isActive) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        addWarning('tab_switch', 'Tab switch detected! Stay on the interview tab.');
      }
    };

    const handleWindowBlur = () => {
      const now = Date.now();
      if (now - lastBlurTime.current < 1000) return; // Debounce blur events
      lastBlurTime.current = now;

      if (!document.hidden) {
        addWarning('window_blur', 'Window lost focus! Focus away from interview flagged.');
      }
    };

    const handlePaste = (e) => {
      addWarning('clipboard', 'Paste action detected! Pasting answers is prohibited.');
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      addWarning('context_menu', 'Right-click context menu is disabled.');
    };

    const handleKeyDown = (e) => {
      const isCopy = (e.ctrlKey || e.metaKey) && e.key === 'c';
      const isPaste = (e.ctrlKey || e.metaKey) && e.key === 'v';
      const isDevTools = e.key === 'F12' || ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'i'));
      const isNewTab = (e.ctrlKey || e.metaKey) && e.key === 't';

      if (isDevTools) {
        e.preventDefault();
        addWarning('devtools', 'Developer tools shortcut detected.');
      }
      if (isNewTab) {
        e.preventDefault();
        addWarning('new_tab', 'Attempting to open new tab is prohibited.');
      }
    };

    const detectAITools = () => {
      const suspiciousSelectors = [
        '[data-grammarly]',
        '#grammarly-extension-root',
        '.parakeet',
        '[class*="parakeet"]',
        '[id*="parakeet"]',
        '[class*="copilot"]',
        '[data-extension]',
        '#chatgpt-sidebar',
        '[class*="ai-assist"]',
      ];

      for (const selector of suspiciousSelectors) {
        try {
          const el = document.querySelector(selector);
          if (el) {
            addWarning('ai_tool', `AI assistance tool or extension detected. External assistance is prohibited.`);
            break;
          }
        } catch (e) {}
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    const aiCheckInterval = setInterval(detectAITools, 10000);
    detectAITools(); // Run initial check

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      clearInterval(aiCheckInterval);
    };
  }, [isActive, addWarning]);

  if (!isActive) return null;

  const getWarningIcon = (type) => {
    switch (type) {
      case 'tab_switch': return 'desktop_windows';
      case 'window_blur': return 'visibility_off';
      case 'clipboard': return 'content_paste';
      case 'ai_tool': return 'security';
      default: return 'warning';
    }
  };

  const getWarningColor = (count) => {
    if (count >= FINAL_WARNING_AT) return 'text-error border-error';
    if (count >= 2) return 'text-[#f59e0b] border-[#f59e0b]';
    return 'text-[#f97316] border-[#f97316]';
  };

  return (
    <>
      {/* Warning Counter Badge */}
      {warningCount > 0 && (
        <div className="fixed top-6 left-6 z-[100] flex items-center gap-2 bg-black/80 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl shadow-lg select-none">
          <span className="material-symbols-outlined text-error animate-pulse text-[20px]">security</span>
          <span className="text-xs font-bold">
            Warnings: <span className="text-error">{warningCount}/{MAX_WARNINGS}</span>
          </span>
        </div>
      )}

      {/* Warning Toasts */}
      <div className="fixed top-6 right-6 z-[100] flex flex-col gap-2.5 max-w-[360px]">
        {warnings.map((warning) => (
          <div
            key={warning.id}
            className={`bg-[#171f33]/95 border-l-4 border border-white/10 p-4 rounded-xl flex gap-3 shadow-xl transition-all duration-300 transform scale-100 ${
              warning.count >= FINAL_WARNING_AT ? 'border-l-error' : 'border-l-[#f59e0b]'
            }`}
          >
            <span className={`material-symbols-outlined text-[20px] shrink-0 ${
              warning.count >= FINAL_WARNING_AT ? 'text-error' : 'text-[#f59e0b]'
            }`}>
              {getWarningIcon(warning.type)}
            </span>
            <div className="text-left">
              <div className={`text-[10px] font-bold uppercase tracking-wider ${
                warning.count >= FINAL_WARNING_AT ? 'text-error' : 'text-[#f59e0b]'
              }`}>
                Warning #{warning.count}
              </div>
              <div className="text-xs text-on-surface-variant leading-relaxed mt-1">
                {warning.message}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Final Warning Overlay */}
      {showFinalWarning && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-[#171f33] border-2 border-error/50 rounded-[24px] p-8 max-w-md w-full text-center shadow-[0_0_50px_rgba(255,180,171,0.2)]">
            <span className="material-symbols-outlined text-error text-[64px]">security</span>
            <h2 className="text-error text-xl font-bold mt-2 uppercase tracking-wide">
              Malpractice Warning
            </h2>
            <p className="text-sm text-on-surface-variant leading-relaxed mt-4">
              You have <span className="text-error font-bold">{MAX_WARNINGS - warningCount} warnings remaining</span>.
              Further tab switching, clipboard actions, or focus loss will result in <span className="text-error font-bold">automatic termination</span>.
            </p>
            <p className="text-xs text-on-surface-variant/50 mt-6">
              Dismissing automatically...
            </p>
          </div>
        </div>
      )}
    </>
  );
}
