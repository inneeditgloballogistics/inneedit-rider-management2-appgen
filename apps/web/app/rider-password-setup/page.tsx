'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, Shield, CheckCircle } from 'lucide-react';

export default function RiderPasswordSetupPage() {
  const router = useRouter();
  const [step, setStep] = useState<'verify' | 'setPassword' | 'success'>('verify');
  
  // Verify step
  const [ceeId, setCeeId] = useState('');
  const [email, setEmail] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  
  // Password setup step
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [riderData, setRiderData] = useState<any>(null);

  // Step 1: Verify rider identity
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyLoading(true);
    setVerifyError('');

    try {
      if (!ceeId || !email) {
        setVerifyError('Please enter both Cee ID and Email');
        setVerifyLoading(false);
        return;
      }

      // Call verification API
      const response = await fetch('/api/rider-auth/verify-rider', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cee_id: ceeId.toUpperCase(),
          email: email.toLowerCase(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setVerifyError(data.error || 'Verification failed. Please check your details.');
        setVerifyLoading(false);
        return;
      }

      setRiderData(data.rider);
      setStep('setPassword');
    } catch (err: any) {
      console.error('Verification error:', err);
      setVerifyError(err.message || 'An error occurred. Please try again.');
      setVerifyLoading(false);
    }
  };

  // Step 2: Set password
  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordError('');

    try {
      if (!password || !confirmPassword) {
        setPasswordError('Please fill in all password fields');
        setPasswordLoading(false);
        return;
      }

      if (password.length < 8) {
        setPasswordError('Password must be at least 8 characters long');
        setPasswordLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        setPasswordError('Passwords do not match');
        setPasswordLoading(false);
        return;
      }

      // Call password setup API
      const response = await fetch('/api/rider-auth/set-password-self', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: email.toLowerCase(),
          cee_id: ceeId.toUpperCase(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setPasswordError(data.error || 'Failed to set password. Please try again.');
        setPasswordLoading(false);
        return;
      }

      setStep('success');
      setTimeout(() => {
        router.push('/rider-login');
      }, 2000);
    } catch (err: any) {
      console.error('Password setup error:', err);
      setPasswordError(err.message || 'An error occurred. Please try again.');
      setPasswordLoading(false);
    }
  };

  return (
    <div className="mesh-bg min-h-screen flex items-center justify-center px-6 py-12">
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
                Rider Portal
              </span>
            </div>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mt-6">
            {step === 'success' ? 'Password Set Successfully!' : 'Set Your Password'}
          </h2>
          <p className="text-slate-500 text-sm mt-2">
            {step === 'verify' && 'Verify your identity to proceed'}
            {step === 'setPassword' && 'Create a secure password for your account'}
            {step === 'success' && 'You can now log in with your email and password'}
          </p>
        </div>

        {/* Password Setup Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8">
          {/* Success Step */}
          {step === 'success' && (
            <div className="text-center space-y-6 py-8">
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
                    <CheckCircle className="w-12 h-12 text-green-600" />
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Great! Your password is set.
                </h3>
                <p className="text-slate-600 text-sm">
                  Redirecting to login page... Please wait.
                </p>
              </div>
              <div className="pt-4">
                <div className="inline-flex items-center justify-center w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              </div>
            </div>
          )}

          {/* Verify Step */}
          {step === 'verify' && (
            <form onSubmit={handleVerify} className="space-y-5">
              {verifyError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-start gap-2">
                  <span className="text-lg mt-0.5">⚠️</span>
                  <span>{verifyError}</span>
                </div>
              )}

              {/* Cee ID Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Cee ID / Rider ID
                </label>
                <div className="relative">
                  <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={ceeId}
                    onChange={(e) => setCeeId(e.target.value.toUpperCase())}
                    required
                    placeholder="e.g., CEE123456"
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1.5">
                  Enter your Cee ID as provided during registration
                </p>
              </div>

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
                    placeholder="rider@example.com"
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1.5">
                  Enter your registered email address
                </p>
              </div>

              {/* Verify Button */}
              <button
                type="submit"
                disabled={verifyLoading || !ceeId || !email}
                className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/25 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {verifyLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    Verify & Continue
                  </>
                )}
              </button>
            </form>
          )}

          {/* Set Password Step */}
          {step === 'setPassword' && (
            <form onSubmit={handleSetPassword} className="space-y-5">
              {passwordError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-start gap-2">
                  <span className="text-lg mt-0.5">⚠️</span>
                  <span>{passwordError}</span>
                </div>
              )}

              {/* Rider Info Display */}
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                <p className="text-sm text-slate-700">
                  <span className="font-medium">Verified Rider:</span> {riderData?.full_name}
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  <span className="font-medium">Cee ID:</span> {riderData?.cee_id}
                </p>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
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
                  Minimum 8 characters. Use a mix of letters, numbers, and symbols
                </p>
              </div>

              {/* Confirm Password Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1.5">
                  Re-enter your password to confirm
                </p>
              </div>

              {/* Set Password Button */}
              <button
                type="submit"
                disabled={passwordLoading || !password || !confirmPassword}
                className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/25 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {passwordLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Setting Password...
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    Set Password & Continue
                  </>
                )}
              </button>

              {/* Back Button */}
              <button
                type="button"
                onClick={() => {
                  setStep('verify');
                  setPassword('');
                  setConfirmPassword('');
                  setPasswordError('');
                }}
                className="w-full px-4 py-2 text-slate-600 hover:text-slate-900 font-medium transition-colors"
              >
                ← Go Back
              </button>
            </form>
          )}

          {/* Help Text */}
          {step !== 'success' && (
            <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <p className="text-xs text-slate-600">
                <span className="text-lg">ℹ️</span>
                <span className="ml-2">
                  {step === 'verify'
                    ? 'Use your Cee ID and registered email to verify your identity'
                    : 'Create a strong password that you can remember for future logins'}
                </span>
              </p>
            </div>
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
