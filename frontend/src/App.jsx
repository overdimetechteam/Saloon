import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { OwnerProvider } from './context/OwnerContext';
import { CartProvider } from './context/CartContext';
import RequireRole from './components/RequireRole';
import Navbar from './components/Navbar';
import CartDrawer from './components/CartDrawer';
import SnowEffect from './components/SnowEffect';
import CookieConsent from './components/CookieConsent';

import AdminLayout from './layouts/AdminLayout';
import OwnerLayout from './layouts/OwnerLayout';
import UserLayout from './layouts/UserLayout';

import LandingPage from './pages/LandingPage';
import PortalSelect from './pages/PortalSelect';
import OwnerLogin from './pages/OwnerLogin';
import Login from './pages/Login';
import RegisterClient from './pages/RegisterClient';
import RegisterSalon from './pages/RegisterSalon';
import SalonList from './pages/SalonList';
import SalonDetail from './pages/SalonDetail';
import SalonCosmetics from './pages/SalonCosmetics';
import SalonServices from './pages/SalonServices';
import ProductDetail from './pages/ProductDetail';

import AdminLogin from './pages/AdminLogin';
import AdminEmailVerified from './pages/admin/AdminEmailVerified';
import AdminDashboard from './pages/admin/Dashboard';
import AdminSalons from './pages/admin/Salons';
import AdminSalonDetail from './pages/admin/SalonDetail';
import PendingSalons from './pages/admin/PendingSalons';
import AdminServices from './pages/admin/Services';
import AdminSettings from './pages/admin/Settings';
import AdminCustomers from './pages/admin/Customers';
import AdminCustomerDetail from './pages/admin/CustomerDetail';

import OwnerDashboard from './pages/owner/Dashboard';
import OwnerBookingList from './pages/owner/BookingList';
import OwnerBookingDetail from './pages/owner/BookingDetail';
import OwnerServices from './pages/owner/Services';
import OwnerInventory from './pages/owner/Inventory';
import OwnerGRN from './pages/owner/GRN';
import OwnerSales from './pages/owner/Sales';
import OwnerAdjustments from './pages/owner/Adjustments';
import OwnerReports from './pages/owner/Reports';
import OwnerTeam from './pages/owner/Team';
import OwnerStaffManager from './pages/owner/StaffManager';
import SalonPortalSelect from './pages/SalonPortalSelect';
import EmployeeLogin from './pages/EmployeeLogin';
import EmployeeProfileEditor from './pages/EmployeeProfileEditor';
import { RequireEmployee } from './context/AuthContext';
import OwnerGallery from './pages/owner/Gallery';
import OwnerPromotions from './pages/owner/Promotions';
import OwnerAnalytics  from './pages/owner/Analytics';
import OwnerOffers        from './pages/owner/Offers';
import OwnerSubscription  from './pages/owner/Subscription';

import ResetPassword from './pages/ResetPassword';
import { PaymentSuccess, PaymentCancel } from './pages/PaymentReturn';
import VerifyEmail from './pages/VerifyEmail';
import TwitterCallback from './pages/TwitterCallback';
import UserDashboard from './pages/user/Dashboard';
import UserBookingList from './pages/user/BookingList';
import UserBookingDetail from './pages/user/BookingDetail';
import BookSalon from './pages/user/BookSalon';
import UserFavourites from './pages/user/Favourites';
import UserCosmetics from './pages/user/Cosmetics';
import Checkout from './pages/user/Checkout';
import UserSettings from './pages/user/Settings';
import OwnerSettings from './pages/owner/Settings';
import OwnerOrders from './pages/owner/Orders';
import OwnerOrderDetail from './pages/owner/OrderDetail';
import UserOrders from './pages/user/Orders';
import UserOrderDetail from './pages/user/OrderDetail';

// ── Session timeout ──────────────────────────────────────────────────────────
// Placed inside BrowserRouter so useNavigate works, but above <Routes> so it
// never unmounts during navigation (unlike layout components).
const IDLE_MS   = 30 * 60 * 1000;
const IDLE_EVTS = ['mousemove','mousedown','keypress','touchstart','scroll','click'];

function SessionTimeout() {
  const { profile, logout } = useAuth();
  const navigate   = useNavigate();
  const [expired, setExpired] = useState(false);
  const timerRef   = useRef(null);
  const logoutRef  = useRef(logout);
  const roleRef    = useRef(null);

  // Keep refs current on every render — no deps needed
  useEffect(() => { logoutRef.current = logout; });
  useEffect(() => { if (profile?.role) roleRef.current = profile.role; }, [profile]);

  // Stable reset — no dependencies, registered exactly once
  const reset = useCallback(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      logoutRef.current();
      setExpired(true);
    }, IDLE_MS);
  }, []);

  const loggedIn = !!profile;

  useEffect(() => {
    if (!loggedIn) { clearTimeout(timerRef.current); return; }
    IDLE_EVTS.forEach(e => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      IDLE_EVTS.forEach(e => window.removeEventListener(e, reset));
      clearTimeout(timerRef.current);
    };
  }, [loggedIn, reset]);

  const handleSignIn = () => {
    setExpired(false);
    const role = roleRef.current;
    navigate(
      role === 'salon_owner' ? '/owner/login' :
      role === 'system_admin' ? '/admin/login' :
      '/login'
    );
  };

  if (!expired) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'rgba(0,0,0,.78)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        background: 'var(--surface)', borderRadius: 24, padding: '44px 36px',
        maxWidth: 360, width: '100%', textAlign: 'center',
        border: '1px solid var(--border)',
        boxShadow: '0 40px 100px rgba(0,0,0,.55)',
        animation: 'scaleIn .28s cubic-bezier(.34,1.56,.64,1) both',
      }}>
        <div style={{ fontSize: 46, marginBottom: 16 }}>⏱</div>
        <h3 style={{
          fontFamily: "'Cormorant Garamond',Georgia,serif",
          fontSize: 26, fontWeight: 700, color: 'var(--text)',
          margin: '0 0 10px', letterSpacing: '-0.01em',
        }}>
          Session Expired
        </h3>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 28, lineHeight: 1.65, margin: '0 0 28px' }}>
          You were signed out after 30 minutes of inactivity.
        </p>
        <button
          onClick={handleSignIn}
          style={{
            width: '100%', padding: '13px 24px',
            background: 'linear-gradient(135deg,#0D9488 0%,#14B8A8 100%)',
            color: '#fff', border: 'none', borderRadius: 12,
            fontSize: 15, fontWeight: 700, cursor: 'pointer',
            fontFamily: "'DM Sans',sans-serif",
            boxShadow: '0 6px 20px rgba(13,148,136,.35)',
          }}
        >
          Sign In Again
        </button>
      </div>
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

