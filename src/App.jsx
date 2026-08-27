import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext';

import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import LiveTrackingPage from './pages/LiveTrackingPage';

import HomePage from './pages/HomePage';
import ReportIssuePage from './pages/ReportIssuePage';
import MyReportsPage from './pages/MyReportsPage';
import TrackReportPage from './pages/TrackReportPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import ScanSmartBinPage from './pages/ScanSmartBinPage';
import MyCarbonCardPage from './pages/MyCarbonCardPage'; // <-- Imported the new My Carbon Card page
import ScanVehicleQRPage from './pages/ScanVehicleQRPage'; // <-- QR scan page
import ReportDeadAnimalPage from './pages/ReportDeadAnimalPage'; // <-- Dead animal alert page
import GreenRewardsPage from './pages/GreenRewardsPage'; // <-- Green Rewards information & policy page

// Fallback environment variable for Google Client ID
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

/**
 * Higher-Order Component to protect private routes
 */
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <p>Loading application...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <BrowserRouter>
          <div className="app-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Navbar />
            <main style={{ flex: 1 }}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/home" element={<Navigate to="/" replace />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/track/:reportId" element={<TrackReportPage />} />
                <Route path="/live-tracking" element={<LiveTrackingPage />} />
                
                {/* QR Scan Route - Can be accessed by anyone (citizens) */}
                <Route path="/citizen/scan" element={<ScanVehicleQRPage />} />

                {/* Dead Animal Alert Complaint Route */}
                <Route path="/report-dead-animal" element={<ReportDeadAnimalPage />} />

                {/* Green Rewards Information & Redemption Guide Route */}
                <Route path="/green-rewards" element={<GreenRewardsPage />} />
                <Route path="/how-to-redeem" element={<GreenRewardsPage />} />

                {/* Protected Citizen / Role-Based Routes */}
                <Route
                  path="/report-issue"
                  element={
                    <ProtectedRoute>
                      <ReportIssuePage />
                    </ProtectedRoute>
                  }
                />
                
                {/* Scan Smart Bin Route */}
                <Route
                  path="/scan-bin"
                  element={
                    <ProtectedRoute>
                      <ScanSmartBinPage />
                    </ProtectedRoute>
                  }
                />

                {/* My Carbon Card Route */}
                <Route
                  path="/my-carbon-card"
                  element={
                    <ProtectedRoute>
                      <MyCarbonCardPage />
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/my-reports"
                  element={
                    <ProtectedRoute>
                      <MyReportsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />

                {/* Fallback Catch-All */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}