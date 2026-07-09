import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useParams, Navigate, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import AuthPage from './components/AuthPage';
import InterviewSelector from './components/InterviewSelector';
import InterviewSession from './components/InterviewSession';
import { AuthProvider, useAuth } from './context/AuthContext';
import Dashboard from './components/Dashboard';
import InterviewReports from './components/InterviewReports';
import ReportDetail from './components/ReportDetail';
import Settings from './components/Settings';
import { NotificationProvider } from './context/NotificationContext';
import { BillingProvider } from './context/BillingContext';
import Billing from './components/Billing';
import Loader from './components/Loader';
import './index.css';
import './assets/styles/login.css'; // New Login UI styles

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <Loader text="Loading..." />;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <Loader text="Loading..." />;
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
  const navigate = useNavigate();

  const handleSelect = (template, session, extractedCvText) => {
    setActiveInterview(template);
    setActiveSession(session);
    setCvText(extractedCvText);
  };

  const handleEnd = () => {
    setActiveInterview(null);
    setActiveSession(null);
    setCvText(null);
    navigate('/', { replace: true });
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
            <Route path="/login" element={<PublicRoute><AuthPage /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><AuthPage /></PublicRoute>} />

            {/* Protected Main Application Routes inside Layout */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <BillingProvider>
                    <Layout>
                      <Routes>
                        <Route path="/live-interview" element={<LiveInterviewRoute />} />
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/billing" element={<Billing />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/interview-report" element={<InterviewReports />} />
                        <Route path="/interview-report/:id" element={<ReportDetail />} />
                      </Routes>
                    </Layout>
                  </BillingProvider>
                </ProtectedRoute>
              }
            />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
