import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

export type Role = 'ADMIN' | 'DISPATCHER' | 'DATA_ENTRY';

export interface User {
  id: string;
  name: string;
  role: Role;
  email: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(formatUser(session?.user));
      setLoading(false);
    });

    // 2. Listen for auth changes (Login, Logout, Token Refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(formatUser(session?.user));
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Helper to map Supabase User to our local User interface
  const formatUser = (supabaseUser: any): User | null => {
    if (!supabaseUser) return null;
    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      name: supabaseUser.user_metadata?.name || 'Admin User',
      role: (supabaseUser.user_metadata?.role as Role) || 'ADMIN',
    };
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, logout, isAuthenticated: !!user, loading }}>
      {loading ? (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#0a0a0a]">
          <Loader2 size={48} className="animate-spin text-primary mb-4" />
          <p className="text-gray-400">กำลังเชื่อมต่อกับระบบรักษาความปลอดภัย...</p>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
