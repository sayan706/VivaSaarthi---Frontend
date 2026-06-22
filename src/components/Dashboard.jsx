import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBilling } from '../context/BillingContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { credits, maxCredits, renewalDate } = useBilling();
  const creditPercentage = maxCredits > 0 ? (credits / maxCredits) * 100 : 0;
  
  const [stats, setStats] = useState({
    total_interviews: 0,
    avg_score: 0,
    best_score: 0,
    communication: 0,
    confidence: 0
  });
  
  const [recentSessions, setRecentSessions] = useState([]);
  const [templatesMap, setTemplatesMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [overviewRes, sessionsRes, templatesRes] = await Promise.all([
          fetch('/api/dashboard/overview'),
          fetch('/api/dashboard/recent-interviews'),
          fetch('/api/interview/templates')
        ]);
        
        if (overviewRes.ok) {
          const overviewData = await overviewRes.json();
          setStats(prev => ({...prev, ...overviewData}));
        }
        
        if (sessionsRes.ok) {
          const sessionsData = await sessionsRes.json();
          setRecentSessions(sessionsData.recent_interviews || []);
        }

        if (templatesRes.ok) {
          const templatesData = await templatesRes.json();
          const tMap = {};
          (templatesData.templates || []).forEach(t => {
            tMap[t.id] = t.name;
          });
          setTemplatesMap(tMap);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown Date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto grid grid-cols-4 md:grid-cols-12 gap-6">
      {/* Hero Section */}
      <section className="col-span-4 md:col-span-12 glass-card rounded-2xl p-8 relative overflow-hidden flex flex-col md:flex-row items-center justify-between border-t border-t-white/20">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/20 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-tertiary-container/10 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="relative z-10 space-y-4 max-w-2xl">
          <h1 className="font-headline-lg text-3xl md:text-4xl font-bold text-on-surface">
            Welcome back, <span className="text-primary drop-shadow-[0_0_10px_rgba(20,184,166,0.8)]">{user?.name || 'User'}</span>
          </h1>
          <p className="font-body-lg text-lg text-on-surface-variant">
            Ready to tackle your next technical behavioral round? Start a mock interview to improve your skills.
          </p>
        </div>
        <div className="relative z-10 mt-6 md:mt-0">
          <button 
            onClick={() => navigate('/live-interview')}
            className="bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold px-8 py-4 rounded-xl shadow-[0px_10px_30px_rgba(20,184,166,0.4)] hover:shadow-[0px_15px_40px_rgba(20,184,166,0.6)] hover:-translate-y-1 transition-all duration-300 flex items-center gap-2 group"
          >
            <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">play_circle</span>
            Start Mock Interview
          </button>
        </div>
      </section>

      {/* Stats Section (4 Cards) */}
      <div className="col-span-4 md:col-span-3 glass-card rounded-xl p-6 hover:bg-surface-container/60 transition-colors group">
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 bg-primary/10 rounded-lg text-primary group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined">forum</span>
          </div>
        </div>
        <h3 className="font-bold text-3xl text-on-surface">{stats.total_interviews}</h3>
        <p className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mt-1">Total Interviews</p>
      </div>

      <div className="col-span-4 md:col-span-3 glass-card rounded-xl p-6 hover:bg-surface-container/60 transition-colors group">
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 bg-tertiary-container/10 rounded-lg text-tertiary-container group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined">score</span>
          </div>
        </div>
        <h3 className="font-bold text-3xl text-on-surface">{stats.avg_score}/100</h3>
        <p className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mt-1">Avg Score</p>
      </div>

      <div className="col-span-4 md:col-span-3 glass-card rounded-xl p-6 hover:bg-surface-container/60 transition-colors group relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-full h-1 bg-surface-variant">
          <div className="h-full bg-primary shadow-[0_0_10px_rgba(20,184,166,0.8)]" style={{ width: `${stats.communication}%` }}></div>
        </div>
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 bg-secondary-container/20 rounded-lg text-secondary group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined">record_voice_over</span>
          </div>
        </div>
        <h3 className="font-bold text-3xl text-on-surface">{stats.communication}%</h3>
        <p className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mt-1">Communication</p>
      </div>

      <div className="col-span-4 md:col-span-3 glass-card rounded-xl p-6 hover:bg-surface-container/60 transition-colors group relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-full h-1 bg-surface-variant">
          <div className="h-full bg-tertiary-container shadow-[0_0_10px_rgba(184,150,221,0.8)]" style={{ width: `${stats.confidence}%` }}></div>
        </div>
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 bg-surface-bright/50 rounded-lg text-on-surface group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined">psychology</span>
          </div>
        </div>
        <h3 className="font-bold text-3xl text-on-surface">{stats.confidence}%</h3>
        <p className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mt-1">Confidence</p>
      </div>

      {/* Credit Usage Section */}
      <section className="col-span-4 md:col-span-12 glass-card rounded-2xl p-6 border-t border-t-white/10 mt-4 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none transition-all group-hover:bg-primary/10"></div>
        <div className="flex-1 w-full relative z-10">
          <div className="flex justify-between items-end mb-2">
            <h3 className="font-bold text-xl text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">account_balance_wallet</span>
              Credits Remaining
            </h3>
            <span className="text-sm font-bold text-on-surface-variant">
              <span className="text-primary text-xl mr-1">{credits}</span> / {maxCredits}
            </span>
          </div>
          <div className="w-full h-3 bg-surface-container-highest rounded-full overflow-hidden shadow-inner mb-2">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(20,184,166,0.5)] ${
                creditPercentage > 20 
                  ? 'bg-gradient-to-r from-primary-container to-primary' 
                  : 'bg-gradient-to-r from-error-container to-error shadow-[0_0_10px_rgba(255,180,171,0.5)]'
              }`}
              style={{ width: `${creditPercentage}%` }}
            ></div>
          </div>
          <p className="text-xs text-on-surface-variant flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">event</span>
            Renews on: <span className="font-bold text-on-surface ml-1">{new Date(renewalDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </p>
        </div>
        
        <div className="relative z-10 shrink-0">
          <button 
            onClick={() => navigate('/billing')}
            className="bg-surface-variant/50 hover:bg-surface-variant text-primary font-bold px-6 py-3 rounded-xl border border-primary/20 hover:border-primary/50 transition-all duration-300 flex items-center gap-2 shadow-[0_5px_15px_rgba(0,0,0,0.2)] hover:shadow-[0_8px_20px_rgba(20,184,166,0.2)]"
          >
            <span className="material-symbols-outlined">rocket_launch</span>
            Upgrade Plan
          </button>
        </div>
      </section>

      {/* Recent Activity */}
      <section className="col-span-4 md:col-span-12 glass-card rounded-2xl p-6 border-t border-t-white/10 mt-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-bold text-2xl text-on-surface">Recent Sessions</h2>
          <button onClick={() => navigate('/interview-report')} className="text-primary hover:text-primary-fixed text-sm flex items-center gap-1 transition-colors">
            View All <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-8">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : recentSessions.length > 0 ? (
          <div className="space-y-4">
            {recentSessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-4 bg-surface-container-high/30 rounded-xl hover:bg-surface-container-high/60 transition-colors border border-transparent hover:border-white/5 group">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-surface-variant rounded-lg text-on-surface group-hover:text-primary transition-colors">
                    <span className="material-symbols-outlined">
                      {session.interview_status === 'completed' ? 'verified' : 'pending'}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-on-surface">
                      {session.template_id ? (templatesMap[session.template_id] || String(session.template_id).replace(/_/g, ' ').toUpperCase()) : 'Interview Session'}
                    </h4>
                    <p className="text-xs text-on-surface-variant mt-1">
                      {formatDate(session.created_at)} • Status: {session.interview_status}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {session.overall_score ? (
                    <span className="text-primary font-bold text-lg">{session.overall_score}/100</span>
                  ) : (
                    <span className="text-on-surface-variant font-bold text-sm">N/A</span>
                  )}
                  <button 
                    onClick={() => navigate(`/interview-report/${session.id}`)}
                    className="text-xs border border-white/10 hover:border-primary/50 bg-white/5 px-3 py-1.5 rounded-lg text-on-surface transition-all"
                  >
                    View Report
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-on-surface-variant">
            <span className="material-symbols-outlined text-4xl mb-2 opacity-50">inbox</span>
            <p>No recent sessions found. Start a mock interview!</p>
          </div>
        )}
      </section>
    </div>
  );
}
