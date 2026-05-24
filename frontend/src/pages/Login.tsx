import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, ShieldCheck, UserCog, ScanLine, ChevronRight, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { Role, User } from '../contexts/AuthContext';
import './Login.css';

const MOCK_USERS: Record<Role, User> = {
  ADMIN: { id: 'U001', name: 'Super Admin', role: 'ADMIN' },
  DISPATCHER: { id: 'U002', name: 'John Dispatcher', role: 'DISPATCHER' },
  DATA_ENTRY: { id: 'U003', name: 'Sarah OCR', role: 'DATA_ENTRY' }
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<Role | null>(null);

  const handleLogin = (role: Role) => {
    setIsLoading(role);
    // Simulate network delay for effect
    setTimeout(() => {
      login(MOCK_USERS[role]);
      navigate('/dashboard');
    }, 1200);
  };

  return (
    <div className="login-container">
      {/* Background with abstract shapes */}
      <div className="bg-shape shape-1"></div>
      <div className="bg-shape shape-2"></div>
      <div className="bg-shape shape-3"></div>

      <div className="login-glass-card animate-fade-in-up">
        <div className="login-header">
          <div className="brand-logo-container">
            <div className="brand-logo shadow-[0_0_20px_rgba(255,107,0,0.4)]">
              <Truck size={32} color="#fff" />
            </div>
          </div>
          <h1 className="brand-name">Progress <span className="text-primary">Logistic</span></h1>
          <p className="brand-slogan">Intelligent Dispatch Platform</p>
          
          <div className="security-badge mt-4 flex items-center justify-center gap-1 text-emerald-400 text-xs font-semibold px-3 py-1 bg-emerald-900/30 rounded-full border border-emerald-800/50 w-max mx-auto">
            <ShieldCheck size={14} /> <span>Enterprise Secured</span>
          </div>
        </div>

        <div className="login-body mt-8">
          <p className="text-center text-sm text-gray-400 mb-6">Select your role to access the workspace</p>
          
          <div className="role-buttons flex flex-col gap-3">
            <button 
              className={`role-btn admin-role ${isLoading === 'ADMIN' ? 'loading' : ''}`} 
              onClick={() => handleLogin('ADMIN')}
              disabled={isLoading !== null}
            >
              <div className="flex items-center gap-4">
                <div className="role-icon"><ShieldCheck size={20} /></div>
                <div className="text-left">
                  <div className="font-semibold text-white">Administrator</div>
                  <div className="text-xs text-blue-200/70">Full System Access & Analytics</div>
                </div>
              </div>
              {isLoading === 'ADMIN' ? <Loader2 className="animate-spin text-white" size={20}/> : <ChevronRight size={20} className="text-gray-500" />}
            </button>

            <button 
              className={`role-btn dispatcher-role ${isLoading === 'DISPATCHER' ? 'loading' : ''}`} 
              onClick={() => handleLogin('DISPATCHER')}
              disabled={isLoading !== null}
            >
              <div className="flex items-center gap-4">
                <div className="role-icon"><UserCog size={20} /></div>
                <div className="text-left">
                  <div className="font-semibold text-white">Dispatcher</div>
                  <div className="text-xs text-orange-200/70">Manage Fleet & Assignments</div>
                </div>
              </div>
              {isLoading === 'DISPATCHER' ? <Loader2 className="animate-spin text-white" size={20}/> : <ChevronRight size={20} className="text-gray-500" />}
            </button>

            <button 
              className={`role-btn data-role ${isLoading === 'DATA_ENTRY' ? 'loading' : ''}`} 
              onClick={() => handleLogin('DATA_ENTRY')}
              disabled={isLoading !== null}
            >
              <div className="flex items-center gap-4">
                <div className="role-icon"><ScanLine size={20} /></div>
                <div className="text-left">
                  <div className="font-semibold text-white">OCR / Data Entry</div>
                  <div className="text-xs text-emerald-200/70">Document Scanning & Verify</div>
                </div>
              </div>
              {isLoading === 'DATA_ENTRY' ? <Loader2 className="animate-spin text-white" size={20}/> : <ChevronRight size={20} className="text-gray-500" />}
            </button>
          </div>
        </div>

        <div className="login-footer mt-8 text-center text-xs text-gray-500">
          <p>This is a simulated authentication portal.</p>
          <p className="mt-1">© 2026 Progress Logistic ERP V1.0</p>
        </div>
      </div>
    </div>
  );
}
