import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileScan, Truck, Settings, Bell, User, FileText, BarChart2, Sparkles, LogOut, Map as MapIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import AiSearchModal from '../components/AiSearchModal';
import './DashboardLayout.css';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/ocr', label: 'OCR Center', icon: FileScan },
  { path: '/bills', label: 'Bill Management', icon: FileText },
  { path: '/dispatch', label: 'Dispatch', icon: Truck },
  { path: '/map', label: 'Live Map', icon: MapIcon },
  { path: '/reports', label: 'Reports', icon: BarChart2 },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout-container">
      {/* Sidebar */}
      <aside className="sidebar glass-panel">
        <div className="sidebar-header">
          <div className="logo-box">
            <Truck size={24} color="#fff" />
          </div>
          <h2 className="brand-title">Progress<br/><span className="text-primary">Logistic</span></h2>
        </div>
        
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            // Role-based visibility logic
            if (user?.role === 'DATA_ENTRY' && !['/ocr', '/settings'].includes(item.path)) return null;
            if (user?.role === 'DISPATCHER' && !['/dashboard', '/dispatch', '/vehicles', '/bills', '/map'].includes(item.path)) return null;
            
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="main-content">
        {/* Topbar */}
        <header className="topbar glass-panel">
          <div className="search-bar" onClick={() => setIsAiModalOpen(true)} style={{ cursor: 'pointer' }}>
            <Sparkles size={18} className="text-primary animate-pulse" />
            <input 
              type="text" 
              placeholder="Ask AI or Search anything..." 
              className="search-input" 
              readOnly 
              style={{ cursor: 'pointer' }}
            />
          </div>
          <div className="topbar-actions relative">
            <button className="btn-icon relative" onClick={() => setShowNotifications(!showNotifications)}>
              <Bell size={20} />
              <span className="absolute top-0 right-0 w-2 h-2 bg-danger rounded-full animate-pulse"></span>
            </button>
            
            {showNotifications && (
              <div className="notifications-dropdown absolute right-0 top-12 w-80 bg-slate-800 rounded-lg shadow-[0_10px_40px_rgba(0,0,0,0.5)] border border-slate-700 p-4 z-50 animate-fade-in" style={{right: '160px', backgroundColor: 'var(--bg-card)', backdropFilter: 'var(--glass-blur)'}}>
                <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
                  <h3 className="font-semibold text-white">Escalation Alerts</h3>
                  <span className="badge badge-danger">1 Critical</span>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="p-3 bg-red-900/20 rounded-md border border-red-500/30">
                    <h4 className="font-semibold text-red-400 text-sm mb-1">Not Closed &gt; 48h</h4>
                    <p className="text-xs text-slate-400">Bill BL-2023-005 has been pending delivery for over 48 hours.</p>
                  </div>
                  <div className="p-3 bg-amber-900/20 rounded-md border border-amber-500/30">
                    <h4 className="font-semibold text-amber-400 text-sm mb-1">OCR Pending &gt; 4h</h4>
                    <p className="text-xs text-slate-400">3 documents are waiting in the OCR queue.</p>
                  </div>
                </div>
              </div>
            )}

            <div className="user-profile relative" onClick={() => setShowUserMenu(!showUserMenu)} style={{ cursor: 'pointer' }}>
              <div className="avatar">
                <User size={20} />
              </div>
              <div className="user-info">
                <span className="user-name">{user?.name || 'Unknown'}</span>
                <span className="user-role">{user?.role || 'Guest'}</span>
              </div>
              
              {showUserMenu && (
                <div className="absolute right-0 top-12 w-48 bg-gray-800 rounded-lg shadow-lg border border-gray-700 py-1 z-50 animate-fade-in">
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-red-400 hover:bg-gray-700 flex items-center gap-2 transition-colors"
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="page-container animate-fade-in">
          <Outlet />
        </main>
      </div>

      <AiSearchModal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} />
    </div>
  );
}
