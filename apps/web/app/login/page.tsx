'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [loginType, setLoginType] = useState<'admin' | 'rider' | 'hub_manager' | 'technician'>('admin');
  const [phoneOrCeeId, setPhoneOrCeeId] = useState('');
  const [riderPassword, setRiderPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Admin login - direct access without authentication
      router.push('/admin-dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to access admin dashboard.');
    } finally {
      setLoading(false);
    }
  };

  const handleRiderLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // For now, use the phone/CEE ID as email format for authentication
      // In production, you'd have a separate rider authentication endpoint
      const loginEmail = phoneOrCeeId.includes('@') ? phoneOrCeeId : `${phoneOrCeeId}@rider.internal`;
      
      // Make API call to authenticate rider
      const response = await fetch('/api/rider-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: riderPassword })
      });

      if (!response.ok) {
        throw new Error('Failed to sign in. Please check your credentials.');
      }

      router.push('/rider-dashboard'); // Redirect to rider dashboard
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mesh-bg min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-14">
              <img src="https://app-cdn.appgen.com/c8d1da7a-8da9-4a1f-8aaa-2cb65f828731/assets/uploaded_1772434426357_uwdii.png" alt="inneedit" className="h-full w-auto" />
            </div>
            <div className="text-left">
              <h1 className="font-display font-bold text-xl leading-tight text-slate-900">
                inneedit Global Logistics
              </h1>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Smart Workforce Solutions</span>
            </div>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mt-6">Welcome Back</h2>
          <p className="text-slate-500 text-sm mt-2">Sign in to access your dashboard</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8">
          {/* Login Type Toggle */}
          <div className="mb-6 p-1 bg-slate-100 rounded-xl grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => setLoginType('admin')}
              className={`px-3 py-2.5 rounded-lg font-medium text-xs transition-all ${
                loginType === 'admin'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <i className="ph-bold ph-user-gear mr-1.5"></i>
              Admin
            </button>
            <button
              type="button"
              onClick={() => setLoginType('rider')}
              className={`px-3 py-2.5 rounded-lg font-medium text-xs transition-all ${
                loginType === 'rider'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <i className="ph-bold ph-moped mr-1.5"></i>
              Rider
            </button>
            <button
              type="button"
              onClick={() => setLoginType('hub_manager')}
              className={`px-3 py-2.5 rounded-lg font-medium text-xs transition-all ${
                loginType === 'hub_manager'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <i className="ph-bold ph-buildings mr-1.5"></i>
              Hub Manager
            </button>
            <button
              type="button"
              onClick={() => setLoginType('technician')}
              className={`px-3 py-2.5 rounded-lg font-medium text-xs transition-all ${
                loginType === 'technician'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <i className="ph-bold ph-wrench mr-1.5"></i>
              Technician
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
              <i className="ph-fill ph-warning-circle text-lg"></i>
              {error}
            </div>
          )}

          {loginType === 'rider' ? (
            <>
              {/* Rider OTP Login Redirect */}
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-brand-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <i className="ph-fill ph-moped text-4xl text-brand-600"></i>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Secure OTP Login</h3>
                <p className="text-sm text-slate-600 mb-6">
                  Riders login using phone number verification for enhanced security
                </p>
                <Link
                  href="/rider-login"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-all shadow-lg shadow-brand-600/25"
                >
                  <i className="ph-bold ph-sign-in"></i>
                  Continue to Rider Login
                </Link>
              </div>

              {/* Help Text */}
              <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="text-xs text-slate-600">
                  <i className="ph-bold ph-info mr-1 text-slate-500"></i>
                  New rider? Contact your hub manager or admin to get registered and receive your login credentials.
                </p>
              </div>
            </>
          ) : loginType === 'admin' ? (
            <>
              {/* Admin Direct Access */}
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-brand-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <i className="ph-fill ph-user-gear text-4xl text-brand-600"></i>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Admin Access</h3>
                <p className="text-sm text-slate-600 mb-6">
                  Click below to access the admin dashboard
                </p>
                <form onSubmit={handleAdminLogin}>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-4 py-3 bg-brand-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <i className="ph ph-circle-notch animate-spin text-lg"></i>
                        Loading...
                      </>
                    ) : (
                      <>
                        <i className="ph-bold ph-sign-in"></i>
                        Access Admin Dashboard
                      </>
                    )}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <>
              {/* Hub Manager / Technician Login */}
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={phoneOrCeeId}
                    onChange={(e) => setPhoneOrCeeId(e.target.value)}
                    required
                    placeholder="you@company.com"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={riderPassword}
                    onChange={(e) => setRiderPassword(e.target.value)}
                    required
                    placeholder="Enter your password"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                  />
                </div>

                <button
                  onClick={handleRiderLogin}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-brand-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <i className="ph ph-circle-notch animate-spin text-lg"></i>
                      Signing in...
                    </>
                  ) : (
                    <>
                      <i className="ph-bold ph-sign-in"></i>
                      Sign In
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-slate-500">
          <p>© 2024 inneedit Global Logistics Private Limited. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
