'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    // Role-based redirects - redirect users to their appropriate dashboard
    if (!loading && isAuthenticated && user && pathname === '/') {
      // Get role from user metadata or default to 'admin'
      const userRole = (user as any).role || 'admin';
      
      if (userRole === 'rider') {
        router.push('/rider-dashboard');
      } else if (userRole === 'hub_manager') {
        router.push('/hub-management');
      } else if (userRole === 'technician') {
        router.push('/technician-dashboard');
      } else if (userRole === 'admin') {
        router.push('/admin-dashboard');
      }
    }
  }, [isAuthenticated, loading, router, user, pathname]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="mesh-bg min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-brand-900 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-brand-900/20 mx-auto mb-4">
            <i className="ph ph-circle-notch animate-spin text-4xl"></i>
          </div>
          <p className="text-slate-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render children if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
