'use client';

import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import { VehicleList } from '@/components/VehicleHubStoreManagement';
import { AddModal } from '@/components/AddModal';

function HubManagementContent() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  // Role-based access control - redirect if not hub manager
  useEffect(() => {
    if (user && user.role && user.role !== 'hub_manager' && user.role !== 'admin') {
      router.push('/login');
    }
  }, [user, router]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    const res = await fetch('/api/vehicles');
    const data = await res.json();
    setVehicles(data);
  };

  const handleAddNew = () => {
    setFormData({});
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = '/api/vehicles';
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) {
        const error = await res.json();
        alert('Error: ' + (error.error || 'Failed to create vehicle'));
        return;
      }
      
      setShowAddModal(false);
      setFormData({});
      fetchVehicles();
    } catch (error) {
      console.error('Submit error:', error);
      alert('Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

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
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Hub Management</span>
                </div>
            </div>



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
            
            {/* Vehicles Tab */}
            <VehicleList vehicles={vehicles} onAdd={() => handleAddNew()} />

            {/* Add Modal */}
            <AddModal 
              show={showAddModal}
              onClose={() => setShowAddModal(false)}
              type='vehicle'
              onSubmit={handleSubmit}
              formData={formData}
              setFormData={setFormData}
            />

        </div>
    </main>

    {/* Footer */}
    <footer className="bg-white border-t border-slate-200 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-sm text-slate-500">
                    © 2024 inneedit Global Logistics Private Limited. All rights reserved.
                </div>
                <div className="flex gap-6 text-sm font-medium text-slate-600">
                    <a href="#" className="hover:text-slate-900 transition-colors">Help Center</a>
                    <a href="#" className="hover:text-slate-900 transition-colors">Contact Support</a>
                    <a href="#" className="hover:text-slate-900 transition-colors">Terms of Service</a>
                </div>
            </div>
        </div>
    </footer>
        </div>
      </>
    );
}

export default function HubManagementPage() {
  return (
    <ProtectedRoute>
      <HubManagementContent />
    </ProtectedRoute>
  );
}
