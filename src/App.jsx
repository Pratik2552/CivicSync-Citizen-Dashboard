import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

import HomePage        from './pages/HomePage';
import ReportIssuePage from './pages/ReportIssuePage';
import MyReportsPage   from './pages/MyReportsPage';
import TrackReportPage from './pages/TrackReportPage';
import ProfilePage     from './pages/ProfilePage';
import LoginPage       from './pages/LoginPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <main>
          <Routes>
            {/* Public landing */}
            <Route path="/"            element={<HomePage />} />
            <Route path="/home"        element={<Navigate to="/" replace />} />

            {/* Reporting */}
            <Route path="/report-issue" element={<ReportIssuePage />} />

            {/* Tracking */}
            <Route path="/my-reports"       element={<MyReportsPage />} />
            <Route path="/track/:reportId"  element={<TrackReportPage />} />

            {/* Profile */}
            <Route path="/profile" element={<ProfilePage />} />

            {/* Auth */}
            <Route path="/login"   element={<LoginPage />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </BrowserRouter>
    </AuthProvider>
  );
}
