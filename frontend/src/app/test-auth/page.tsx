'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getBrowserUser, signInWithPassword, signOut } from '@/lib/auth/supabaseAuth';

export default function TestAuthPage() {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loginForm, setLoginForm] = useState({ email: 'firmanfird23@gmail.com', password: '' });
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { user, error } = await getBrowserUser();

      setUser(user);
      setSession(user ? { user } : null); // Simplified session check
      setLoading(false);

      console.log('Auth check:', { user: user?.id, hasUser: !!user });
    } catch (error) {
      console.error('Auth check failed:', error);
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);

    try {
      const { user, error } = await signInWithPassword(loginForm.email, loginForm.password);

      if (error) {
        alert(`Login failed: ${(error as any)?.message || 'Unknown error'}`);
      } else {
        alert('Login successful!');
        await checkAuth();
      }
    } catch (error) {
      alert(`Login error: ${error}`);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      await checkAuth();
      alert('Logged out successfully!');
    } catch (error) {
      alert(`Logout error: ${error}`);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Authentication Test</h1>
      
      <div className="mb-8 p-4 bg-gray-100 rounded">
        <h2 className="text-lg font-semibold mb-2">Current Auth Status</h2>
        <p><strong>User ID:</strong> {user?.id || 'Not logged in'}</p>
        <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
        <p><strong>Session:</strong> {session ? 'Active' : 'None'}</p>
        <p><strong>Expected UUID:</strong> c395d8af-410d-4821-91f4-1fd8ec39b0e4</p>
        <p><strong>UUID Match:</strong> {user?.id === 'c395d8af-410d-4821-91f4-1fd8ec39b0e4' ? '✅ YES' : '❌ NO'}</p>
      </div>

      {!user ? (
        <form onSubmit={handleLogin} className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Login</h2>
          <div className="mb-4">
            <label className="block mb-2">Email:</label>
            <input
              type="email"
              value={loginForm.email}
              onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block mb-2">Password:</label>
            <input
              type="password"
              value={loginForm.password}
              onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loginLoading}
            className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loginLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      ) : (
        <div className="mb-6">
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded"
          >
            Logout
          </button>
        </div>
      )}

      <div className="mb-6">
        <button
          onClick={checkAuth}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Refresh Auth Status
        </button>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Test SELLY</h2>
        <p>After logging in, go to the main page and test SELLY chatbot.</p>
        <Link href="/" className="text-blue-500 underline">Go to Main Page</Link>
      </div>
    </div>
  );
}