function PublicLayout() {
  const location = useLocation();
  return (
    <>
      <Navbar />
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      >
        <Outlet />
      </motion.div>
    </>
  );
}

// Shows UserLayout for logged-in clients, PublicLayout for everyone else.
// This keeps the customer navbar consistent on salon browsing pages.
function ClientAwareLayout() {
  const { profile } = useAuth();
  if (profile?.role === 'client') return <UserLayout />;
  return <PublicLayout />;
}

function OwnerLayoutWithProvider() {
  return (
    <OwnerProvider>
      <OwnerLayout />
    </OwnerProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
      <BrowserRouter>
        <SessionTimeout />
        <CookieConsent />
        <CartDrawer />
        <SnowEffect />
        <Routes>
          {/* Entry flow — standalone (no navbar) */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/portal" element={<PortalSelect />} />

          {/* Salon browsing — UserLayout for logged-in clients, PublicLayout for guests */}
          <Route element={<ClientAwareLayout />}>
            <Route path="/salons" element={<SalonList />} />
            <Route path="/salons/:id" element={<SalonDetail />} />
            <Route path="/salons/:id/services" element={<SalonServices />} />
            <Route path="/salons/:id/cosmetics" element={<SalonCosmetics />} />
            <Route path="/salons/:id/cosmetics/:productId" element={<ProductDetail />} />
          </Route>

          {/* Standalone auth pages */}
          <Route path="/owner/login" element={<OwnerLogin />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register/user" element={<RegisterClient />} />
          <Route path="/register/owner" element={<RegisterSalon />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/auth/twitter/callback" element={<TwitterCallback />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/cancel"  element={<PaymentCancel />} />

          {/* Salon portal select + employee login */}
          <Route path="/salon-portal" element={<SalonPortalSelect />} />
          <Route path="/employee/login" element={<EmployeeLogin />} />
          <Route path="/employee/profile" element={
            <RequireEmployee><EmployeeProfileEditor /></RequireEmployee>
          } />

          {/* Admin standalone pages — no auth required */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/email-verified" element={<AdminEmailVerified />} />

          {/* Admin portal — /admin/* */}
          <Route path="/admin" element={<RequireRole roles={['system_admin']} />}>
            <Route element={<AdminLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="salons" element={<AdminSalons />} />
              <Route path="salons/pending" element={<PendingSalons />} />
              <Route path="salons/:id" element={<AdminSalonDetail />} />
              <Route path="services" element={<AdminServices />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="customers" element={<AdminCustomers />} />
              <Route path="customers/:id" element={<AdminCustomerDetail />} />
            </Route>
          </Route>

          {/* Owner portal — /owner/* */}
          <Route path="/owner" element={<RequireRole roles={['salon_owner']} />}>
            <Route element={<OwnerLayoutWithProvider />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<OwnerDashboard />} />
              <Route path="bookings" element={<OwnerBookingList />} />
              <Route path="bookings/:id" element={<OwnerBookingDetail />} />
              <Route path="services" element={<OwnerServices />} />
              <Route path="team" element={<OwnerTeam />} />
              <Route path="staff" element={<OwnerStaffManager />} />
              <Route path="gallery" element={<OwnerGallery />} />
              <Route path="promotions" element={<OwnerPromotions />} />
              <Route path="analytics"  element={<OwnerAnalytics />} />
              <Route path="offers"     element={<OwnerOffers />} />
              <Route path="subscription" element={<OwnerSubscription />} />
              <Route path="inventory" element={<OwnerInventory />} />
              <Route path="inventory/grn" element={<OwnerGRN />} />
              <Route path="inventory/sales" element={<OwnerSales />} />
              <Route path="inventory/adjustments" element={<OwnerAdjustments />} />
              <Route path="reports" element={<OwnerReports />} />
              <Route path="settings" element={<OwnerSettings />} />
              <Route path="orders" element={<OwnerOrders />} />
              <Route path="orders/:id" element={<OwnerOrderDetail />} />
            </Route>
          </Route>

          {/* User portal — /user/* */}
          <Route path="/user" element={<RequireRole roles={['client']} />}>
            <Route element={<UserLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<UserDashboard />} />
              <Route path="bookings" element={<UserBookingList />} />
              <Route path="bookings/:id" element={<UserBookingDetail />} />
              <Route path="book/:salonId" element={<BookSalon />} />
              <Route path="favourites" element={<UserFavourites />} />
              <Route path="cosmetics" element={<UserCosmetics />} />
              <Route path="checkout" element={<Checkout />} />
              <Route path="orders" element={<UserOrders />} />
              <Route path="orders/:id" element={<UserOrderDetail />} />
              <Route path="settings" element={<UserSettings />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}
