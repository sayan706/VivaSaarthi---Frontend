import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useParams, Navigate, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './components/Login';
import Signup from './components/Signup';
import InterviewSelector from './components/InterviewSelector';
import InterviewSession from './components/InterviewSession';
import { AuthProvider, useAuth } from './context/AuthContext';
import Dashboard from './components/Dashboard';
import InterviewReports from './components/InterviewReports';
import ReportDetail from './components/ReportDetail';
import Settings from './components/Settings';
import { NotificationProvider } from './context/NotificationContext';
import './index.css';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#0b1326] text-primary">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-10 w-10 text-primary" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm font-semibold tracking-wider">Syncing workspace...</span>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#0b1326] text-primary">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-10 w-10 text-primary" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm font-semibold tracking-wider">Syncing workspace...</span>
        </div>
      </div>
    );
  }
  
  if (user) {
    return <Navigate to="/" replace />;
  }
  
  return children;
}





function LiveInterviewRoute() {
  const [activeInterview, setActiveInterview] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [cvText, setCvText] = useState(null);

  const handleSelect = (template, session, extractedCvText) => {
    setActiveInterview(template);
    setActiveSession(session);
    setCvText(extractedCvText);
  };

  const handleEnd = () => {
    setActiveInterview(null);
    setActiveSession(null);
    setCvText(null);
  };

  if (!activeSession) {
    return <InterviewSelector onSelect={handleSelect} />;
  }

  return (
    <InterviewSession
      interview={activeInterview}
      session={activeSession}
      cvText={cvText}
      onEnd={handleEnd}
    />
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />

            {/* Protected Main Application Routes inside Layout */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/live-interview" element={<LiveInterviewRoute />} />
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/interview-report" element={<InterviewReports />} />
                      <Route path="/interview-report/:id" element={<ReportDetail />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
