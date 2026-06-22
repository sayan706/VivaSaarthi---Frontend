import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function InterviewReports() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [templatesMap, setTemplatesMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const [reportsRes, templatesRes] = await Promise.all([
          fetch('/api/reports/'),
          fetch('/api/interview/templates')
        ]);
        
        if (reportsRes.ok) {
          const data = await reportsRes.json();
          setSessions(data.reports || []);
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
        console.error("Failed to fetch reports:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown Date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', month: 'short', day: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    });
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <p className="font-bold text-sm text-primary mb-2 flex items-center gap-2 uppercase tracking-widest">
            <span className="material-symbols-outlined text-[16px]">analytics</span>
            Session Analytics
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-on-surface">Interview Reports</h2>
          <p className="text-base text-on-surface-variant mt-1">Review all your past mock interviews and track your progress.</p>
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        ) : sessions.length > 0 ? (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-high/50 border-b border-white/10">
                  <th className="p-4 font-bold text-sm text-on-surface-variant uppercase tracking-wider">Template / Role</th>
                  <th className="p-4 font-bold text-sm text-on-surface-variant uppercase tracking-wider">Date</th>
                  <th className="p-4 font-bold text-sm text-on-surface-variant uppercase tracking-wider">Status</th>
                  <th className="p-4 font-bold text-sm text-on-surface-variant uppercase tracking-wider">Score</th>
                  <th className="p-4 font-bold text-sm text-on-surface-variant uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sessions.map((session) => (
                  <tr key={session.id} className="hover:bg-white/5 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-surface-variant flex items-center justify-center text-on-surface group-hover:text-primary transition-colors">
                          <span className="material-symbols-outlined text-[20px]">
                            {String(session.template_id)?.includes('frontend') ? 'code' : 'work'}
                          </span>
                        </div>
                        <span className="font-bold text-on-surface">
                          {session.template_id ? (templatesMap[session.template_id] || String(session.template_id).replace(/_/g, ' ').toUpperCase()) : 'General Session'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-on-surface-variant text-sm">
                      {formatDate(session.created_at)}
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        session.interview_status === 'completed' 
                          ? 'bg-primary/20 text-primary border border-primary/30' 
                          : 'bg-surface-variant text-on-surface-variant'
                      }`}>
                        {session.interview_status?.toUpperCase() || 'UNKNOWN'}
                      </span>
                    </td>
                    <td className="p-4">
                      {session.overall_score ? (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-surface-container-highest rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary" 
                              style={{ width: `${session.overall_score}%` }}
                            ></div>
                          </div>
                          <span className="text-on-surface font-bold text-sm">{session.overall_score}/100</span>
                        </div>
                      ) : (
                        <span className="text-on-surface-variant text-sm">N/A</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => navigate(`/interview-report/${session.id}`)}
                        className="bg-transparent hover:bg-primary/10 text-primary border border-primary/30 hover:border-primary px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ml-auto"
                      >
                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant">inbox</span>
            </div>
            <h3 className="text-xl font-bold text-on-surface mb-2">No Reports Found</h3>
            <p className="text-on-surface-variant max-w-md">You haven't completed any mock interviews yet. Start one to see your analytics here.</p>
            <button 
              onClick={() => navigate('/live-interview')}
              className="mt-6 bg-primary text-on-primary font-bold px-6 py-3 rounded-lg flex items-center gap-2 hover:shadow-[0_0_20px_rgba(20,184,166,0.4)] transition-all"
            >
              Start Interview
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
