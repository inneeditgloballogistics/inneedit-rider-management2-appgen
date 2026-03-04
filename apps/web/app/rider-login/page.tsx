'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase-config';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import Link from 'next/link';

export default function RiderLoginPage() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);

  // Initialize reCAPTCHA when component mounts
  useEffect(() => {
    if (!recaptchaVerifier && typeof window !== 'undefined') {
      try {
        // Ensure the container exists before initializing
        const container = document.getElementById('recaptcha-container');
        if (!container) {
          console.error('reCAPTCHA container not found');
          return;
        }

        const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'normal',
          callback: () => {
            // reCAPTCHA solved
          },
          'expired-callback': () => {
            setError('reCAPTCHA expired. Please try again.');
          }
        });
        setRecaptchaVerifier(verifier);
      } catch (err: any) {
        console.error('Error initializing reCAPTCHA:', err);
        // Only set error if it's a critical failure, not just container not ready
        if (err.message && !err.message.includes('container')) {
          setError('Failed to initialize authentication. Please contact support.');
        }
      }
    }

    // Cleanup
    return () => {
      if (recaptchaVerifier) {
        try {
          recaptchaVerifier.clear();
        } catch (err) {
          // Ignore cleanup errors
          console.log('reCAPTCHA cleanup error (safe to ignore):', err);
        }
      }
    };
  }, [recaptchaVerifier]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Set a timeout for the whole operation
    const timeoutId = setTimeout(() => {
      setLoading(false);
      setError('⚠️ Request timed out. Firebase domain authorization required: Go to Firebase Console → Authentication → Settings → Authorized domains and add: ' + window.location.hostname);
    }, 15000); // 15 second timeout

    try {
      // Validate phone number format (must include country code)
      let formattedPhone = phoneNumber.trim();
      if (!formattedPhone.startsWith('+')) {
        // Assume Indian number if no country code
        formattedPhone = '+91' + formattedPhone.replace(/^0+/, '');
      }

      // Remove spaces and special characters
      formattedPhone = formattedPhone.replace(/[\s()-]/g, '');

      if (!recaptchaVerifier) {
        clearTimeout(timeoutId);
        throw new Error('reCAPTCHA not initialized');
      }

      // Send OTP via Firebase
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier);
      clearTimeout(timeoutId);
      setConfirmationResult(confirmation);
      setStep('otp');
      setError('');
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error('Error sending OTP:', err);
      if (err.code === 'auth/invalid-phone-number') {
        setError('Invalid phone number. Please enter a valid number with country code (e.g., +91 9876543210)');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many attempts. Please try again later.');
      } else if (err.code === 'auth/internal-error') {
        setError('⚠️ Firebase Setup Required: Go to Firebase Console → Authentication → Settings → Authorized domains and add: ' + window.location.hostname);
      } else if (err.message?.includes('reCAPTCHA')) {
        setError('reCAPTCHA verification failed. Please try again.');
      } else if (err.message?.toLowerCase().includes('timeout')) {
        setError('⚠️ Request timed out. Firebase domain authorization required: Go to Firebase Console → Authentication → Settings → Authorized domains and add: ' + window.location.hostname);
      } else {
        setError(err.message || 'Failed to send OTP. Please try again.');
      }
      // Reset reCAPTCHA on error
      if (recaptchaVerifier) {
        try {
          recaptchaVerifier.clear();
          // Ensure container exists before recreating
          const container = document.getElementById('recaptcha-container');
          if (container) {
            const newVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
              size: 'normal',
            });
            setRecaptchaVerifier(newVerifier);
          }
        } catch (err) {
          console.log('Error resetting reCAPTCHA:', err);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!confirmationResult) {
        throw new Error('No confirmation result. Please request OTP again.');
      }

      // Verify OTP with Firebase
      const result = await confirmationResult.confirm(otp);
      const user = result.user;

      // Get Firebase ID token
      const idToken = await user.getIdToken();

      // Authenticate with backend and create session
      const response = await fetch('/api/rider-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: user.phoneNumber,
          firebaseUid: user.uid,
          idToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Redirect to rider dashboard
      router.push('/rider-dashboard');
    } catch (err: any) {
      console.error('Error verifying OTP:', err);
      if (err.code === 'auth/invalid-verification-code') {
        setError('Invalid OTP. Please check and try again.');
      } else if (err.code === 'auth/code-expired') {
        setError('OTP expired. Please request a new one.');
        setStep('phone');
        setOtp('');
      } else {
        setError(err.message || 'Failed to verify OTP. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = () => {
    setStep('phone');
    setOtp('');
    setConfirmationResult(null);
    setError('');
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
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Rider Portal</span>
            </div>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mt-6">Rider Login</h2>
          <p className="text-slate-500 text-sm mt-2">
            {step === 'phone' ? 'Enter your phone number to receive OTP' : 'Enter the OTP sent to your phone'}
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8">
          {/* reCAPTCHA container */}
          <div id="recaptcha-container" className="flex justify-center mb-4"></div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
              <i className="ph-fill ph-warning-circle text-lg"></i>
              {error}
            </div>
          )}

          {step === 'phone' ? (
            <form onSubmit={handleSendOTP} className="space-y-5">
              {/* Phone Number Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <i className="ph-bold ph-phone text-lg"></i>
                  </div>
                  <div className="absolute left-12 top-1/2 -translate-y-1/2 text-slate-900 font-medium border-r border-slate-300 pr-3">
                    +91
                  </div>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setPhoneNumber(value);
                    }}
                    required
                    placeholder="98765 43210"
                    maxLength={10}
                    className="w-full pl-24 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1.5">Enter your 10-digit mobile number</p>
              </div>

              {/* Send OTP Button */}
              <button
                type="submit"
                disabled={loading || !phoneNumber}
                className="w-full px-4 py-3 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-all shadow-lg shadow-brand-600/25 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <i className="ph ph-circle-notch animate-spin text-lg"></i>
                    Sending OTP...
                  </>
                ) : (
                  <>
                    <i className="ph-bold ph-paper-plane-tilt"></i>
                    Send OTP
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-5">
              {/* OTP Display Info */}
              <div className="p-4 bg-brand-50 border border-brand-200 rounded-lg">
                <p className="text-sm text-brand-900 font-medium flex items-center gap-2">
                  <i className="ph-fill ph-check-circle"></i>
                  OTP sent to {phoneNumber}
                </p>
              </div>

              {/* OTP Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Enter OTP
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-center text-2xl font-mono tracking-widest placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                />
                <p className="text-xs text-slate-500 mt-1.5">6-digit code sent to your phone</p>
              </div>

              {/* Verify Button */}
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full px-4 py-3 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-all shadow-lg shadow-brand-600/25 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <i className="ph ph-circle-notch animate-spin text-lg"></i>
                    Verifying...
                  </>
                ) : (
                  <>
                    <i className="ph-bold ph-sign-in"></i>
                    Verify & Login
                  </>
                )}
              </button>

              {/* Resend OTP */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  className="text-sm text-slate-600 hover:text-brand-600 font-medium transition-colors"
                >
                  Didn't receive OTP? Resend
                </button>
              </div>
            </form>
          )}

          {/* Help Text */}
          <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <p className="text-xs text-slate-600">
              <i className="ph-bold ph-info mr-1 text-slate-500"></i>
              New rider? Contact your hub manager or admin to get registered.
            </p>
          </div>
        </div>

        {/* Back to Login */}
        <div className="mt-6 text-center">
          <Link href="/login" className="text-sm text-slate-600 hover:text-slate-900 font-medium">
            <i className="ph-bold ph-arrow-left mr-1"></i>
            Back to Main Login
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-slate-500">
          <p>© 2024 inneedit Global Logistics Private Limited. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
