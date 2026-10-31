import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../supabase/supabaseClient';

const AuthenticationContext = createContext(null);

export const AuthenticationProvider = ({ children }) => {
  const [user, setUser] = useState(null);
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
          const isExpired = session.expires_at * 1000 < Date.now();
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

  const signUp = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  }, []);

  const login = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
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

  const value = useMemo(
    () => ({ user, authenticationLoading, signUp, login, logout }),
    [user, authenticationLoading, signUp, login, logout]
  );

  return (
    <AuthenticationContext.Provider value={value}>
      {children}
    </AuthenticationContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuthentication = () => {
  const context = useContext(AuthenticationContext);
  if (!context) {
    throw new Error('useAuthentication must be used within an AuthenticationProvider');
  }
  return context;
};