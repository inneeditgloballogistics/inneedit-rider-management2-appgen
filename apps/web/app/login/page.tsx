'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signInWithGoogle } = useAuth();
  const [loginType, setLoginType] = useState<'admin' | 'rider' | 'hub_manager' | 'technician'>('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneOrCeeId, setPhoneOrCeeId] = useState('');
  const [riderPassword, setRiderPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signIn(email, password);
      // Redirect based on role - will be handled by useEffect after login
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please check your credentials.');
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
      await signIn(loginEmail, riderPassword);
      router.push('/'); // Redirect to rider app dashboard
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithGoogle();
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google.');
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
          ) : (
            <>
              {/* Demo Account Info */}
              {loginType === 'admin' && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900 font-medium mb-1">Demo Account</p>
                  <p className="text-xs text-blue-700">
                    Email: <span className="font-mono">demo@appgen.com</span><br />
                    Password: <span className="font-mono">demo1234</span>
                  </p>
                </div>
              )}

              <form onSubmit={handleEmailLogin} className="space-y-5">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@company.com"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
              />
            </div>

                {/* Sign In Button */}
                <button
                  type="submit"
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
                      Sign In as {loginType === 'admin' ? 'Admin' : loginType === 'hub_manager' ? 'Hub Manager' : 'Technician'}
                    </>
                  )}
                </button>
              </form>

              {loginType === 'admin' && (
                <>
                  {/* Divider */}
                  <div className="my-6 flex items-center gap-4">
                    <div className="flex-1 h-px bg-slate-200"></div>
                    <span className="text-xs text-slate-400 font-medium">OR</span>
                    <div className="flex-1 h-px bg-slate-200"></div>
                  </div>

                  {/* Google Sign In */}
                  <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full px-4 py-3 bg-white border-2 border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </button>

                  {/* Sign Up Link */}
                  <div className="mt-6 text-center">
                    <p className="text-sm text-slate-600">
                      Don't have an account?{' '}
                      <Link href="/signup" className="font-semibold text-brand-600 hover:text-brand-700">
                        Sign Up
                      </Link>
                    </p>
                  </div>
                </>
              )}
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
