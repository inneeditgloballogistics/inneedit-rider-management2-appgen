'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';


export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');



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
          {/* Login Type Buttons */}
          <div className="mb-6 grid grid-cols-2 gap-3">

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
              <i className="ph-fill ph-warning-circle text-lg"></i>
              {error}
            </div>
          )}

          {/* Login Options */}
            <Link
              href="/admin-dashboard"
              className="block p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-brand-100 rounded-lg flex items-center justify-center">
                  <i className="ph-fill ph-user-gear text-xl text-brand-600"></i>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Admin Access</h3>
                  <p className="text-xs text-slate-500">Manage system operations</p>
                </div>
              </div>
            </Link>

            <Link
              href="/rider-login"
              className="block p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <i className="ph-fill ph-moped text-xl text-indigo-600"></i>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Rider Login</h3>
                  <p className="text-xs text-slate-500">Access rider dashboard</p>
                </div>
              </div>
            </Link>

            <Link
              href="/hub-manager-login"
              className="block p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <i className="ph-fill ph-buildings text-xl text-emerald-600"></i>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Hub Manager</h3>
                  <p className="text-xs text-slate-500">Manage hub operations</p>
                </div>
              </div>
            </Link>

            <Link
              href="/technician-login"
              className="block p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <i className="ph-fill ph-wrench text-xl text-blue-600"></i>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Technician</h3>
                  <p className="text-xs text-slate-500">Manage service tickets</p>
                </div>
              </div>
            </Link>
          </div>

          {/* Help Text */}
          <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <p className="text-xs text-slate-600">
              <i className="ph-bold ph-info mr-1 text-slate-500"></i>
              Select your role to log in. New riders should contact their hub manager to get registered.
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
