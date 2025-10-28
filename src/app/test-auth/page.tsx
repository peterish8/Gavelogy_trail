"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';

export default function TestAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth event:', event, session?.user?.email);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'password123'
    });
    
    if (error) {
      console.error('Login error:', error);
    } else {
      console.log('Login success:', data);
      window.location.href = '/dashboard';
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">Auth Test</h1>
      
      {user ? (
        <div>
          <p>Logged in as: {user.email}</p>
          <a href="/dashboard" className="bg-green-500 text-white px-4 py-2 rounded inline-block">
            Go to Dashboard
          </a>
        </div>
      ) : (
        <div>
          <p>Not logged in</p>
          <button onClick={handleLogin} className="bg-blue-500 text-white px-4 py-2 rounded">
            Test Login
          </button>
        </div>
      )}
    </div>
  );
}