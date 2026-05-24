import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Mail, Lock, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // For 3D Tilt Effect
  const [tiltStyle, setTiltStyle] = useState({ transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg)' });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left; // x position within the element
    const y = e.clientY - rect.top;  // y position within the element
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = ((y - centerY) / centerY) * -5; // Max 5 deg tilt
    const rotateY = ((x - centerX) / centerX) * 5;  // Max 5 deg tilt
    
    setTiltStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`
    });
  };

  const handleMouseLeave = () => {
    setTiltStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)'
    });
  };

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate('/dashboard');
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: 'ERP Executive',
              role: 'ADMIN'
            }
          }
        });
        if (error) throw error;
        setSuccessMsg('Account created successfully! Please sign in.');
        setIsLogin(true);
        setPassword('');
      }
    } catch (error: any) {
      setErrorMsg(error.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      
      {/* Ambient Glow */}
      <div className="ambient-bg">
        <div className="ambient-orb orb-orange"></div>
        <div className="ambient-orb orb-white"></div>
      </div>

      {/* Main Login Card */}
      <div 
        className="premium-login-card"
        style={tiltStyle}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        
        <div className="brand-header">
          <div className="brand-icon-wrap animate-float-logo">
            <Truck size={32} color="white" />
          </div>
          <h1 className="brand-title">
            Progress<span className="text-orange">Logistic</span>
          </h1>
          <p className="brand-subtitle">
            Secure Authentication Portal
          </p>
        </div>

        <div key={isLogin ? 'login' : 'signup'}>
          <div className="text-center mb-6 stagger-1">
            <h2 className="text-xl font-bold text-white mb-1">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-gray-400 text-sm">
              {isLogin ? 'Sign in to access your workspace' : 'Register a new logistics account'}
            </p>
          </div>

          {errorMsg && (
            <div className="premium-alert error stagger-1">
              <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
              <span className="leading-snug">{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="premium-alert success stagger-1">
              <ShieldCheck size={20} className="mt-0.5 flex-shrink-0" />
              <span className="leading-snug">{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="input-wrapper stagger-2">
              <Mail size={20} className="input-icon" />
              <input 
                type="email" 
                placeholder="Email Address" 
                className="premium-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="input-wrapper stagger-3">
              <Lock size={20} className="input-icon" />
              <input 
                type="password" 
                placeholder="Password" 
                className="premium-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <div className="stagger-4">
              <button 
                type="submit"
                className="premium-btn btn-glow-pulse"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 size={20} className="animate-spin" /> : null}
                {isLogin ? 'Sign In' : 'Create Account'}
              </button>
            </div>
          </form>
        </div>

        <div className="secondary-action">
          {isLogin ? "Don't have an account?" : "Already registered?"}
          <button 
            type="button" 
            className="text-link"
            onClick={() => {
              setIsLogin(!isLogin);
              setErrorMsg('');
              setSuccessMsg('');
            }}
          >
            {isLogin ? "Sign up" : "Sign in"}
          </button>
        </div>

      </div>
    </div>
  );
}
