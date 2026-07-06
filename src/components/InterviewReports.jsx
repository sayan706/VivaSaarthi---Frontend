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
          <p className="font-bold text-sm text-teal-600 mb-2 flex items-center gap-2 uppercase tracking-widest">
            <i className="ph ph-chart-bar text-[18px]"></i>
            Session Analytics
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Interview Reports</h2>
          <p className="text-base text-gray-500 mt-1">Review all your past mock interviews and track your progress.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-500"></div>
          </div>
        ) : sessions.length > 0 ? (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="p-4 font-bold text-sm text-gray-500 uppercase tracking-wider">Template / Role</th>
                  <th className="p-4 font-bold text-sm text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="p-4 font-bold text-sm text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="p-4 font-bold text-sm text-gray-500 uppercase tracking-wider">Score</th>
                  <th className="p-4 font-bold text-sm text-gray-500 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sessions.map((session) => (
                  <tr key={session.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 group-hover:text-teal-600 transition-colors">
                          <i className={`ph ${String(session.template_id)?.includes('frontend') ? 'ph-code' : 'ph-briefcase'} text-xl`}></i>
                        </div>
                        <span className="font-bold text-gray-900">
                          {session.template_id ? (templatesMap[session.template_id] || String(session.template_id).replace(/_/g, ' ').toUpperCase()) : 'General Session'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 font-medium text-gray-500 text-sm">
                      {formatDate(session.created_at)}
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        session.interview_status === 'completed' 
                          ? 'bg-teal-50 text-teal-700 border border-teal-200' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {session.interview_status?.toUpperCase() || 'UNKNOWN'}
                      </span>
                    </td>
                    <td className="p-4">
                      {session.overall_score ? (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-teal-500" 
                              style={{ width: `${session.overall_score}%` }}
                            ></div>
                          </div>
                          <span className="text-gray-900 font-bold text-sm">{session.overall_score}/100</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 font-medium text-sm">N/A</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => navigate(`/interview-report/${session.id}`)}
                        className="bg-white hover:bg-teal-50 text-teal-600 border border-gray-200 hover:border-teal-200 px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ml-auto shadow-sm"
                      >
                        <i className="ph ph-eye text-[18px]"></i>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center h-64">
            <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-4 border border-gray-100">
              <i className="ph ph-tray text-4xl text-gray-300"></i>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Reports Found</h3>
            <p className="text-gray-500 max-w-md">You haven't completed any mock interviews yet. Start an interview to see your detailed analytics.</p>
            <button 
              onClick={() => navigate('/live-interview')}
              className="mt-6 bg-teal-600 text-white font-bold px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-teal-700 transition-all"
            >
              Start Interview
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
