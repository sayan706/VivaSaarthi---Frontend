import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBilling } from '../context/BillingContext';
import Loader from './Loader';

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
      <section className="col-span-4 md:col-span-12 bg-gradient-to-r from-[#d2f4e8] via-[#aed8e6] to-[#204968] rounded-2xl p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between">
        <div className="flex items-center gap-4 relative z-10 max-w-3xl">
          <div className="w-16 h-16 bg-[#1a3854] rounded-full flex items-center justify-center text-white text-2xl font-semibold shrink-0">
            {user?.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U'}
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
              Welcome back, {user?.name || 'User'}!
            </h1>
            <p className="text-lg text-gray-800 mt-2 font-medium">
              Ready to tackle your next technical behavioral round? Let's start a mock interview and sharpen your skills.
            </p>
          </div>
        </div>
        <div className="relative z-10 mt-6 md:mt-0 shrink-0">
          <button 
            onClick={() => navigate('/live-interview')}
            className="bg-[#117065] hover:bg-[#0e5c53] text-white font-medium px-6 py-3 rounded-xl shadow-sm transition-all duration-300 flex items-center gap-2 group"
          >
            <i className="ph ph-microphone text-xl"></i>
            Start a New Mock Interview
          </button>
        </div>
      </section>

      {/* Stats Section (4 Cards) */}
      <div className="col-span-4 md:col-span-3 bg-white shadow-sm border border-gray-100 rounded-xl p-6 hover:shadow-md transition-shadow group">
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-teal-50 rounded-lg text-teal-600 group-hover:scale-110 transition-transform">
            <i className="ph ph-chats-circle text-2xl"></i>
          </div>
        </div>
        <h3 className="font-bold text-3xl text-gray-900">{stats.total_interviews}</h3>
        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mt-1">Total Interviews</p>
      </div>

      <div className="col-span-4 md:col-span-3 bg-white shadow-sm border border-gray-100 rounded-xl p-6 hover:shadow-md transition-shadow group">
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600 group-hover:scale-110 transition-transform">
            <i className="ph ph-chart-line-up text-2xl"></i>
          </div>
        </div>
        <h3 className="font-bold text-3xl text-gray-900">{stats.avg_score}/100</h3>
        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mt-1">Avg Score</p>
      </div>

      <div className="col-span-4 md:col-span-3 bg-white shadow-sm border border-gray-100 rounded-xl p-6 hover:shadow-md transition-shadow group relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-100">
          <div className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]" style={{ width: `${stats.communication}%` }}></div>
        </div>
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-blue-50 rounded-lg text-blue-600 group-hover:scale-110 transition-transform">
            <i className="ph ph-microphone-stage text-2xl"></i>
          </div>
        </div>
        <h3 className="font-bold text-3xl text-gray-900">{stats.communication}%</h3>
        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mt-1">Communication</p>
      </div>

      <div className="col-span-4 md:col-span-3 bg-white shadow-sm border border-gray-100 rounded-xl p-6 hover:shadow-md transition-shadow group relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-100">
          <div className="h-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.6)]" style={{ width: `${stats.confidence}%` }}></div>
        </div>
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-orange-50 rounded-lg text-orange-600 group-hover:scale-110 transition-transform">
            <i className="ph ph-brain text-2xl"></i>
          </div>
        </div>
        <h3 className="font-bold text-3xl text-gray-900">{stats.confidence}%</h3>
        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mt-1">Confidence</p>
      </div>

      {/* Credit Usage Section */}
      <section className="col-span-4 md:col-span-12 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-4 group">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg text-gray-900">
            Your Interview Credits
          </h3>
          <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <span>{credits} / {maxCredits}</span>
            <span className="text-gray-500 font-normal">Renews on: {new Date(renewalDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1 w-full">
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ease-out ${
                  creditPercentage > 20 
                    ? 'bg-teal-500' 
                    : 'bg-red-500'
                }`}
                style={{ width: `${creditPercentage}%` }}
              ></div>
            </div>
          </div>
          <div className="shrink-0">
            <button 
              onClick={() => navigate('/billing')}
              className="bg-white hover:bg-gray-50 text-gray-800 font-medium px-5 py-2 rounded-full border border-gray-300 transition-all duration-300 flex items-center gap-2 shadow-sm text-sm"
            >
              <i className="ph ph-rocket-launch text-lg text-gray-600"></i>
              Upgrade Plan
            </button>
          </div>
        </div>
      </section>

      {/* Recent Activity */}
      <section className="col-span-4 md:col-span-12 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-bold text-xl text-gray-900">Your Recent Sessions</h2>
          <button onClick={() => navigate('/interview-report')} className="text-[#117065] hover:text-[#0e5c53] font-semibold text-sm flex items-center gap-1 transition-colors">
            View All <i className="ph ph-arrow-right text-lg"></i>
          </button>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-8">
             <Loader fullScreen={false} text="Loading sessions..." />
          </div>
        ) : recentSessions.length > 0 ? (
          <div className="space-y-4">
            {recentSessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:shadow-sm transition-all group">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${session.interview_status === 'completed' ? 'bg-[#3bb17b] text-white' : 'bg-orange-500 text-white'}`}>
                    <i className={`ph ${session.interview_status === 'completed' ? 'ph-check' : 'ph-clock'} text-xl font-bold`}></i>
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-gray-900">
                      {session.template_id ? (templatesMap[session.template_id] || String(session.template_id).replace(/_/g, ' ').toUpperCase()) : 'Interview Session'}
                    </h4>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatDate(session.created_at)} • Status: <span className="capitalize">{session.interview_status}</span>
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {session.overall_score ? (
                    <span className="text-gray-900 font-semibold text-sm">{typeof session.overall_score === 'number' ? session.overall_score.toFixed(2) : session.overall_score}/100</span>
                  ) : (
                    <span className="text-gray-400 font-semibold text-sm">N/A</span>
                  )}
                  <button 
                    onClick={() => navigate(`/interview-report/${session.id}`)}
                    className="text-xs font-semibold border border-gray-300 bg-white hover:bg-gray-50 px-4 py-1.5 rounded-full text-gray-700 transition-all shadow-sm"
                  >
                    View Report
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-gray-400">
            <i className="ph ph-tray text-4xl mb-2 opacity-50"></i>
            <p className="font-medium">No recent sessions found. Start a mock interview!</p>
          </div>
        )}
      </section>
    </div>
  );
}
