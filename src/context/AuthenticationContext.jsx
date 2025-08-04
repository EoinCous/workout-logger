import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabase/supabaseClient';

const AuthenticationContext = createContext();

export const AuthenticationProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authenticationLoading, setAuthenticationLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // initialize session
    const init = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!isMounted) return;
        setUser(data.session?.user ?? null);
      } catch (e) {
        console.error("Failed to get initial session:", e);
        if (!isMounted) return;
        setUser(null);
      } finally {
        if (!isMounted) return;
        setAuthenticationLoading(false);
      }
    };
    init();

    // subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  };

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('Login error:', error.message);
      throw error;
    }
    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const userId = user?.id ?? null;
  const userEmail = user?.email ?? null;

  return (
    <AuthenticationContext.Provider value={{ userId, userEmail, authenticationLoading, signUp, login, logout }}>
      {children}
    </AuthenticationContext.Provider>
  );
};

export const useAuthentication = () => useContext(AuthenticationContext);