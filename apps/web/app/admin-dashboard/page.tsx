'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { GoogleMapsLoader } from '@/components/GoogleMapsLoader';
import GooglePlacesAutocomplete from '@/components/GooglePlacesAutocomplete';
import InvoiceUpload from '@/components/InvoiceUpload';

const StoreMapView = dynamic(() => import('@/components/StoreMapView'), {
  ssr: false,
  loading: () => (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
        <i className="ph-duotone ph-map-trifold text-3xl text-slate-400"></i>
      </div>
      <p className="text-slate-600">Loading map component...</p>
    </div>
  ),
});

const DashboardMapView = dynamic(() => import('@/components/DashboardMapView'), {
  ssr: false,
  loading: () => (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
        <i className="ph-duotone ph-map-trifold text-3xl text-slate-400"></i>
      </div>
      <p className="text-slate-600">Loading map component...</p>
    </div>
  ),
});

function AdminDashboardContent() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [riders, setRiders] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [hubs, setHubs] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState<'vehicle' | 'hub' | 'store'>('vehicle');
  const [showMapView, setShowMapView] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [hubsForVehicle, setHubsForVehicle] = useState<any[]>([]);
  const [viewItem, setViewItem] = useState<any>(null);
  const [editItem, setEditItem] = useState<any>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [hubsForRider, setHubsForRider] = useState<any[]>([]);
  const [storesForRider, setStoresForRider] = useState<any[]>([]);
  const [vehiclesForRider, setVehiclesForRider] = useState<any[]>([]);
  
  const [ridersCount, setRidersCount] = useState(0);
  const [vehiclesCount, setVehiclesCount] = useState(0);
  const [hubsCount, setHubsCount] = useState(0);
  const [storesCount, setStoresCount] = useState(0);

  const [payrollMode, setPayrollMode] = useState<'manual' | 'ai' | 'history'>('manual');
  const [manualEntries, setManualEntries] = useState<any[]>([]);
  const [payoutHistory, setPayoutHistory] = useState<any[]>([]);
  const [selectedRiders, setSelectedRiders] = useState<Set<number>>(new Set());
  const [calculatedPayouts, setCalculatedPayouts] = useState<any[]>([]);
  const [weekNumber, setWeekNumber] = useState(1);
  const [weekPeriod, setWeekPeriod] = useState('');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [settings, setSettings] = useState<any>({});

  const [advances, setAdvances] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [pendingAdvancesCount, setPendingAdvancesCount] = useState(0);
  const [pendingReferralsCount, setPendingReferralsCount] = useState(0);

  useEffect(() => {
    fetchCounts();
    if (activeTab === 'riders') fetchRiders();
    if (activeTab === 'vehicles') fetchVehicles();
    if (activeTab === 'hubs') fetchHubs();
    if (activeTab === 'stores') fetchStores();
    if (activeTab === 'advances') fetchAdvances();
    if (activeTab === 'referrals') fetchReferrals();
    if (activeTab === 'payroll') {
      fetchRiders();
      fetchPayoutHistory();
      fetchSettings();
    }
  }, [activeTab]);

  useEffect(() => {
    const advancesInterval = setInterval(() => {
      fetchCounts();
    }, 10000);
    return () => clearInterval(advancesInterval);
  }, []);

  const fetchCounts = async () => {
    try {
      const [ridersRes, vehiclesRes, hubsRes, storesRes, advancesRes, referralsRes] = await Promise.all([
        fetch('/api/riders?action=count'),
        fetch('/api/vehicles?action=count'),
        fetch('/api/hubs?action=count'),
        fetch('/api/stores?action=count'),
        fetch('/api/advances?action=count'),
        fetch('/api/referrals?action=count')
      ]);
      
      const ridersData = await ridersRes.json();
      const vehiclesData = await vehiclesRes.json();
      const hubsData = await hubsRes.json();
      const storesData = await storesRes.json();
      const advancesData = await advancesRes.json();
      const referralsData = await referralsRes.json();
      
      setRidersCount(ridersData.count || 0);
      setVehiclesCount(vehiclesData.count || 0);
      setHubsCount(hubsData.count || 0);
      setStoresCount(storesData.count || 0);
      setPendingAdvancesCount(advancesData.pendingCount || 0);
      setPendingReferralsCount(referralsData.pendingCount || 0);
    } catch (error) {
      console.error('Error fetching counts:', error);
    }
  };

  const fetchRiders = async () => {
    const res = await fetch('/api/riders');
    const data = await res.json();
    setRiders(data.riders || []);
  };

  const fetchVehicles = async () => {
    const res = await fetch('/api/vehicles');
    const data = await res.json();
    setVehicles(data);
  };

  const fetchHubs = async () => {
    const res = await fetch('/api/hubs');
    const data = await res.json();
    setHubs(data);
  };

  const fetchStores = async () => {
    const res = await fetch('/api/stores');
    const data = await res.json();
    setStores(data);
  };

  const fetchAdvances = async () => {
    try {
      const res = await fetch('/api/advances');
      const data = await res.json();
      setAdvances(data);
    } catch (error) {
      console.error('Error fetching advances:', error);
    }
  };

  const fetchReferrals = async () => {
    try {
      const res = await fetch('/api/referrals');
      const data = await res.json();
      setReferrals(data);
    } catch (error) {
      console.error('Error fetching referrals:', error);
    }
  };

  const fetchPayoutHistory = async () => {
    try {
      const res = await fetch('/api/payroll?action=history');
      const data = await res.json();
      setPayoutHistory(data);
    } catch (error) {
      console.error('Error fetching payout history:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      const settingsObj: any = {};
      data.forEach((setting: any) => {
        settingsObj[setting.setting_key] = setting.setting_value;
      });
      setSettings(settingsObj);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleAddNew = async (type: 'vehicle' | 'hub' | 'store') => {
    setModalType(type);
    setFormData({});
    
    if (type === 'vehicle') {
      const res = await fetch('/api/hubs');
      const data = await res.json();
      setHubsForVehicle(data);
    }
    
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = `/api/${modalType}s`;
    await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    setShowAddModal(false);
    setFormData({});
    if (modalType === 'vehicle') fetchVehicles();
    if (modalType === 'hub') fetchHubs();
    if (modalType === 'store') fetchStores();
  };

  const handleView = (item: any, type: string) => {
    setViewItem({ ...item, type });
    setShowViewModal(true);
  };

  const handleEdit = async (item: any, type: string) => {
    setEditItem({ ...item, type });
    if (type === 'vehicle') {
      const res = await fetch('/api/hubs');
      const data = await res.json();
      setHubsForVehicle(data);
    }
    setShowEditModal(true);
  };

  const handleDelete = async (id: number, type: string) => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;
    
    try {
      const endpoint = `/api/${type}s?id=${id}`;
      const response = await fetch(endpoint, { method: 'DELETE' });
      const data = await response.json();
      
      if (!response.ok) {
        alert(data.error || `Failed to delete ${type}`);
        return;
      }
      
      alert(data.message || `${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`);
      
      if (type === 'rider') { fetchRiders(); fetchCounts(); }
      if (type === 'vehicle') { fetchVehicles(); fetchCounts(); }
      if (type === 'hub') { fetchHubs(); fetchCounts(); }
      if (type === 'store') { fetchStores(); fetchCounts(); }
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      alert(`Failed to delete ${type}. Please try again.`);
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const type = editItem.type;
    const endpoint = `/api/${type}s`;
    await fetch(endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editItem)
    });
    setShowEditModal(false);
    setEditItem(null);
    if (type === 'rider') fetchRiders();
    if (type === 'vehicle') fetchVehicles();
    if (type === 'hub') fetchHubs();
    if (type === 'store') fetchStores();
  };

  const handleAdvanceAction = async (id: number, status: string) => {
    try {
      await fetch('/api/advances', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, processedBy: 'admin' })
      });
      fetchAdvances();
      fetchCounts();
      alert(`Advance request ${status}!`);
    } catch (error) {
      console.error('Error updating advance:', error);
      alert('Failed to update advance request');
    }
  };

  return (
    <>
      <GoogleMapsLoader>
      <div className="mesh-bg text-slate-800 antialiased min-h-screen">
        <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200">
          <div className="px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10">
                <img src="https://app-cdn.appgen.com/c8d1da7a-8da9-4a1f-8aaa-2cb65f828731/assets/uploaded_1772434426357_uwdii.png" alt="inneedit" className="h-full w-auto" />
              </div>
              <div>
                <h1 className="font-display font-bold text-sm leading-none text-slate-900">inneedit</h1>
                <span className="text-xs font-medium text-slate-500">Admin Portal</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-700 to-slate-900 flex items-center justify-center text-white text-sm font-bold">A</div>
                <div className="hidden md:block">
                  <p className="text-sm font-semibold text-slate-900">Admin Portal</p>
                  <p className="text-xs text-slate-500">inneedit Global</p>
                </div>
                <button onClick={() => router.push('/login')} className="px-4 py-2 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 rounded-lg text-sm font-medium transition-all flex items-center gap-2">
                  <i className="ph-bold ph-sign-out"></i>
                  Back to Login
                </button>
              </div>
            </div>
          </div>

          <nav className="border-t border-slate-200 overflow-x-auto">
            <div className="flex px-6">
              {['dashboard', 'riders', 'vehicles', 'hubs', 'stores', 'advances', 'referrals', 'payroll'].map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)} 
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all border-b-2 ${
                    activeTab === tab 
                      ? 'border-brand-600 text-brand-600 bg-brand-50/30' 
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {tab === 'dashboard' && <i className="ph-bold ph-gauge text-lg"></i>}
                  {tab === 'riders' && <i className="ph-bold ph-users text-lg"></i>}
                  {tab === 'vehicles' && <i className="ph-bold ph-truck text-lg"></i>}
                  {tab === 'hubs' && <i className="ph-bold ph-buildings text-lg"></i>}
                  {tab === 'stores' && <i className="ph-bold ph-storefront text-lg"></i>}
                  {tab === 'advances' && <i className="ph-bold ph-currency-dollar text-lg"></i>}
                  {tab === 'referrals' && <i className="ph-bold ph-user-plus text-lg"></i>}
                  {tab === 'payroll' && <i className="ph-bold ph-wallet text-lg"></i>}
                  <span className="capitalize">{tab}</span>
                  {tab === 'advances' && pendingAdvancesCount > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">{pendingAdvancesCount}</span>
                  )}
                  {tab === 'referrals' && pendingReferralsCount > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-purple-500 text-white text-xs font-bold rounded-full">{pendingReferralsCount}</span>
                  )}
                </button>
              ))}
            </div>
          </nav>
        </header>

        <main className="pt-[140px] pb-12 px-8">
          <div className="max-w-7xl mx-auto space-y-8">
            
            {activeTab === 'dashboard' && (
              <>
                <h2 className="font-display text-3xl font-bold text-slate-900 mb-2">Admin Dashboard</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <i className="ph-duotone ph-moped text-2xl text-brand-600"></i>
                      <h3 className="text-xs font-semibold text-slate-500 uppercase">Total Riders</h3>
                    </div>
                    <p className="text-4xl font-bold text-slate-900">{ridersCount}</p>
                  </div>
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <i className="ph-duotone ph-scooter text-2xl text-blue-600"></i>
                      <h3 className="text-xs font-semibold text-slate-500 uppercase">Fleet Vehicles</h3>
                    </div>
                    <p className="text-4xl font-bold text-slate-900">{vehiclesCount}</p>
                  </div>
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <i className="ph-duotone ph-buildings text-2xl text-purple-600"></i>
                      <h3 className="text-xs font-semibold text-slate-500 uppercase">Active Hubs</h3>
                    </div>
                    <p className="text-4xl font-bold text-slate-900">{hubsCount}</p>
                  </div>
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <i className="ph-duotone ph-storefront text-2xl text-green-600"></i>
                      <h3 className="text-xs font-semibold text-slate-500 uppercase">Client Stores</h3>
                    </div>
                    <p className="text-4xl font-bold text-slate-900">{storesCount}</p>
                  </div>
                </div>
                <DashboardMapView />
              </>
            )}

            {activeTab === 'riders' && (
              <>
                <div className="flex justify-between items-center">
                  <h2 className="font-display text-3xl font-bold text-slate-900">Rider Management ({ridersCount})</h2>
                  <button onClick={() => router.push('/rider-registration')} className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium flex items-center gap-2">
                    <i className="ph-bold ph-plus"></i>Register New Rider
                  </button>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Name</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Phone</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Email</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Status</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {riders.map((rider) => (
                        <tr key={rider.id} className="border-b border-slate-200 hover:bg-slate-50">
                          <td className="px-6 py-4 text-sm text-slate-900">{rider.full_name}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{rider.phone}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{rider.email}</td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${rider.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                              {rider.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right flex gap-2 justify-end">
                            <button onClick={() => handleView(rider, 'rider')} className="px-3 py-1 text-blue-600 text-sm font-medium border border-blue-200 rounded hover:bg-blue-50">View</button>
                            <button onClick={() => handleEdit(rider, 'rider')} className="px-3 py-1 text-amber-600 text-sm font-medium border border-amber-200 rounded hover:bg-amber-50">Edit</button>
                            <button onClick={() => handleDelete(rider.id, 'rider')} className="px-3 py-1 text-red-600 text-sm font-medium border border-red-200 rounded hover:bg-red-50">Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {activeTab === 'vehicles' && (
              <>
                <div className="flex justify-between items-center">
                  <h2 className="font-display text-3xl font-bold text-slate-900">Vehicle Management ({vehiclesCount})</h2>
                  <button onClick={() => handleAddNew('vehicle')} className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700">Add Vehicle</button>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Vehicle Number</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Type</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Model</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Status</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vehicles.map((vehicle: any) => (
                        <tr key={vehicle.id} className="border-b border-slate-200 hover:bg-slate-50">
                          <td className="px-6 py-4 text-sm text-slate-900">{vehicle.vehicle_number}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{vehicle.vehicle_type}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{vehicle.model}</td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${vehicle.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                              {vehicle.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right flex gap-2 justify-end">
                            <button onClick={() => handleView(vehicle, 'vehicle')} className="px-3 py-1 text-blue-600 text-sm font-medium border border-blue-200 rounded hover:bg-blue-50">View</button>
                            <button onClick={() => handleEdit(vehicle, 'vehicle')} className="px-3 py-1 text-amber-600 text-sm font-medium border border-amber-200 rounded hover:bg-amber-50">Edit</button>
                            <button onClick={() => handleDelete(vehicle.id, 'vehicle')} className="px-3 py-1 text-red-600 text-sm font-medium border border-red-200 rounded hover:bg-red-50">Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {activeTab === 'hubs' && (
              <>
                <div className="flex justify-between items-center">
                  <h2 className="font-display text-3xl font-bold text-slate-900">Hub Management ({hubsCount})</h2>
                  <button onClick={() => handleAddNew('hub')} className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700">Add Hub</button>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Hub Name</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Location</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Manager</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Status</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hubs.map((hub: any) => (
                        <tr key={hub.id} className="border-b border-slate-200 hover:bg-slate-50">
                          <td className="px-6 py-4 text-sm text-slate-900">{hub.hub_name}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{hub.location}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{hub.manager_name}</td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${hub.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                              {hub.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right flex gap-2 justify-end">
                            <button onClick={() => handleView(hub, 'hub')} className="px-3 py-1 text-blue-600 text-sm font-medium border border-blue-200 rounded hover:bg-blue-50">View</button>
                            <button onClick={() => handleEdit(hub, 'hub')} className="px-3 py-1 text-amber-600 text-sm font-medium border border-amber-200 rounded hover:bg-amber-50">Edit</button>
                            <button onClick={() => handleDelete(hub.id, 'hub')} className="px-3 py-1 text-red-600 text-sm font-medium border border-red-200 rounded hover:bg-red-50">Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {activeTab === 'stores' && (
              <>
                <div className="flex justify-between items-center">
                  <h2 className="font-display text-3xl font-bold text-slate-900">Store Management ({storesCount})</h2>
                  <div className="flex gap-3">
                    <button onClick={() => setShowMapView(!showMapView)} className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${showMapView ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                      <i className="ph-bold ph-map"></i>{showMapView ? 'List View' : 'Map View'}
                    </button>
                    <button onClick={() => handleAddNew('store')} className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700">Add Store</button>
                  </div>
                </div>
                {showMapView ? (
                  <StoreMapView />
                ) : (
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Store Name</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Location</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Manager</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Status</th>
                          <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stores.map((store: any) => (
                          <tr key={store.id} className="border-b border-slate-200 hover:bg-slate-50">
                            <td className="px-6 py-4 text-sm text-slate-900">{store.store_name}</td>
                            <td className="px-6 py-4 text-sm text-slate-600">{store.location}</td>
                            <td className="px-6 py-4 text-sm text-slate-600">{store.store_manager_name}</td>
                            <td className="px-6 py-4 text-sm">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${store.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                                {store.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right flex gap-2 justify-end">
                              <button onClick={() => handleView(store, 'store')} className="px-3 py-1 text-blue-600 text-sm font-medium border border-blue-200 rounded hover:bg-blue-50">View</button>
                              <button onClick={() => handleEdit(store, 'store')} className="px-3 py-1 text-amber-600 text-sm font-medium border border-amber-200 rounded hover:bg-amber-50">Edit</button>
                              <button onClick={() => handleDelete(store.id, 'store')} className="px-3 py-1 text-red-600 text-sm font-medium border border-red-200 rounded hover:bg-red-50">Delete</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {activeTab === 'advances' && (
              <>
                <h2 className="font-display text-3xl font-bold text-slate-900">Advance Requests ({pendingAdvancesCount})</h2>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Rider</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Amount</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Reason</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Status</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {advances.map((advance: any) => (
                        <tr key={advance.id} className="border-b border-slate-200 hover:bg-slate-50">
                          <td className="px-6 py-4 text-sm text-slate-900">{advance.rider_name}</td>
                          <td className="px-6 py-4 text-sm text-slate-900 font-semibold">₹{advance.amount}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{advance.reason}</td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${advance.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : advance.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {advance.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            {advance.status === 'pending' && (
                              <>
                                <button onClick={() => handleAdvanceAction(advance.id, 'approved')} className="text-green-600 hover:text-green-700 text-sm font-medium">Approve</button>
                                <button onClick={() => handleAdvanceAction(advance.id, 'rejected')} className="text-red-600 hover:text-red-700 text-sm font-medium">Reject</button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {activeTab === 'referrals' && (
              <>
                <h2 className="font-display text-3xl font-bold text-slate-900">Referral Management ({pendingReferralsCount})</h2>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Referrer</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Referred</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Phone</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Status</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {referrals.map((referral: any) => (
                        <tr key={referral.id} className="border-b border-slate-200 hover:bg-slate-50">
                          <td className="px-6 py-4 text-sm text-slate-900">{referral.referrer_name}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{referral.referred_name}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{referral.referred_phone}</td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${referral.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : referral.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {referral.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right flex gap-2 justify-end">
                            <button onClick={() => handleView(referral, 'referral')} className="px-3 py-1 text-blue-600 text-sm font-medium border border-blue-200 rounded hover:bg-blue-50">View</button>
                            <button onClick={() => handleEdit(referral, 'referral')} className="px-3 py-1 text-amber-600 text-sm font-medium border border-amber-200 rounded hover:bg-amber-50">Edit</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {activeTab === 'payroll' && (
              <>
                <h2 className="font-display text-3xl font-bold text-slate-900">Payroll Management</h2>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                  <p className="text-slate-600">Payroll module content here</p>
                </div>
              </>
            )}
          </div>
        </main>

        <footer className="bg-white border-t border-slate-200 py-8">
          <div className="max-w-7xl mx-auto px-6 text-center text-sm text-slate-500">
            © 2024 inneedit Global Logistics Private Limited. All rights reserved.
          </div>
        </footer>

        {showViewModal && viewItem && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-96 overflow-y-auto">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900">View {viewItem.type}</h3>
                <button onClick={() => setShowViewModal(false)} className="p-1 hover:bg-slate-100 rounded">
                  <i className="ph-bold ph-x text-xl"></i>
                </button>
              </div>
              <div className="p-6 space-y-4">
                {Object.entries(viewItem).filter(([k]) => k !== 'type').map(([key, value]: any) => (
                  <div key={key}>
                    <strong className="capitalize">{key}:</strong> {String(value)}
                  </div>
                ))}
              </div>
              <div className="p-6 border-t border-slate-200 flex gap-3 justify-end">
                <button onClick={() => setShowViewModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium">Close</button>
              </div>
            </div>
          </div>
        )}

        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-96 overflow-y-auto">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900">Add {modalType.charAt(0).toUpperCase() + modalType.slice(1)}</h3>
                <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-slate-100 rounded">
                  <i className="ph-bold ph-x text-xl"></i>
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {modalType === 'vehicle' && (
                  <>
                    <input placeholder="Vehicle Number" value={formData.vehicle_number || ''} onChange={(e) => setFormData({...formData, vehicle_number: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" required />
                    <input placeholder="Type" value={formData.vehicle_type || ''} onChange={(e) => setFormData({...formData, vehicle_type: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" required />
                    <input placeholder="Model" value={formData.model || ''} onChange={(e) => setFormData({...formData, model: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" required />
                    <input placeholder="Year" type="number" value={formData.year || ''} onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" required />
                    <select value={formData.hub_id || ''} onChange={(e) => setFormData({...formData, hub_id: parseInt(e.target.value)})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" required>
                      <option value="">Select a hub</option>
                      {hubsForVehicle.map((hub: any) => (
                        <option key={hub.id} value={hub.id}>{hub.hub_name}</option>
                      ))}
                    </select>
                  </>
                )}
                {modalType === 'hub' && (
                  <>
                    <input placeholder="Hub Name" value={formData.hub_name || ''} onChange={(e) => setFormData({...formData, hub_name: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" required />
                    <input placeholder="Location" value={formData.location || ''} onChange={(e) => setFormData({...formData, location: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" required />
                    <input placeholder="City" value={formData.city || ''} onChange={(e) => setFormData({...formData, city: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" required />
                    <input placeholder="Manager Name" value={formData.manager_name || ''} onChange={(e) => setFormData({...formData, manager_name: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" required />
                    <input placeholder="Manager Phone" value={formData.manager_phone || ''} onChange={(e) => setFormData({...formData, manager_phone: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" required />
                  </>
                )}
                {modalType === 'store' && (
                  <>
                    <input placeholder="Store Name" value={formData.store_name || ''} onChange={(e) => setFormData({...formData, store_name: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" required />
                    <input placeholder="Location" value={formData.location || ''} onChange={(e) => setFormData({...formData, location: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" required />
                    <input placeholder="City" value={formData.city || ''} onChange={(e) => setFormData({...formData, city: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" required />
                    <input placeholder="Store Manager" value={formData.store_manager_name || ''} onChange={(e) => setFormData({...formData, store_manager_name: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" required />
                    <input placeholder="Store Manager Phone" value={formData.store_manager_phone || ''} onChange={(e) => setFormData({...formData, store_manager_phone: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" required />
                  </>
                )}
                <div className="flex gap-3 justify-end pt-4">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium">Add</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showEditModal && editItem && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-96 overflow-y-auto">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900">Edit {editItem.type}</h3>
                <button onClick={() => setShowEditModal(false)} className="p-1 hover:bg-slate-100 rounded">
                  <i className="ph-bold ph-x text-xl"></i>
                </button>
              </div>
              <form onSubmit={handleUpdateSubmit} className="p-6 space-y-4">
                {editItem.type === 'rider' && (
                  <>
                    <input value={editItem.full_name || ''} onChange={(e) => setEditItem({...editItem, full_name: e.target.value})} placeholder="Full Name" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                    <input value={editItem.email || ''} onChange={(e) => setEditItem({...editItem, email: e.target.value})} placeholder="Email" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                    <input value={editItem.phone || ''} onChange={(e) => setEditItem({...editItem, phone: e.target.value})} placeholder="Phone" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                  </>
                )}
                {editItem.type === 'vehicle' && (
                  <>
                    <input value={editItem.vehicle_number || ''} onChange={(e) => setEditItem({...editItem, vehicle_number: e.target.value})} placeholder="Vehicle Number" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                    <input value={editItem.vehicle_type || ''} onChange={(e) => setEditItem({...editItem, vehicle_type: e.target.value})} placeholder="Type" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                    <input value={editItem.model || ''} onChange={(e) => setEditItem({...editItem, model: e.target.value})} placeholder="Model" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                  </>
                )}
                {editItem.type === 'hub' && (
                  <>
                    <input value={editItem.hub_name || ''} onChange={(e) => setEditItem({...editItem, hub_name: e.target.value})} placeholder="Hub Name" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                    <input value={editItem.location || ''} onChange={(e) => setEditItem({...editItem, location: e.target.value})} placeholder="Location" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                    <input value={editItem.manager_name || ''} onChange={(e) => setEditItem({...editItem, manager_name: e.target.value})} placeholder="Manager Name" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                  </>
                )}
                {editItem.type === 'store' && (
                  <>
                    <input value={editItem.store_name || ''} onChange={(e) => setEditItem({...editItem, store_name: e.target.value})} placeholder="Store Name" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                    <input value={editItem.location || ''} onChange={(e) => setEditItem({...editItem, location: e.target.value})} placeholder="Location" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                  </>
                )}
                <div className="flex gap-3 justify-end pt-4">
                  <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium">Save</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      </GoogleMapsLoader>
    </>
  );
}

export default function AdminDashboardPage() {
  return <AdminDashboardContent />;
}
