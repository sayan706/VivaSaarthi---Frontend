import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

export default function ReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [templatesMap, setTemplatesMap] = useState({});
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const handleExportPDF = async () => {
    const input = document.getElementById('pdf-content');
    if (!input) return;

    try {
      setExporting(true);
      
      const bgColor = getComputedStyle(document.body).getPropertyValue('--color-background').trim() || '#0b1326';
      
      const dataUrl = await toPng(input, {
        backgroundColor: bgColor,
        pixelRatio: 2,
        filter: (node) => {
          if (node.getAttribute && node.getAttribute('data-html2canvas-ignore') === 'true') return false;
          return true;
        }
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      const filename = `Interview_Report_${report?.template_id ? (templatesMap[report.template_id] || report.template_id) : 'Session'}.pdf`;
      pdf.save(filename.replace(/\s+/g, '_'));
      
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF: ' + (error.message || 'Unknown error'));
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const token = localStorage.getItem('token');
        const [reportRes, templatesRes, messagesRes] = await Promise.all([
          fetch(`/api/reports/${id}`, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} }),
          fetch('/api/interview/templates', { headers: token ? { 'Authorization': `Bearer ${token}` } : {} }),
          fetch(`/api/interview/messages/${id}`, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} })
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

        if (messagesRes.ok) {
          const msgsData = await messagesRes.json();
          setMessages(msgsData.messages || []);
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
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full" id="pdf-content">
      <button 
        data-html2canvas-ignore="true"
        onClick={() => navigate('/interview-report')}
        className="mb-6 text-on-surface-variant hover:text-primary transition-colors flex items-center gap-2"
      >
        <i className="ph ph-arrow-left text-[18px]"></i>
        Back to Reports
      </button>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <p className="font-bold text-sm text-primary mb-2 flex items-center gap-2 uppercase tracking-widest">
            <i className="ph ph-seal-check text-[16px]"></i>
            Session Completed
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-on-surface">
            {report.template_id ? (templatesMap[report.template_id] || String(report.template_id).replace(/_/g, ' ').toUpperCase()) : 'Interview Session'}
          </h2>
          <p className="text-base text-on-surface-variant mt-1">
            Mock Interview • {formatDate(report.created_at)} • {report.duration_minutes || 0} Mins
          </p>
        </div>
        <div className="flex gap-3" data-html2canvas-ignore="true">
          <button 
            onClick={handleExportPDF}
            disabled={exporting}
            className={`px-4 py-2 rounded-lg border border-outline-variant/30 text-on-surface font-bold text-sm hover:bg-white/5 transition-all flex items-center gap-2 ${exporting ? 'bg-gray-100 cursor-wait' : 'bg-surface-container'}`}
          >
            {exporting ? (
              <i className="ph ph-spinner animate-spin text-[18px]"></i>
            ) : (
              <i className="ph ph-download-simple text-[18px]"></i>
            )}
            {exporting ? 'Exporting...' : 'Export PDF'}
          </button>
          <button className="px-4 py-2 rounded-lg bg-primary/10 border border-primary/30 text-primary font-bold text-sm hover:bg-primary/20 transition-all shadow-[0_0_15px_rgba(20,184,166,0.1)] flex items-center gap-2">
            <i className="ph ph-share-network text-[18px]"></i>
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
                <div className="w-full h-2 bg-gray-50est rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary-container to-primary rounded-full shadow-[0_0_10px_rgba(20,184,166,0.5)]" style={{ width: `${techScore}%` }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="font-bold text-sm text-on-surface">Communication Clarity</span>
                  <span className="text-sm font-bold text-tertiary">{commScore}%</span>
                </div>
                <div className="w-full h-2 bg-gray-50est rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-tertiary-container to-tertiary rounded-full shadow-[0_0_10px_rgba(219,184,255,0.5)]" style={{ width: `${commScore}%` }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="font-bold text-sm text-on-surface">Problem Solving Logic</span>
                  <span className="text-sm font-bold text-primary">{probScore}%</span>
                </div>
                <div className="w-full h-2 bg-gray-50est rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary-container to-primary rounded-full shadow-[0_0_10px_rgba(20,184,166,0.5)]" style={{ width: `${probScore}%` }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="font-bold text-sm text-on-surface">System Design</span>
                  <span className="text-sm font-bold text-error">{sysScore}%</span>
                </div>
                <div className="w-full h-2 bg-gray-50est rounded-full overflow-hidden">
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
              <h4 className="font-bold text-sm text-on-surface mb-4 flex items-center gap-2 border-b border-gray-200 pb-2">
                <i className="ph ph-brain text-teal-600"></i>
                Key Strengths
              </h4>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <i className="ph ph-check-circle text-teal-600 text-[20px] mt-0.5"></i>
                  <p className="text-sm text-on-surface-variant">
                    {report.strengths || "Excellent handling of complex scenarios without prompting."}
                  </p>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm text-on-surface mb-4 flex items-center gap-2 border-b border-gray-200 pb-2">
                <i className="ph ph-trend-down text-red-500"></i>
                Areas to Improve
              </h4>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <i className="ph ph-warning text-red-500 text-[20px] mt-0.5"></i>
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
            <i className="ph ph-sparkle text-indigo-600"></i>
            Personalized AI Roadmap
          </h3>
          <p className="text-sm text-on-surface-variant mb-6">Based on this session, focus on these actionable steps before your real interview.</p>
          
          <div className="relative border-l border-gray-200 ml-3 space-y-6 pb-4">
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
                Start Practice <i className="ph ph-arrow-right text-[14px]"></i>
              </button>
            </div>
          </div>
        </div>

        {/* Proctoring Integrity (Full Width Bottom) */}
        <div className="col-span-12 bg-surface-container/40 backdrop-blur-2xl border border-white/5 rounded-xl p-8 shadow-[0px_20px_50px_rgba(0,0,0,0.3)]">
          <h3 className="font-bold text-2xl text-on-surface mb-6 flex items-center gap-2 border-b border-gray-200 pb-4">
            <i className="ph ph-shield-check text-red-500"></i>
            Proctoring & Integrity Metrics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white/5 border border-gray-200 p-4 rounded-xl flex flex-col items-center justify-center">
              <i className="ph ph-video-camera text-[32px] text-teal-600 mb-2"></i>
              <span className="text-2xl font-bold text-on-surface">{report.frames_analyzed || 0}</span>
              <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold mt-1 text-center">Frames Analyzed</span>
            </div>
            <div className={`border p-4 rounded-xl flex flex-col items-center justify-center ${report.tab_switch_count > 0 ? 'bg-error/10 border-error/30' : 'bg-white/5 border-gray-200'}`}>
              <span className={`material-symbols-outlined text-[32px] mb-2 ${report.tab_switch_count > 0 ? 'text-error' : 'text-primary'}`}>desktop_windows</span>
              <span className="text-2xl font-bold text-on-surface">{report.tab_switch_count || 0}</span>
              <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold mt-1 text-center">Tab Switches</span>
            </div>
            <div className={`border p-4 rounded-xl flex flex-col items-center justify-center ${report.fullscreen_exit_count > 0 ? 'bg-error/10 border-error/30' : 'bg-white/5 border-gray-200'}`}>
              <span className={`material-symbols-outlined text-[32px] mb-2 ${report.fullscreen_exit_count > 0 ? 'text-error' : 'text-primary'}`}>fullscreen_exit</span>
              <span className="text-2xl font-bold text-on-surface">{report.fullscreen_exit_count || 0}</span>
              <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold mt-1 text-center">Fullscreen Exits</span>
            </div>
            <div className={`border p-4 rounded-xl flex flex-col items-center justify-center ${report.face_missing_count > 0 ? 'bg-error/10 border-error/30' : 'bg-white/5 border-gray-200'}`}>
              <span className={`material-symbols-outlined text-[32px] mb-2 ${report.face_missing_count > 0 ? 'text-error' : 'text-primary'}`}>person_off</span>
              <span className="text-2xl font-bold text-on-surface">{report.face_missing_count || 0}</span>
              <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold mt-1 text-center">Face Missing</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chat History Section */}
      {messages && messages.length > 0 && (
        <div className="mt-8 bg-surface-container/40 backdrop-blur-2xl border border-white/5 rounded-xl p-8 shadow-[0px_20px_50px_rgba(0,0,0,0.3)]">
          <h3 className="font-bold text-2xl text-on-surface mb-6 flex items-center gap-2 border-b border-gray-200 pb-4">
            <i className="ph ph-chats-circle text-teal-600"></i>
            Interview Transcript
          </h3>
          <div className="space-y-6">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex flex-col max-w-[85%] ${msg.is_human ? 'self-end ml-auto items-end' : 'self-start mr-auto items-start'}`}>
                <div className={`p-4 rounded-2xl leading-relaxed text-sm shadow-md ${
                  msg.is_human 
                    ? 'bg-primary/10 border border-primary/20 text-on-surface rounded-br-none' 
                    : 'bg-white/5 border border-white/5 text-on-surface rounded-bl-none'
                }`}>
                  {msg.message === "[REPORT_GENERATION]" ? <em className="text-on-surface-variant opacity-70">Report Generated</em> : msg.message}
                </div>
                {!msg.is_human && msg.credits_used > 0 && (
                  <div className="mt-1.5 flex items-center gap-2 text-[10px] text-on-surface-variant/60 font-medium">
                    <i className="ph ph-database text-[12px]"></i>
                    Tokens: {msg.total_tokens} • Credits: {parseFloat(msg.credits_used).toFixed(4)} • {msg.model_name || 'deepseek-chat'}
                  </div>
                )}
                {msg.is_human && (
                  <div className="mt-1.5 flex items-center gap-1 text-[10px] text-on-surface-variant/60 font-medium">
                    <i className="ph ph-user text-[12px]"></i> You
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
