import { BrowserRouter, Routes, Route, useLocation, Link } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { GuestRoute } from "./components/GuestRoute";
import { AdminOnlyRoute } from "./components/AdminOnlyRoute";
import { DashboardLayout } from "./components/DashboardLayout";
import { RestaurantLayout } from "./components/RestaurantLayout";
import { AppToaster } from "./components/ui/Toast";
import { ModuleGate } from "./components/public/ModuleGate";
import "./App.css";

// Lazy-loaded pages (code splitting)
const SaasLandingPage = lazy(() => import("./pages/SaasLandingPage"));
const HomeSwitch = lazy(() => import("./pages/HomeSwitch"));
const EmbedReservation = lazy(() => import("./pages/EmbedReservation"));
const GalleryPage = lazy(() => import("./pages/GalleryPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const PublicReservation = lazy(() => import("./pages/PublicReservation"));
const CancelReservation = lazy(() => import("./pages/CancelReservation"));
const PublicMenuPage = lazy(() => import("./pages/PublicMenuPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const DashboardIndex = lazy(() => import("./pages/DashboardIndex"));
const MenuPage = lazy(() => import("./pages/MenuPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const SiteImagesPage = lazy(() => import("./pages/SiteImagesPage"));
const SeoChecklistPage = lazy(() => import("./pages/SeoChecklistPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-coffee-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function AdminFloatingButton() {
  const { user, loading } = useAuth();
  const { pathname } = useLocation();

  if (loading || !user) return null;
  if (pathname.startsWith("/dashboard") || pathname === "/login" || pathname === "/register" || pathname === "/") {
    return null;
  }

  return (
    <Link
      to="/dashboard"
      className="fixed bottom-6 left-6 z-50 flex items-center gap-2 px-4 py-2.5 bg-coffee-600 hover:bg-coffee-500 text-cream-50 text-sm font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path fillRule="evenodd" d="M4.25 2A2.25 2.25 0 0 0 2 4.25v2.5A2.25 2.25 0 0 0 4.25 9h2.5A2.25 2.25 0 0 0 9 6.75v-2.5A2.25 2.25 0 0 0 6.75 2h-2.5Zm0 9A2.25 2.25 0 0 0 2 13.25v2.5A2.25 2.25 0 0 0 4.25 18h2.5A2.25 2.25 0 0 0 9 15.75v-2.5A2.25 2.25 0 0 0 6.75 11h-2.5Zm9-9A2.25 2.25 0 0 0 11 4.25v2.5A2.25 2.25 0 0 0 13.25 9h2.5A2.25 2.25 0 0 0 18 6.75v-2.5A2.25 2.25 0 0 0 15.75 2h-2.5Zm0 9A2.25 2.25 0 0 0 11 13.25v2.5A2.25 2.25 0 0 0 13.25 18h2.5A2.25 2.25 0 0 0 18 15.75v-2.5A2.25 2.25 0 0 0 15.75 11h-2.5Z" clipRule="evenodd" />
      </svg>
      Admin
    </Link>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ScrollToTop />
          <AppToaster />
          <AdminFloatingButton />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* SaaS landing page */}
              <Route path="/" element={<SaasLandingPage />} />

              {/* Embed route — chrome-free reservation flow served in the widget iframe */}
              <Route path="/embed/reserve" element={<EmbedReservation />} />

              {/* Restaurant public site — /r/:slug/* */}
              <Route path="/r/:slug" element={<RestaurantLayout />}>
                <Route index element={<HomeSwitch />} />
                <Route path="gallery" element={<ModuleGate feature="gallery_enabled"><GalleryPage /></ModuleGate>} />
                <Route path="contact" element={<ModuleGate feature="contact_enabled"><ContactPage /></ModuleGate>} />
                <Route path="reservation" element={<ModuleGate feature="reservations_enabled"><PublicReservation /></ModuleGate>} />
                <Route path="cancel" element={<ModuleGate feature="cancellation_enabled"><CancelReservation /></ModuleGate>} />
                <Route path="menu" element={<ModuleGate feature="menu_enabled"><PublicMenuPage /></ModuleGate>} />
                <Route path="privacy" element={<PrivacyPage />} />
                <Route path="terms" element={<TermsPage />} />
              </Route>

              {/* Auth — global routes */}
              <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
              <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

              {/* Auth — tenant-scoped: /r/:slug/login shows that restaurant's branding */}
              <Route path="/r/:slug/login" element={<GuestRoute><Login /></GuestRoute>} />
              <Route path="/r/:slug/register" element={<GuestRoute><Register /></GuestRoute>} />

              {/* Admin dashboard */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardIndex />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="menu" element={<MenuPage />} />
                <Route path="images" element={<SiteImagesPage />} />
                <Route path="seo" element={<SeoChecklistPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="admin" element={<AdminOnlyRoute><AdminPage /></AdminOnlyRoute>} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
