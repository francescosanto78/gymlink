import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Starfield from './components/Starfield';
import CookieBanner from './components/CookieBanner';
import HomePage from './pages/HomePage';
import StatsPage from './pages/StatsPage';
import TutorialPage from './pages/TutorialPage';
import EditorPage from './pages/EditorPage';
import WorkoutViewPage from './pages/WorkoutViewPage';
import ClientGuidePage from './pages/ClientGuidePage';
import AdminMaintenancePage from './pages/AdminMaintenancePage';
import { trackPageView } from './services/analyticsService';

function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location]);

  return null;
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <Router>
          <AnalyticsTracker />
          <Starfield />
          <div className="relative z-10 flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/editor" element={<EditorPage />} />
                <Route path="/edit/:id" element={<EditorPage />} />
                <Route path="/w/:id" element={<WorkoutViewPage />} />
                <Route path="/workout/:id" element={<WorkoutViewPage />} />
                <Route path="/tutorial" element={<TutorialPage />} />
                <Route path="/guida" element={<ClientGuidePage />} />
                <Route path="/stats" element={<StatsPage />} />
                <Route path="/admin" element={<AdminMaintenancePage />} />
                <Route path="/manutenzione" element={<AdminMaintenancePage />} />
                {/* Fallback to Home */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
            <CookieBanner />
          </div>
        </Router>
      </LanguageProvider>
    </ThemeProvider>
  );
}
