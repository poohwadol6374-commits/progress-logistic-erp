import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import BillList from './pages/BillList';
import DispatchBoard from './pages/DispatchBoard';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import OcrCenter from './pages/OcrCenter';
import Vehicles from './pages/Vehicles';
import DriverApp from './pages/DriverApp';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/driver" element={<DriverApp />} />

          {/* Protected Admin Routes */}
          <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="bills" element={<BillList />} />
            <Route path="dispatch" element={<DispatchBoard />} />
            <Route path="reports" element={<Reports />} />
            <Route path="ocr" element={<OcrCenter />} />
            <Route path="vehicles" element={<Vehicles />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
