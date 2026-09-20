import React, { useState, useEffect } from 'react';
import { SiteContentProvider, useSiteContent } from './context/SiteContentContext';
import { AdminUsersProvider } from './context/AdminUsersContext';
import { ExpensesProvider } from './context/ExpensesContext';
import { AnnouncementBar } from './components/AnnouncementBar';
import { Header } from './components/Header';
import { HeroBanner } from './components/HeroBanner';
import { LocationScheduleSection } from './components/LocationScheduleSection';
import { RentalGuideSection } from './components/RentalGuideSection';
import { OurStorySection } from './components/OurStorySection';
import { InvitationsCustomSection } from './components/InvitationsCustomSection';
import { TestimonialsFAQ } from './components/TestimonialsFAQ';
import { Footer } from './components/Footer';
import { FloatingWhatsApp } from './components/FloatingWhatsApp';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { AdminPage } from './pages/AdminPage';
import { RegisterExpensePage } from './pages/RegisterExpensePage';
import { DynamicCustomPage } from './pages/DynamicCustomPage';
import { registerServiceWorker, updatePWAManifestForRoute } from './utils/pwaManager';

function AppContent() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || '/';
  });
  const { content } = useSiteContent();

  // Register PWA service worker once on mount
  useEffect(() => {
    registerServiceWorker();
  }, []);

  // Update dynamic PWA manifest and icons whenever route or custom branding changes
  useEffect(() => {
    updatePWAManifestForRoute(currentPath, content.branding);
  }, [currentPath, content.branding]);

  // Synchronize browser history and back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const elem = document.getElementById(sectionId);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleNavigate = (path: string) => {
    if (path.startsWith('/#')) {
      const sectionId = path.replace('/#', '');
      if (currentPath !== '/') {
        window.history.pushState({}, '', '/');
        setCurrentPath('/');
        setTimeout(() => scrollToSection(sectionId), 100);
      } else {
        scrollToSection(sectionId);
      }
      return;
    }

    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (currentPath === '/cyc') {
    return <AdminPage onNavigate={handleNavigate} />;
  }

  if (currentPath === '/registrogastos') {
    return <RegisterExpensePage onNavigate={handleNavigate} />;
  }

  // Check if currentPath matches any custom section slug (e.g., /temporada, /promociones)
  const cleanSlug = currentPath.replace(/^\//, '').toLowerCase();
  const matchedCustomPage = (content.customPages || []).find(
    (p) => p.slug.replace(/^\//, '').toLowerCase() === cleanSlug
  );

  return (
    <div className="min-h-screen flex flex-col bg-amber-50/20 text-slate-900 font-sans selection:bg-fuchsia-600 selection:text-white">
      {/* Top Announcement Bar if enabled by Admin in /cyc */}
      <AnnouncementBar onNavigate={handleNavigate} />

      {/* Global Header */}
      <Header
        onNavigate={handleNavigate}
        activePath={currentPath}
      />

      {/* Dynamic View Routing */}
      {currentPath === '/tyc' ? (
        <main className="flex-1">
          <TermsPage onNavigate={handleNavigate} />
        </main>
      ) : currentPath === '/privacidad' ? (
        <main className="flex-1">
          <PrivacyPage onNavigate={handleNavigate} />
        </main>
      ) : matchedCustomPage ? (
        <main className="flex-1">
          <DynamicCustomPage page={matchedCustomPage} onNavigate={handleNavigate} />
        </main>
      ) : (
        <main className="flex-1">
          {/* Hero Section focused on store, location, and requirements */}
          <HeroBanner
            onScrollToLocation={() => scrollToSection('ubicacion')}
            onScrollToRequirements={() => scrollToSection('requisitos')}
            onNavigateTyc={() => handleNavigate('/tyc')}
          />

          {/* Prominent Location & Hours Section */}
          <LocationScheduleSection
            onNavigateToTyc={() => handleNavigate('/tyc')}
            onNavigateToPrivacy={() => handleNavigate('/privacidad')}
          />

          {/* Transparent 4-Step Rental Requirements & Rules */}
          <RentalGuideSection
            onNavigateToTyc={() => handleNavigate('/tyc')}
          />

          {/* Our Story / Founder Cyntia Cárdenas & JoJo's Workshop */}
          <OurStorySection />

          {/* Digital Invitations & Souvenirs CyC */}
          <InvitationsCustomSection />

          {/* Customer Reviews & Interactive FAQ */}
          <TestimonialsFAQ />
        </main>
      )}

      {/* Footer with white logo, legal links, and store information */}
      <Footer onNavigate={handleNavigate} />

      {/* Floating WhatsApp Action Button */}
      <FloatingWhatsApp />
    </div>
  );
}

export default function App() {
  return (
    <SiteContentProvider>
      <AdminUsersProvider>
        <ExpensesProvider>
          <AppContent />
        </ExpensesProvider>
      </AdminUsersProvider>
    </SiteContentProvider>
  );
}
