import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function ReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [templatesMap, setTemplatesMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const [reportRes, templatesRes] = await Promise.all([
          fetch(`/api/reports/${id}`),
          fetch('/api/interview/templates')
        ]);
        
        if (reportRes.ok) {
          const data = await reportRes.json();
          setReport(data.report);
        } else {
          // Navigate back if not found
          navigate('/interview-report');
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
        console.error("Failed to fetch report:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id, navigate]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown Date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', month: 'short', day: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    });
  };

  const getStrokeDashoffset = (score) => {
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    return circumference - ((score || 0) / 100) * circumference;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-error mb-4">Report Not Found</h2>
        <button onClick={() => navigate('/interview-report')} className="text-primary hover:underline">
          Back to Reports
        </button>
      </div>
    );
  }

  const overallScore = report.overall_score ? parseFloat(report.overall_score) : 0;
  const techScore = report.technical_score ? parseFloat(report.technical_score) : 0;
  const commScore = report.communication_score ? parseFloat(report.communication_score) : 0;
  const probScore = report.problem_solving_score ? parseFloat(report.problem_solving_score) : 0;
  const sysScore = report.security_score ? parseFloat(report.security_score) : 0; // mapping security to system for mock

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
      <button 
        onClick={() => navigate('/interview-report')}
        className="mb-6 text-on-surface-variant hover:text-primary transition-colors flex items-center gap-2"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Back to Reports
      </button>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <p className="font-bold text-sm text-primary mb-2 flex items-center gap-2 uppercase tracking-widest">
            <span className="material-symbols-outlined text-[16px]">verified</span>
            Session Completed
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-on-surface">
            {report.template_id ? (templatesMap[report.template_id] || String(report.template_id).replace(/_/g, ' ').toUpperCase()) : 'Interview Session'}
          </h2>
          <p className="text-base text-on-surface-variant mt-1">
            Mock Interview • {formatDate(report.created_at)} • {report.duration_minutes || 0} Mins
          </p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 rounded-lg bg-surface-container border border-outline-variant/30 text-on-surface font-bold text-sm hover:bg-white/5 transition-all flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export PDF
          </button>
          <button className="px-4 py-2 rounded-lg bg-primary/10 border border-primary/30 text-primary font-bold text-sm hover:bg-primary/20 transition-all shadow-[0_0_15px_rgba(20,184,166,0.1)] flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">share</span>
            Share Result
          </button>
        </div>
      </div>

      {/* Bento Grid Content */}
      <div className="grid grid-cols-12 gap-6">
        {/* Overall Score (Left Col) */}
        <div className="col-span-12 lg:col-span-4 bg-surface-container/40 backdrop-blur-2xl border border-white/5 rounded-xl p-8 shadow-[0px_20px_50px_rgba(0,0,0,0.3)] relative overflow-hidden flex flex-col items-center justify-center text-center">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-primary/10 rounded-full blur-[60px] pointer-events-none"></div>
          <h3 className="font-bold text-2xl text-on-surface mb-8 w-full text-left">Overall Performance</h3>
          
          <div className="relative w-48 h-48 mb-6 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
              <circle className="text-surface-container-highest" cx="50" cy="50" fill="none" r="45" stroke="currentColor" strokeWidth="8"></circle>
              <circle 
                className="text-primary gauge-path shadow-[0_0_10px_rgba(20,184,166,0.8)] transition-all duration-1000 ease-out" 
                cx="50" cy="50" fill="none" r="45" stroke="currentColor" strokeLinecap="round" strokeWidth="8" 
                style={{ strokeDasharray: 283, strokeDashoffset: getStrokeDashoffset(overallScore) }}
              ></circle>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-bold text-6xl text-on-surface leading-none">{overallScore}</span>
              <span className="font-bold text-sm text-primary mt-1">
                {overallScore >= 80 ? 'Excellent' : overallScore >= 60 ? 'Good' : 'Needs Work'}
              </span>
            </div>
          </div>
          <p className="text-base text-on-surface-variant">
            {report.performance_summary || 'Your performance analysis is complete.'}
          </p>
        </div>

        {/* Skill Breakdown Radar/Bars (Right Col) */}
        <div className="col-span-12 lg:col-span-8 bg-surface-container/40 backdrop-blur-2xl border border-white/5 rounded-xl p-8 shadow-[0px_20px_50px_rgba(0,0,0,0.3)] relative overflow-hidden">
          <h3 className="font-bold text-2xl text-on-surface mb-8">Skill Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            
            <div className="relative w-full aspect-square max-w-[280px] mx-auto flex items-center justify-center opacity-80">
              <svg className="w-full h-full" viewBox="0 0 200 200">
                <polygon className="text-outline-variant/50" fill="none" points="100,10 180,55 180,145 100,190 20,145 20,55" stroke="currentColor" strokeWidth="1"></polygon>
                <polygon className="text-outline-variant/30" fill="none" points="100,40 155,70 155,130 100,160 45,130 45,70" stroke="currentColor" strokeWidth="1"></polygon>
                <line className="text-outline-variant/50" stroke="currentColor" strokeWidth="1" x1="100" x2="100" y1="100" y2="10"></line>
                <line className="text-outline-variant/50" stroke="currentColor" strokeWidth="1" x1="100" x2="180" y1="100" y2="55"></line>
                <line className="text-outline-variant/50" stroke="currentColor" strokeWidth="1" x1="100" x2="180" y1="100" y2="145"></line>
                <line className="text-outline-variant/50" stroke="currentColor" strokeWidth="1" x1="100" x2="100" y1="100" y2="190"></line>
                <line className="text-outline-variant/50" stroke="currentColor" strokeWidth="1" x1="100" x2="20" y1="100" y2="145"></line>
                <line className="text-outline-variant/50" stroke="currentColor" strokeWidth="1" x1="100" x2="20" y1="100" y2="55"></line>
                <polygon className="text-primary drop-shadow-[0_0_8px_rgba(20,184,166,0.5)]" fill="currentColor" fillOpacity="0.15" points="100,25 165,65 140,120 100,170 35,135 40,55" stroke="currentColor" strokeWidth="2"></polygon>
                
                <text fill="#bbcac6" fontFamily="Inter" fontSize="10" textAnchor="middle" x="100" y="5">Tech</text>
                <text fill="#bbcac6" fontFamily="Inter" fontSize="10" textAnchor="start" x="190" y="55">Comm</text>
                <text fill="#bbcac6" fontFamily="Inter" fontSize="10" textAnchor="start" x="190" y="150">Problem</text>
                <text fill="#bbcac6" fontFamily="Inter" fontSize="10" textAnchor="middle" x="100" y="200">Culture</text>
                <text fill="#bbcac6" fontFamily="Inter" fontSize="10" textAnchor="end" x="10" y="150">System</text>
                <text fill="#bbcac6" fontFamily="Inter" fontSize="10" textAnchor="end" x="10" y="55">Speed</text>
              </svg>
            </div>

            <div className="flex flex-col gap-6">
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="font-bold text-sm text-on-surface">Technical Accuracy</span>
                  <span className="text-sm font-bold text-primary">{techScore}%</span>
                </div>
                <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary-container to-primary rounded-full shadow-[0_0_10px_rgba(20,184,166,0.5)]" style={{ width: `${techScore}%` }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="font-bold text-sm text-on-surface">Communication Clarity</span>
                  <span className="text-sm font-bold text-tertiary">{commScore}%</span>
                </div>
                <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-tertiary-container to-tertiary rounded-full shadow-[0_0_10px_rgba(219,184,255,0.5)]" style={{ width: `${commScore}%` }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="font-bold text-sm text-on-surface">Problem Solving Logic</span>
                  <span className="text-sm font-bold text-primary">{probScore}%</span>
                </div>
                <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary-container to-primary rounded-full shadow-[0_0_10px_rgba(20,184,166,0.5)]" style={{ width: `${probScore}%` }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="font-bold text-sm text-on-surface">System Design</span>
                  <span className="text-sm font-bold text-error">{sysScore}%</span>
                </div>
                <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-error-container to-error rounded-full shadow-[0_0_10px_rgba(255,180,171,0.5)]" style={{ width: `${sysScore}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Strengths & Weaknesses (Lower Left) */}
        <div className="col-span-12 lg:col-span-6 bg-surface-container/40 backdrop-blur-2xl border border-white/5 rounded-xl p-8 shadow-[0px_20px_50px_rgba(0,0,0,0.3)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
            <div>
              <h4 className="font-bold text-sm text-on-surface mb-4 flex items-center gap-2 border-b border-white/10 pb-2">
                <span className="material-symbols-outlined text-primary">psychiatry</span>
                Key Strengths
              </h4>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary text-[20px] mt-0.5">check_circle</span>
                  <p className="text-sm text-on-surface-variant">
                    {report.strengths || "Excellent handling of complex scenarios without prompting."}
                  </p>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm text-on-surface mb-4 flex items-center gap-2 border-b border-white/10 pb-2">
                <span className="material-symbols-outlined text-error">trending_down</span>
                Areas to Improve
              </h4>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-error text-[20px] mt-0.5">warning</span>
                  <p className="text-sm text-on-surface-variant">
                    {report.weaknesses || "Pacing was slightly rushed during the system design overview."}
                  </p>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* AI Roadmap (Lower Right) */}
        <div className="col-span-12 lg:col-span-6 bg-surface-container/40 backdrop-blur-2xl border border-white/5 rounded-xl p-8 shadow-[0px_20px_50px_rgba(0,0,0,0.3)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-tertiary/50 to-transparent"></div>
          <h3 className="font-bold text-2xl text-on-surface mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary">auto_awesome</span>
            Personalized AI Roadmap
          </h3>
          <p className="text-sm text-on-surface-variant mb-6">Based on this session, focus on these actionable steps before your real interview.</p>
          
          <div className="relative border-l border-white/10 ml-3 space-y-6 pb-4">
            <div className="relative pl-6">
              <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
              </span>
              <h5 className="font-bold text-sm text-on-surface">Review Topics</h5>
              <p className="text-xs text-on-surface-variant mt-1">
                {report.preparation_plan || "Focus on your weak areas from this mock session."}
              </p>
              <button 
                onClick={() => navigate('/live-interview')}
                className="mt-2 text-primary text-xs font-bold hover:underline flex items-center gap-1"
              >
                Start Practice <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
