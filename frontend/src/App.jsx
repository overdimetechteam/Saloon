import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { OwnerProvider } from './context/OwnerContext';
import RequireRole from './components/RequireRole';
import Navbar from './components/Navbar';

import AdminLayout from './layouts/AdminLayout';
import OwnerLayout from './layouts/OwnerLayout';
import UserLayout from './layouts/UserLayout';

import Login from './pages/Login';
import RegisterClient from './pages/RegisterClient';
import RegisterSalon from './pages/RegisterSalon';
import SalonList from './pages/SalonList';
import SalonDetail from './pages/SalonDetail';

import AdminSalons from './pages/admin/Salons';
import PendingSalons from './pages/admin/PendingSalons';
import AdminServices from './pages/admin/Services';

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

import UserDashboard from './pages/user/Dashboard';
import UserBookingList from './pages/user/BookingList';
import UserBookingDetail from './pages/user/BookingDetail';
import BookSalon from './pages/user/BookSalon';

function PublicLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
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
      <BrowserRouter>
        <Routes>
          {/* Public pages with top navbar */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Navigate to="/salons" replace />} />
            <Route path="/salons" element={<SalonList />} />
            <Route path="/salons/:id" element={<SalonDetail />} />
          </Route>

          {/* Standalone auth pages */}
          <Route path="/login" element={<Login />} />
          <Route path="/register/user" element={<RegisterClient />} />
          <Route path="/register/owner" element={<RegisterSalon />} />

          {/* Admin portal — /admin/* */}
          <Route path="/admin" element={<RequireRole roles={['system_admin']} />}>
            <Route element={<AdminLayout />}>
              <Route index element={<Navigate to="salons" replace />} />
              <Route path="salons" element={<AdminSalons />} />
              <Route path="salons/pending" element={<PendingSalons />} />
              <Route path="services" element={<AdminServices />} />
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
              <Route path="inventory" element={<OwnerInventory />} />
              <Route path="inventory/grn" element={<OwnerGRN />} />
              <Route path="inventory/sales" element={<OwnerSales />} />
              <Route path="inventory/adjustments" element={<OwnerAdjustments />} />
              <Route path="reports" element={<OwnerReports />} />
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
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
