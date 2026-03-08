import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        console.log('AuthProvider: Initializing auth...');
        setLoading(true);

        // Get the current session
        const {
          data: { session: currentSession },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('AuthProvider: Session error:', sessionError);
        }

        if (!mounted) return;

        if (currentSession) {
          console.log('AuthProvider: Session found, user:', currentSession.user.email);
          setSession(currentSession);
          setUser(currentSession.user);
        } else {
          console.log('AuthProvider: No session found');
          setSession(null);
          setUser(null);
        }

        // Listen for auth state changes
        const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
          console.log('AuthProvider: Auth state changed:', event);
          if (newSession) {
            setSession(newSession);
            setUser(newSession.user);
          } else {
            setSession(null);
            setUser(null);
          }
        });

        return () => {
          if (listener?.subscription) {
            listener.subscription.unsubscribe();
          }
        };
      } catch (e) {
        console.error('AuthProvider: Init error:', e);
        setSession(null);
        setUser(null);
      } finally {
        if (mounted) {
          setLoading(false);
          console.log('AuthProvider: Loading complete');
        }
      }
    }

    const cleanup = init();
    return () => {
      mounted = false;
      if (cleanup && typeof cleanup.then === 'function') {
        cleanup.then((cleanupFn) => {
          if (typeof cleanupFn === 'function') cleanupFn();
        });
      }
    };
  }, []);

  const signInWithEmail = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return { success: true, data };
    } catch (e) {
      console.error('Email sign-in error', e);
      return { success: false, error: e.message || e };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setSession(null);
      setUser(null);
      return { success: true };
    } catch (e) {
      console.error('Sign out error', e);
      return { success: false, error: e.message || e };
    }
  };

  const value = {
    user,
    session,
    loading,
    signInWithEmail,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default AuthProvider;
