import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';

import Login from './pages/Login';
import RegisterClient from './pages/RegisterClient';
import RegisterSalon from './pages/RegisterSalon';
import SalonList from './pages/SalonList';
import SalonDetail from './pages/SalonDetail';

import ClientDashboard from './pages/client/Dashboard';
import ClientBookingList from './pages/client/BookingList';
import ClientBookingDetail from './pages/client/BookingDetail';
import BookSalon from './pages/client/BookSalon';

import SalonDashboard from './pages/salon/Dashboard';
import SalonBookingList from './pages/salon/BookingList';
import SalonBookingDetail from './pages/salon/BookingDetail';
import SalonServices from './pages/salon/Services';
import Inventory from './pages/salon/Inventory';
import GRNPage from './pages/salon/GRN';
import SalesPage from './pages/salon/Sales';
import AdjustmentsPage from './pages/salon/Adjustments';
import Reports from './pages/salon/Reports';

import AdminSalons from './pages/admin/Salons';
import PendingSalons from './pages/admin/PendingSalons';
import AdminServices from './pages/admin/Services';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Navigate to="/salons" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register/client" element={<RegisterClient />} />
          <Route path="/register/salon" element={<RegisterSalon />} />
          <Route path="/salons" element={<SalonList />} />
          <Route path="/salons/:id" element={<SalonDetail />} />

          <Route path="/client/dashboard" element={<PrivateRoute roles={['client']}><ClientDashboard /></PrivateRoute>} />
          <Route path="/client/bookings" element={<PrivateRoute roles={['client']}><ClientBookingList /></PrivateRoute>} />
          <Route path="/client/bookings/:id" element={<PrivateRoute roles={['client']}><ClientBookingDetail /></PrivateRoute>} />
          <Route path="/client/book/:salonId" element={<PrivateRoute roles={['client']}><BookSalon /></PrivateRoute>} />

          <Route path="/salon/dashboard" element={<PrivateRoute roles={['salon_owner']}><SalonDashboard /></PrivateRoute>} />
          <Route path="/salon/bookings" element={<PrivateRoute roles={['salon_owner']}><SalonBookingList /></PrivateRoute>} />
          <Route path="/salon/bookings/:id" element={<PrivateRoute roles={['salon_owner']}><SalonBookingDetail /></PrivateRoute>} />
          <Route path="/salon/services" element={<PrivateRoute roles={['salon_owner']}><SalonServices /></PrivateRoute>} />
          <Route path="/salon/inventory" element={<PrivateRoute roles={['salon_owner']}><Inventory /></PrivateRoute>} />
          <Route path="/salon/inventory/grn" element={<PrivateRoute roles={['salon_owner']}><GRNPage /></PrivateRoute>} />
          <Route path="/salon/inventory/sales" element={<PrivateRoute roles={['salon_owner']}><SalesPage /></PrivateRoute>} />
          <Route path="/salon/inventory/adjustments" element={<PrivateRoute roles={['salon_owner']}><AdjustmentsPage /></PrivateRoute>} />
          <Route path="/salon/reports" element={<PrivateRoute roles={['salon_owner']}><Reports /></PrivateRoute>} />

          <Route path="/admin/salons" element={<PrivateRoute roles={['system_admin']}><AdminSalons /></PrivateRoute>} />
          <Route path="/admin/salons/pending" element={<PrivateRoute roles={['system_admin']}><PendingSalons /></PrivateRoute>} />
          <Route path="/admin/services" element={<PrivateRoute roles={['system_admin']}><AdminServices /></PrivateRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
