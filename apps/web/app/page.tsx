'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';

function HomeContent() {
  const router = useRouter();
  const { user, signOut, loading } = useAuth();

  // Redirect to appropriate dashboard based on role
  useEffect(() => {
    if (user && user.role) {
      if (user.role === 'admin') {
        router.push('/admin-dashboard');
      } else if (user.role === 'hub_manager') {
        router.push('/hub-manager-dashboard');
      } else if (user.role === 'technician') {
        router.push('/technician-dashboard');
      } else if (user.role === 'rider') {
        router.push('/rider-dashboard');
      }
    }
  }, [user, router]);

  // Show loading spinner while checking auth or redirecting
  if (loading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-slate-200 border-t-brand-500 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-sm font-medium text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

    return (
      <>
        <div className="mesh-bg text-slate-800 antialiased min-h-screen flex flex-col">
          {/* Navigation */}
    <header className="fixed top-0 left-0 right-0 z-50 glass-panel">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            {/* Brand */}
            <div className="flex items-center gap-3">
                <div className="h-10">
                    <img src="https://app-cdn.appgen.com/c8d1da7a-8da9-4a1f-8aaa-2cb65f828731/assets/uploaded_1772434426357_uwdii.png" alt="inneedit" className="h-full w-auto" />
                </div>
                <div>
                    <h1 className="font-display font-bold text-base leading-none text-slate-900">inneedit Global Logistics</h1>
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Smart Workforce Solutions</span>
                </div>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1 p-1 bg-slate-100/50 rounded-xl border border-slate-200/50">
                <button onClick={() => router.push('/')} className="px-4 py-2 bg-white rounded-lg shadow-sm text-sm font-medium text-slate-900 border border-slate-200 transition-all">
                    Dashboard
                </button>
                <button onClick={() => router.push('/admin-dashboard')} className="px-4 py-2 hover:bg-white/50 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-900 transition-all">
                    Overview
                </button>
                <button onClick={() => router.push('/rider-registration')} className="px-4 py-2 hover:bg-white/50 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-900 transition-all">
                    Registration
                </button>
                <button onClick={() => router.push('/hub-management')} className="px-4 py-2 hover:bg-white/50 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-900 transition-all">
                    Hub Manager
                </button>

            </nav>

            {/* Actions */}
            <div className="flex items-center gap-4">
                <button className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all">
                    <i className="ph ph-bell text-xl"></i>
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                </button>
                <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-semibold text-slate-900">{user?.name || 'Admin User'}</p>
                        <p className="text-xs text-slate-500">{user?.email || 'Bangalore HQ'}</p>
                    </div>
                    <button
                      onClick={() => signOut()}
                      className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-700 to-slate-900 border-2 border-white shadow-md hover:from-red-600 hover:to-red-700 transition-all flex items-center justify-center text-white"
                      title="Sign Out"
                    >
                      <i className="ph-bold ph-sign-out text-sm"></i>
                    </button>
                </div>
            </div>
        </div>
    </header>

    {/* Main Content */}
    <main className="flex-grow pt-28 pb-12 px-6">
        <div className="max-w-7xl mx-auto space-y-8">
            
            {/* Hero Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="font-display text-3xl font-bold text-slate-900">Dashboard Overview</h2>
                    <p className="text-slate-500 mt-2">Welcome back. Here's what's happening with your fleet operations today.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-all shadow-sm">
                        <i className="ph ph-download-simple"></i>
                        Export Report
                    </button>
                    <button onClick={() => router.push('/rider-registration')} className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-all shadow-lg shadow-brand-500/25 active:scale-95">
                        <i className="ph ph-plus-circle text-lg"></i>
                        Add New Rider
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Stat 1 */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-brand-50 text-brand-500 rounded-xl group-hover:bg-brand-500 group-hover:text-white transition-colors">
                            <i className="ph ph-moped text-2xl"></i>
                        </div>
                        <span className="text-xs font-semibold px-2 py-1 bg-green-100 text-green-700 rounded-full">+12% this week</span>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-500">Total Active Riders</p>
                        <h3 className="text-3xl font-bold text-slate-900">1,248</h3>
                    </div>
                </div>

                {/* Stat 2 */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-500 group-hover:text-white transition-colors">
                            <i className="ph ph-wrench text-2xl"></i>
                        </div>
                        <span className="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-600 rounded-full">15 Maintenance</span>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-500">Fleet Health</p>
                        <h3 className="text-3xl font-bold text-slate-900">98.2%</h3>
                    </div>
                </div>

                {/* Stat 3 */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
                            <i className="ph ph-currency-inr text-2xl"></i>
                        </div>
                        <span className="text-xs font-semibold px-2 py-1 bg-red-50 text-red-600 rounded-full">Due in 3 days</span>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-500">Payroll Pending</p>
                        <h3 className="text-3xl font-bold text-slate-900">₹4.2L</h3>
                    </div>
                </div>

                {/* Stat 4 */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-green-50 text-green-600 rounded-xl group-hover:bg-green-600 group-hover:text-white transition-colors">
                            <i className="ph ph-buildings text-2xl"></i>
                        </div>
                        <span className="text-xs font-semibold px-2 py-1 bg-green-100 text-green-700 rounded-full">All Operational</span>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-500">Active Hubs</p>
                        <h3 className="text-3xl font-bold text-slate-900">8</h3>
                    </div>
                </div>
            </div>

            {/* Content Grid: Quick Actions & Live Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Quick Access Module */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                        <h3 className="font-display font-semibold text-lg text-slate-900 mb-6">Quick Management</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {/* Card 1 */}
                            <button onClick={() => router.push('/rider-registration')} className="p-5 rounded-xl bg-slate-50 border border-slate-100 hover:border-brand-500/30 hover:bg-brand-50/50 hover:shadow-glow transition-all text-left group">
                                <i className="ph-duotone ph-user-plus text-3xl text-slate-400 group-hover:text-brand-600 mb-3 transition-colors"></i>
                                <h4 className="font-semibold text-slate-900">New Rider</h4>
                                <p className="text-xs text-slate-500 mt-1">Register & Onboard</p>
                            </button>
                            
                            {/* Card 2 */}
                            <button onClick={() => router.push('/admin-dashboard')} className="p-5 rounded-xl bg-slate-50 border border-slate-100 hover:border-secondary-500/30 hover:bg-blue-50/50 transition-all text-left group">
                                <i className="ph-duotone ph-chart-pie-slice text-3xl text-slate-400 group-hover:text-secondary-600 mb-3 transition-colors"></i>
                                <h4 className="font-semibold text-slate-900">Analytics</h4>
                                <p className="text-xs text-slate-500 mt-1">View Full Report</p>
                            </button>

                            {/* Card 3 */}
                            <button onClick={() => router.push('/hub-management')} className="p-5 rounded-xl bg-slate-50 border border-slate-100 hover:border-brand-500/30 hover:bg-brand-50/50 transition-all text-left group">
                                <i className="ph-duotone ph-warehouse text-3xl text-slate-400 group-hover:text-brand-600 mb-3 transition-colors"></i>
                                <h4 className="font-semibold text-slate-900">Hub Status</h4>
                                <p className="text-xs text-slate-500 mt-1">Vehicle Handover</p>
                            </button>
                            

                            
                            {/* Card 5 (Technician) */}
                            <button className="p-5 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-300 transition-all text-left group opacity-75">
                                <i className="ph-duotone ph-wrench text-3xl text-slate-400 group-hover:text-slate-600 mb-3 transition-colors"></i>
                                <h4 className="font-semibold text-slate-900">Maintenance</h4>
                                <p className="text-xs text-slate-500 mt-1">Vehicle Tickets</p>
                            </button>

                            {/* Card 6 (Stores) */}
                            <button className="p-5 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-300 transition-all text-left group opacity-75">
                                <i className="ph-duotone ph-storefront text-3xl text-slate-400 group-hover:text-slate-600 mb-3 transition-colors"></i>
                                <h4 className="font-semibold text-slate-900">Stores</h4>
                                <p className="text-xs text-slate-500 mt-1">BigBasket Outlets</p>
                            </button>
                        </div>
                    </div>

                    {/* Fleet Utilization Visualization (Placeholder for aesthetic) */}
                    <div className="bg-slate-900 rounded-2xl p-6 shadow-xl text-white relative overflow-hidden">
                        {/* Decorative gradient blob */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-600/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                        
                        <div className="relative z-10 flex justify-between items-center mb-6">
                            <h3 className="font-display font-semibold text-lg">Live Fleet Utilization</h3>
                            <select className="bg-slate-800 border-none text-xs text-slate-300 rounded px-2 py-1 outline-none">
                                <option>Today</option>
                                <option>Yesterday</option>
                            </select>
                        </div>

                        <div className="flex items-end gap-2 h-32 relative z-10">
                            {/* Fake Bar Chart using CSS */}
                            <div className="w-full bg-slate-800/50 rounded-t-sm hover:bg-brand-600 transition-all h-[40%]"></div>
                            <div className="w-full bg-slate-800/50 rounded-t-sm hover:bg-brand-600 transition-all h-[65%]"></div>
                            <div className="w-full bg-slate-800/50 rounded-t-sm hover:bg-brand-600 transition-all h-[50%]"></div>
                            <div className="w-full bg-slate-800/50 rounded-t-sm hover:bg-brand-600 transition-all h-[85%]"></div>
                            <div className="w-full bg-slate-800/50 rounded-t-sm hover:bg-brand-600 transition-all h-[95%]"></div>
                            <div className="w-full bg-slate-800/50 rounded-t-sm hover:bg-brand-600 transition-all h-[70%]"></div>
                            <div className="w-full bg-slate-800/50 rounded-t-sm hover:bg-brand-600 transition-all h-[60%]"></div>
                            <div className="w-full bg-brand-600 rounded-t-sm h-[88%] shadow-[0_0_15px_rgba(255,136,66,0.4)]"></div>
                        </div>
                        <div className="flex justify-between mt-2 text-xs text-slate-400">
                            <span>06:00</span>
                            <span>09:00</span>
                            <span>12:00</span>
                            <span>15:00</span>
                            <span>18:00</span>
                        </div>
                    </div>
                </div>

                {/* Notifications Panel */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl border border-slate-200 h-full shadow-sm flex flex-col">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-display font-semibold text-lg text-slate-900">Activity Feed</h3>
                            <button className="text-xs font-medium text-brand-500 hover:text-brand-600">View All</button>
                        </div>
                        
                        <div className="p-2 overflow-y-auto max-h-[500px] hide-scrollbar flex-1">
                            
                            {/* Notif Item 1 */}
                            <div className="p-3 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer group">
                                <div className="flex gap-3">
                                    <div className="mt-1 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                                        <i className="ph-fill ph-user-plus"></i>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-800"><span className="font-semibold">Ramesh Kumar</span> registered at Koramangala Hub.</p>
                                        <p className="text-xs text-slate-400 mt-1">2 mins ago • Pending verification</p>
                                        <div className="mt-2 flex gap-2">
                                            <button onClick={() => router.push('/hub-management')} className="text-xs px-2 py-1 bg-white border border-slate-200 rounded shadow-sm text-slate-600 group-hover:border-blue-300">Review</button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Notif Item 2 */}
                            <div className="p-3 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer group border-t border-slate-50">
                                <div className="flex gap-3">
                                    <div className="mt-1 w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
                                        <i className="ph-fill ph-wrench"></i>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-800">Vehicle <span className="font-mono bg-slate-100 px-1 rounded">KA-01-EQ-9922</span> reported breakdown.</p>
                                        <p className="text-xs text-slate-400 mt-1">15 mins ago • HSR Layout Hub</p>
                                    </div>
                                </div>
                            </div>

                            {/* Notif Item 3 */}
                            <div className="p-3 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer group border-t border-slate-50">
                                <div className="flex gap-3">
                                    <div className="mt-1 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 flex-shrink-0">
                                        <i className="ph-fill ph-check-circle"></i>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-800">Vehicle collected by <span className="font-semibold">Suresh V</span>.</p>
                                        <p className="text-xs text-slate-400 mt-1">1 hour ago • Whitefield Hub</p>
                                    </div>
                                </div>
                            </div>



                        </div>
                    </div>
                </div>
            </div>

        </div>
    </main>

    {/* Footer */}
    <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-sm text-slate-500">
                    © 2024 inneedit Global Logistics Private Limited. All rights reserved.
                </div>
                <div className="flex gap-6 text-sm font-medium text-slate-600">
                    <a href="#" className="hover:text-slate-900 transition-colors">Support</a>
                    <a href="#" className="hover:text-slate-900 transition-colors">Documentation</a>
                    <a href="#" className="hover:text-slate-900 transition-colors">Privacy Policy</a>
                </div>
            </div>
        </div>
    </footer>
        </div>
      </>
    );
}

export default function HomePage() {
  return (
    <ProtectedRoute>
      <HomeContent />
    </ProtectedRoute>
  );
}
