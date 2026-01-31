"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function SimpleLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginData.user) {
        window.location.href = '/dashboard';
        return;
      }

      if (loginError?.message.includes('Invalid login credentials')) {
        const { data: signupData } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signupData.user) {
          window.location.href = '/dashboard';
          return;
        }
      }

      alert('Authentication failed');
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl mb-4">Simple Login</h1>
      
      <form onSubmit={handleAuth} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white p-2 rounded"
        >
          {loading ? 'Loading...' : 'Login/Signup'}
        </button>
      </form>
    </div>
  );
}