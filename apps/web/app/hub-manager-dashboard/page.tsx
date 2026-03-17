'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { LogOut, Package, Warehouse, AlertCircle } from 'lucide-react';

function HubManagerDashboardContent() {
  const router = useRouter();
  const [managerData, setManagerData] = useState<any>(null);
  const [hubData, setHubData] = useState<any>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Check if session exists
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/hub-managers/dashboard');
        if (!response.ok) {
          router.push('/login');
        }
      } catch (error) {
        router.push('/login');
      }
    };

    checkSession();
  }, [router]);

  // Fetch hub manager data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get hub manager's hub info
        const hubResponse = await fetch('/api/hub-managers/dashboard');
        if (hubResponse.ok) {
          const hubInfo = await hubResponse.json();
          setManagerData(hubInfo);
          setHubData(hubInfo);

          // Get vehicles at this hub
          const vehiclesResponse = await fetch(`/api/hub-managers/vehicles?hubId=${hubInfo.hubId}`);
          if (vehiclesResponse.ok) {
            const vehiclesData = await vehiclesResponse.json();
            setVehicles(vehiclesData);
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/hub-managers/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    }
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-sm font-medium text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mesh-bg min-h-screen flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="h-10">
              <img 
                src="https://app-cdn.appgen.com/c8d1da7a-8da9-4a1f-8aaa-2cb65f828731/assets/uploaded_1772434426357_uwdii.png" 
                alt="inneedit" 
                className="h-full w-auto" 
              />
            </div>
            <div>
              <h1 className="font-display font-bold text-base leading-none text-slate-900">
                inneedit Global Logistics
              </h1>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Hub Manager Dashboard
              </span>
            </div>
          </div>

          {/* Hub Info */}
          {hubData && (
            <div className="hidden md:block">
              <h2 className="text-sm font-semibold text-slate-900">{hubData.hubName}</h2>
              <p className="text-xs text-slate-500">{hubData.city}, {hubData.state}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all">
              <i className="ph ph-bell text-xl"></i>
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-900">{managerData?.name || 'Hub Manager'}</p>
              <p className="text-xs text-slate-500">{hubData?.hubCode || 'HUB'}</p>
            </div>
              <button
                onClick={handleLogout}
                className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow pt-28 pb-12 px-6">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">Total Vehicles</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">
                    {vehicles.length}
                  </p>
                </div>
                <Package className="w-12 h-12 text-green-100" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">Available Vehicles</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">
                    {vehicles.filter((v: any) => v.status === 'available').length}
                  </p>
                </div>
                <Warehouse className="w-12 h-12 text-orange-100" />
              </div>
            </div>
          </div>

          {/* Hub Information */}
          {hubData && (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Hub Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-sm font-medium text-slate-600 mb-4">Basic Details</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-slate-500">Hub Name</p>
                      <p className="text-sm font-medium text-slate-900">{hubData.hubName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Hub Code</p>
                      <p className="text-sm font-medium text-slate-900">{hubData.hubCode}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Location</p>
                      <p className="text-sm font-medium text-slate-900">{hubData.location}, {hubData.city}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">State</p>
                      <p className="text-sm font-medium text-slate-900">{hubData.state}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-600 mb-4">Manager Details</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-slate-500">Manager Name</p>
                      <p className="text-sm font-medium text-slate-900">{managerData?.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Manager Email</p>
                      <p className="text-sm font-medium text-slate-900">{managerData?.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Pincode</p>
                      <p className="text-sm font-medium text-slate-900">{hubData.pincode}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Vehicles List */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">Hub Vehicles</h2>
              <p className="text-sm text-slate-600 mt-1">{vehicles.length} vehicles at this hub</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-8 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Vehicle Number</th>
                    <th className="px-8 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Type</th>
                    <th className="px-8 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Model</th>
                    <th className="px-8 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Year</th>
                    <th className="px-8 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-8 text-center">
                        <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">No vehicles at this hub yet</p>
                      </td>
                    </tr>
                  ) : (
                    vehicles.map((vehicle: any) => (
                      <tr key={vehicle.id} className="border-b border-slate-200 hover:bg-slate-50 transition">
                        <td className="px-8 py-4">
                          <p className="font-medium text-slate-900">{vehicle.vehicle_number}</p>
                        </td>
                        <td className="px-8 py-4">
                          <p className="text-sm text-slate-600">{vehicle.vehicle_type}</p>
                        </td>
                        <td className="px-8 py-4">
                          <p className="text-sm text-slate-600">{vehicle.model}</p>
                        </td>
                        <td className="px-8 py-4">
                          <p className="text-sm text-slate-600">{vehicle.year}</p>
                        </td>
                        <td className="px-8 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            vehicle.status === 'active' 
                              ? 'bg-green-100 text-green-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {vehicle.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
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
  );
}

export default function HubManagerDashboardPage() {
  return <HubManagerDashboardContent />;
}
