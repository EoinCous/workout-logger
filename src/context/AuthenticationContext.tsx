import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { PropsWithChildren } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../supabase/supabaseClient';

type AuthenticationContextValue = {
  user: User | null;
  authenticationLoading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<
    Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>['data']
  >;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<
    Awaited<ReturnType<typeof supabase.auth.updateUser>>['data']
  >;
  logout: () => Promise<void>;
};

const AuthenticationContext = createContext<AuthenticationContextValue | null>(null);

export const AuthenticationProvider = ({ children }: PropsWithChildren) => {
  const [user, setUser] = useState<User | null>(null);
  const [authenticationLoading, setAuthenticationLoading] = useState(true);
  const authEventVersion = useRef(0);

  useEffect(() => {
    let isMounted = true;
    const initialAuthEventVersion = authEventVersion.current;

    const init = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        const session = data.session;

        if (!isMounted || authEventVersion.current !== initialAuthEventVersion) return;

        if (session) {
          const isExpired = session.expires_at !== undefined &&
            session.expires_at * 1000 < Date.now();
          if (isExpired) {
            const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' });
            if (signOutError) throw signOutError;
            if (!isMounted || authEventVersion.current !== initialAuthEventVersion) return;
            setUser(null);
          } else {
            setUser(session.user);
          }
        } else {
          setUser(null);
        }
      } catch (e) {
        if (isMounted && authEventVersion.current === initialAuthEventVersion) {
          console.error("Failed to get initial session:", e);
          setUser(null);
        }
      } finally {
        if (isMounted) setAuthenticationLoading(false);
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      authEventVersion.current += 1;
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
      } else {
        setUser(session.user);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    if (error) throw error;
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    const { data, error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    return data;
  }, []);

  const logout = useCallback(async () => {
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error?.name === 'AuthSessionMissingError') {
      setUser(null);
      return;
    }
    if (error) throw error;
  }, []);

  const value: AuthenticationContextValue = useMemo(
    () => ({ user, authenticationLoading, signUp, login, resetPassword, updatePassword, logout }),
    [user, authenticationLoading, signUp, login, resetPassword, updatePassword, logout]
  );

  return (
    <AuthenticationContext.Provider value={value}>
      {children}
    </AuthenticationContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuthentication = (): AuthenticationContextValue => {
  const context = useContext(AuthenticationContext);
  if (!context) {
    throw new Error('useAuthentication must be used within an AuthenticationProvider');
  }
  return context;
};