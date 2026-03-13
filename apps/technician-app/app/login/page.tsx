'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, Bell } from 'lucide-react';

export default function TechnicianLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!email || !password) {
        setError('Please enter both email and password');
        setLoading(false);
        return;
      }

      // Call technician login API (adjust endpoint as needed)
      const response = await fetch('/api/technician-auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: email.toLowerCase(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed. Please try again.');
        setLoading(false);
        return;
      }

      // Login successful - redirect to technician dashboard
      setLoading(false);
      router.push('/technician-dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="mesh-bg min-h-screen flex items-center justify-center px-6 py-12">
      {/* Notification Bell - Top Right */}
      <div className="fixed top-8 right-8 cursor-pointer group">
        <div className="relative">
          <Bell size={24} className="text-slate-600 group-hover:text-slate-900 transition-colors" />
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs flex items-center justify-center rounded-full font-bold">
            0
          </span>
        </div>
      </div>

      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-14">
              <img
                src="https://app-cdn.appgen.com/c8d1da7a-8da9-4a1f-8aaa-2cb65f828731/assets/uploaded_1772434426357_uwdii.png"
                alt="inneedit"
                className="h-full w-auto"
              />
            </div>
            <div className="text-left">
              <h1 className="font-display font-bold text-xl leading-tight text-slate-900">
                inneedit Global Logistics
              </h1>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Technician Portal
              </span>
            </div>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mt-6">Technician Login</h2>
          <p className="text-slate-500 text-sm mt-2">
            Sign in to manage maintenance and repairs
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-start gap-2">
              <span className="text-lg mt-0.5">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="technician@example.com"
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1.5">
                Enter your registered email address
              </p>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1.5">
                Enter your password
              </p>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-all shadow-lg shadow-orange-600/25 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Help Text */}
          <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <p className="text-xs text-slate-600">
              <span className="text-lg">ℹ️</span>
              <span className="ml-2">
                Contact your administrator if you don't have login credentials.
              </span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-slate-500">
          <p>© 2024 inneedit Global Logistics Private Limited. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
