'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { GoogleMapsLoader } from '@/components/GoogleMapsLoader';
import GooglePlacesAutocomplete from '@/components/GooglePlacesAutocomplete';
import InvoiceUpload from '@/components/InvoiceUpload';
import LocationSearch from '@/components/LocationSearch';
import StoresManagement from '@/components/StoresManagement';
import HubsManagement from '@/components/HubsManagement';
import WeatherBadge from '@/components/WeatherBadge';

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

  const [stores, setStores] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState<'vehicle' | 'hub' | 'store'>('vehicle');
  const [showMapView, setShowMapView] = useState(false);
  const [formData, setFormData] = useState<any>({});

  const [viewItem, setViewItem] = useState<any>(null);
  const [editItem, setEditItem] = useState<any>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [availableRiders, setAvailableRiders] = useState<any[]>([]);
  const [selectedRiderId, setSelectedRiderId] = useState<string>('');

  const [storesForRider, setStoresForRider] = useState<any[]>([]);
  const [vehiclesForRider, setVehiclesForRider] = useState<any[]>([]);
  
  const [ridersCount, setRidersCount] = useState(0);
  const [vehiclesCount, setVehiclesCount] = useState(0);
  const [hubsCount, setHubsCount] = useState(0);
  const [storesCount, setStoresCount] = useState(0);



  const [advances, setAdvances] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [pendingAdvancesCount, setPendingAdvancesCount] = useState(0);
  const [pendingReferralsCount, setPendingReferralsCount] = useState(0);

  useEffect(() => {
    fetchCounts();
    if (activeTab === 'riders') fetchRiders();
    if (activeTab === 'vehicles') fetchVehicles();

    if (activeTab === 'advances') fetchAdvances();
    if (activeTab === 'referrals') fetchReferrals();
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



  const handleAddNew = async (type: 'vehicle' | 'hub' | 'store') => {
    setModalType(type);
    if (type === 'hub') {
      setFormData({ status: 'active' });
    } else {
      setFormData({});
    }
    

    
    setShowAddModal(true);
  };

  const fetchHubs = async () => {
    const res = await fetch('/api/hubs');
    const data = await res.json();
    return data;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const endpoint = `/api/${modalType}s`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      
      if (!response.ok) {
        alert(data.error || `Failed to add ${modalType}`);
        return;
      }
      
      setShowAddModal(false);
      setFormData({});
      
      if (modalType === 'vehicle') fetchVehicles();
      if (modalType === 'hub') fetchCounts();
      if (modalType === 'store') { fetchStores(); fetchCounts(); }
      
      alert(`${modalType.charAt(0).toUpperCase() + modalType.slice(1)} added successfully!`);
    } catch (error) {
      console.error(`Error adding ${modalType}:`, error);
      alert(`Failed to add ${modalType}. Please try again.`);
    }
  };

  const handleView = (item: any, type: string) => {
    setViewItem({ ...item, type });
    setShowViewModal(true);
  };

  const handleEdit = async (item: any, type: string) => {
    setEditItem({ ...item, type });
    if (type === 'vehicle') {
      // Fetch available riders if assigning
      if (item.showAssignModal) {
        try {
          const res = await fetch('/api/riders');
          const data = await res.json();
          // Filter riders who don't have a vehicle assigned
          const unassignedRiders = (data.riders || []).filter((rider: any) => !rider.assigned_vehicle_id);
          setAvailableRiders(unassignedRiders);
          setSelectedRiderId('');
          console.log('Available riders:', unassignedRiders);
        } catch (error) {
          console.error('Error fetching riders:', error);
        }
      }
    }
    setShowEditModal(true);
  };

  const handleAssignRider = async (vehicleId: number, riderId: string) => {
    if (!riderId) {
      alert('Please select a rider');
      return;
    }
    
    try {
      const response = await fetch('/api/vehicles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: vehicleId,
          assigned_rider_id: riderId,
          status: 'assigned'
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        alert(data.error || 'Failed to assign vehicle');
        return;
      }
      
      alert('Vehicle assigned successfully!');
      setShowEditModal(false);
      setEditItem(null);
      setSelectedRiderId('');
      fetchVehicles();
    } catch (error) {
      console.error('Error assigning vehicle:', error);
      alert('Failed to assign vehicle');
    }
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
      if (type === 'hub') { fetchCounts(); }
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

  const handleReferralApproval = async (id: number, referred_rider_id: string, action: 'approve' | 'reject') => {
    try {
      const response = await fetch('/api/referrals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action, referred_rider_id })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        alert(data.error || `Failed to ${action} referral`);
        return;
      }
      
      fetchReferrals();
      fetchCounts();
      
      if (action === 'approve') {
        alert('Referral approved! Rider will receive ₹1000 after 30 days if they remain active.');
      } else {
        alert('Referral rejected!');
      }
    } catch (error) {
      console.error(`Error ${action}ing referral:`, error);
      alert(`Failed to ${action} referral`);
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
              <div className="hidden md:block">
                <WeatherBadge latitude={12.9716} longitude={77.5946} locationName="HQ" />
              </div>
              <button className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all" title="Notifications">
                <i className="ph ph-bell text-xl"></i>
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
              </button>
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
              {['dashboard', 'riders', 'vehicles', 'hubs', 'stores', 'advances', 'referrals', 'payroll', 'entries', 'payout'].map((tab) => (
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
                  {tab === 'hubs' && <i className="ph-bold ph-building text-lg"></i>}
                  {tab === 'stores' && <i className="ph-bold ph-storefront text-lg"></i>}
                  {tab === 'advances' && <i className="ph-bold ph-currency-dollar text-lg"></i>}
                  {tab === 'referrals' && <i className="ph-bold ph-user-plus text-lg"></i>}
                  {tab === 'payroll' && <i className="ph-bold ph-money text-lg"></i>}
                  {tab === 'entries' && <i className="ph-bold ph-list text-lg"></i>}
                  {tab === 'payout' && <i className="ph-bold ph-credit-card text-lg"></i>}

                  <span className="capitalize">{tab === 'entries' ? 'Payroll Entries' : tab === 'payout' ? 'Payout' : tab}</span>
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

        <main className="pt-[160px] pb-12 px-8">
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
                      <i className="ph-duotone ph-building text-2xl text-purple-600"></i>
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
                  <button onClick={() => handleAddNew('vehicle')} className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium flex items-center gap-2">
                    <i className="ph-bold ph-plus"></i>Add Vehicle
                  </button>
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
                          <td className="px-6 py-4 text-sm font-medium text-slate-900">{vehicle.vehicle_number}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{vehicle.vehicle_type}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{vehicle.model}</td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                              vehicle.status === 'available' ? 'bg-green-100 text-green-700' :
                              vehicle.status === 'assigned' ? 'bg-blue-100 text-blue-700' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {vehicle.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex gap-2 justify-end">
                              {vehicle.status === 'available' && !vehicle.assigned_rider_id && (
                                <button
                                  onClick={() => {
                                    setEditItem({ ...vehicle, type: 'vehicle', showAssignModal: true });
                                    setShowEditModal(true);
                                  }}
                                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all" title="Assign Rider"
                                >
                                  <i className="ph-bold ph-check text-xl"></i>
                                </button>
                              )}
                              <button
                                onClick={() => handleView(vehicle, 'vehicle')}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="View"
                              >
                                <i className="ph-bold ph-eye text-xl"></i>
                              </button>
                              <button
                                onClick={() => {
                                  setEditItem({ ...vehicle, type: 'vehicle' });
                                  setShowEditModal(true);
                                }}
                                className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-all" title="Edit"
                              >
                                <i className="ph-bold ph-pencil text-xl"></i>
                              </button>
                              <button
                                onClick={() => handleDelete(vehicle.id, 'vehicle')}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Delete"
                              >
                                <i className="ph-bold ph-trash text-xl"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}



            {activeTab === 'hubs' && (
              <HubsManagement />
            )}

            {activeTab === 'stores' && (
              <StoresManagement />
            )}



            {activeTab === 'advances' && (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="font-display text-3xl font-bold text-slate-900">Advance Requests ({advances.length})</h2>
                  <div className="flex gap-2">
                    <select
                      onChange={(e) => {
                        if (e.target.value === 'all') fetchAdvances();
                        else {
                          const filtered = advances.filter(a => a.status === e.target.value);
                          setAdvances(filtered);
                        }
                      }}
                      className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-600"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Rider Name</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">CEE ID</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Store Location</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Amount</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Reason</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Status</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Date Requested</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {advances.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-6 py-8 text-center text-slate-500">No advance requests found</td>
                        </tr>
                      ) : (
                        advances.map((advance: any) => (
                          <tr key={advance.id} className="border-b border-slate-200 hover:bg-slate-50">
                            <td className="px-6 py-4 text-sm font-medium text-slate-900">{advance.rider_name || 'N/A'}</td>
                            <td className="px-6 py-4 text-sm text-slate-700 font-semibold">{advance.cee_id || advance.rider_id || 'N/A'}</td>
                            <td className="px-6 py-4 text-sm text-slate-600">{advance.store_location || 'N/A'}</td>
                            <td className="px-6 py-4 text-sm font-semibold text-slate-900">₹{parseFloat(advance.amount || 0).toFixed(2)}</td>
                            <td className="px-6 py-4 text-sm text-slate-600">{advance.reason || 'N/A'}</td>
                            <td className="px-6 py-4 text-sm">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                                advance.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                                advance.status === 'approved' ? 'bg-green-100 text-green-700' : 
                                'bg-red-100 text-red-700'
                              }`}>
                                {advance.status?.charAt(0).toUpperCase() + advance.status?.slice(1) || 'Unknown'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600">
                              {advance.requested_at ? new Date(advance.requested_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: '2-digit', timeZone: 'Asia/Kolkata' }) : 'N/A'}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex gap-2 justify-end flex-wrap">
                                <button 
                                  onClick={() => handleView(advance, 'advance')} 
                                  className="px-3 py-1.5 text-blue-600 text-xs font-medium border border-blue-200 rounded hover:bg-blue-50 transition-all"
                                >
                                  View
                                </button>
                                {advance.status !== 'approved' && advance.status !== 'rejected' && (
                                  <>
                                    <button 
                                      onClick={() => handleAdvanceAction(advance.id, 'approved')} 
                                      className="px-3 py-1.5 text-green-600 text-xs font-medium border border-green-200 rounded hover:bg-green-50 transition-all"
                                    >
                                      Approve
                                    </button>
                                    <button 
                                      onClick={() => handleAdvanceAction(advance.id, 'rejected')} 
                                      className="px-3 py-1.5 text-red-600 text-xs font-medium border border-red-200 rounded hover:bg-red-50 transition-all"
                                    >
                                      Reject
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
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
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              referral.approval_status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                              referral.approval_status === 'approved' ? 'bg-green-100 text-green-700' : 
                              'bg-red-100 text-red-700'
                            }`}>
                              {referral.approval_status || 'pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right space-x-2 flex gap-2 justify-end">
                            <button onClick={() => handleView(referral, 'referral')} className="px-3 py-1 text-blue-600 text-sm font-medium border border-blue-200 rounded hover:bg-blue-50">View</button>
                            <button onClick={() => handleEdit(referral, 'referral')} className="px-3 py-1 text-amber-600 text-sm font-medium border border-amber-200 rounded hover:bg-amber-50">Edit</button>
                            {referral.approval_status === 'pending' && (
                              <>
                                <button onClick={() => handleReferralApproval(referral.id, referral.referrer_id, 'approve')} className="px-3 py-1 text-green-600 text-sm font-medium border border-green-200 rounded hover:bg-green-50">Approve</button>
                                <button onClick={() => handleReferralApproval(referral.id, referral.referrer_id, 'reject')} className="px-3 py-1 text-red-600 text-sm font-medium border border-red-200 rounded hover:bg-red-50">Reject</button>
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

            {activeTab === 'payroll' && (
              <>
                <div className="flex justify-between items-center">
                  <h2 className="font-display text-3xl font-bold text-slate-900">Payroll Management</h2>
                  <button onClick={() => router.push('/payroll-management')} className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium flex items-center gap-2">
                    <i className="ph-bold ph-arrow-right"></i>Open Payroll
                  </button>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
                  <i className="ph-duotone ph-money text-6xl text-brand-200 mb-4 block"></i>
                  <p className="text-slate-600 mb-4">Manage rider payroll, deductions, incentives, and more.</p>
                  <button onClick={() => router.push('/payroll-management')} className="px-6 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium">
                    Go to Payroll Management
                  </button>
                </div>
              </>
            )}

            {activeTab === 'entries' && (
              <>
                <div className="flex justify-between items-center">
                  <h2 className="font-display text-3xl font-bold text-slate-900">Payroll Entries</h2>
                  <button onClick={() => router.push('/payroll-entries')} className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium flex items-center gap-2">
                    <i className="ph-bold ph-arrow-right"></i>View All Entries
                  </button>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
                  <i className="ph-duotone ph-list text-6xl text-brand-200 mb-4 block"></i>
                  <p className="text-slate-600 mb-4">View and manage all payroll entries including referrals, incentives, advances, and deductions.</p>
                  <button onClick={() => router.push('/payroll-entries')} className="px-6 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium">
                    Go to Payroll Entries
                  </button>
                </div>
              </>
            )}

            {activeTab === 'payout' && (
              <>
                <div className="flex justify-between items-center">
                  <h2 className="font-display text-3xl font-bold text-slate-900">Payroll Payout</h2>
                  <button onClick={() => router.push('/payroll-payout')} className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium flex items-center gap-2">
                    <i className="ph-bold ph-arrow-right"></i>Open Payout
                  </button>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
                  <i className="ph-duotone ph-credit-card text-6xl text-brand-200 mb-4 block"></i>
                  <p className="text-slate-600 mb-4">Upload invoices, download templates, and manage rider payouts with automatic calculations.</p>
                  <button onClick={() => router.push('/payroll-payout')} className="px-6 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium">
                    Go to Payout Management
                  </button>
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
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">View {viewItem.type === 'advance' ? 'Advance Request' : viewItem.type.charAt(0).toUpperCase() + viewItem.type.slice(1)}</h3>
                  {viewItem.type === 'rider' && <p className="text-xs text-slate-500 mt-1"><span className="text-red-600 font-bold">*</span> = Required fields</p>}
                </div>
                <button onClick={() => setShowViewModal(false)} className="p-1 hover:bg-slate-100 rounded">
                  <i className="ph-bold ph-x text-xl"></i>
                </button>
              </div>
              <div className="p-6 space-y-4">
                {viewItem.type === 'advance' ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <strong className="text-slate-500 text-sm">Rider Name:</strong>
                        <p className="text-slate-900 font-medium mt-1">{viewItem.rider_name || 'N/A'}</p>
                      </div>
                      <div>
                        <strong className="text-slate-500 text-sm">CEE ID:</strong>
                        <p className="text-slate-900 font-medium mt-1">{viewItem.cee_id || viewItem.rider_id || 'N/A'}</p>
                      </div>
                      <div>
                        <strong className="text-slate-500 text-sm">Amount:</strong>
                        <p className="text-slate-900 font-bold text-lg mt-1">₹{parseFloat(viewItem.amount || 0).toFixed(2)}</p>
                      </div>
                      <div>
                        <strong className="text-slate-500 text-sm">Store Location:</strong>
                        <p className="text-slate-900 font-medium mt-1">{viewItem.store_location || 'N/A'}</p>
                      </div>
                      <div className="col-span-2">
                        <strong className="text-slate-500 text-sm">Reason:</strong>
                        <p className="text-slate-900 font-medium mt-1">{viewItem.reason || 'N/A'}</p>
                      </div>
                      <div className="col-span-2">
                        <strong className="text-slate-500 text-sm">Status:</strong>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-1 ${
                          viewItem.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                          viewItem.status === 'approved' ? 'bg-green-100 text-green-700' : 
                          'bg-red-100 text-red-700'
                        }`}>
                          {viewItem.status?.charAt(0).toUpperCase() + viewItem.status?.slice(1) || 'Unknown'}
                        </span>
                      </div>
                      <div>
                        <strong className="text-slate-500 text-sm">Date Requested:</strong>
                        <p className="text-slate-900 font-medium mt-1">
                          {viewItem.requested_at ? new Date(viewItem.requested_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }) : 'N/A'}
                        </p>
                      </div>
                      {viewItem.processed_at && (
                        <div>
                          <strong className="text-slate-500 text-sm">Date Processed:</strong>
                          <p className="text-slate-900 font-medium mt-1">
                            {new Date(viewItem.processed_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })}
                          </p>
                        </div>
                      )}
                      {viewItem.processed_by && (
                        <div>
                          <strong className="text-slate-500 text-sm">Processed By:</strong>
                          <p className="text-slate-900 font-medium mt-1">{viewItem.processed_by}</p>
                        </div>
                      )}
                      {viewItem.admin_notes && (
                        <div className="col-span-2">
                          <strong className="text-slate-500 text-sm">Admin Notes:</strong>
                          <p className="text-slate-900 font-medium mt-1 p-3 bg-slate-50 rounded border border-slate-200">{viewItem.admin_notes}</p>
                        </div>
                      )}
                    </div>
                  </>
                ) : viewItem.type === 'rider' ? (
                  <>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center gap-1">
                          <strong className="text-slate-900 text-sm">Full Name <span className="text-red-600">*</span></strong>
                        </div>
                        <p className="text-slate-900 font-medium mt-1 p-2 bg-slate-50 rounded">{viewItem.full_name || 'Not set'}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <strong className="text-slate-900 text-sm">Email <span className="text-red-600">*</span></strong>
                          <p className="text-slate-900 font-medium mt-1 p-2 bg-slate-50 rounded">{viewItem.email || 'Not set'}</p>
                        </div>
                        <div>
                          <strong className="text-slate-900 text-sm">Phone <span className="text-red-600">*</span></strong>
                          <p className="text-slate-900 font-medium mt-1 p-2 bg-slate-50 rounded">{viewItem.phone || 'Not set'}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <strong className="text-slate-900 text-sm">Date of Birth</strong>
                          <p className="text-slate-900 font-medium mt-1 p-2 bg-slate-50 rounded">{viewItem.date_of_birth ? new Date(viewItem.date_of_birth).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'Not set'}</p>
                        </div>
                        <div>
                          <strong className="text-slate-900 text-sm">Gender</strong>
                          <p className="text-slate-900 font-medium mt-1 p-2 bg-slate-50 rounded">{viewItem.gender || 'Not set'}</p>
                        </div>
                      </div>
                      <div>
                        <strong className="text-slate-900 text-sm">Joining Date</strong>
                        <p className="text-slate-900 font-medium mt-1 p-2 bg-slate-50 rounded">{viewItem.join_date ? new Date(viewItem.join_date).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'Not set'}</p>
                      </div>
                    </div>

                    <div className="border-t pt-4 mt-4">
                      <h5 className="font-semibold text-slate-900 text-sm uppercase mb-3">Address</h5>
                      <div className="space-y-4">
                        <div>
                          <strong className="text-slate-900 text-sm">Address <span className="text-red-600">*</span></strong>
                          <p className="text-slate-900 font-medium mt-1 p-2 bg-slate-50 rounded">{viewItem.address || 'Not set'}</p>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <strong className="text-slate-900 text-sm">City <span className="text-red-600">*</span></strong>
                            <p className="text-slate-900 font-medium mt-1 p-2 bg-slate-50 rounded text-sm">{viewItem.city || 'Not set'}</p>
                          </div>
                          <div>
                            <strong className="text-slate-900 text-sm">State <span className="text-red-600">*</span></strong>
                            <p className="text-slate-900 font-medium mt-1 p-2 bg-slate-50 rounded text-sm">{viewItem.state || 'Not set'}</p>
                          </div>
                          <div>
                            <strong className="text-slate-900 text-sm">Pincode <span className="text-red-600">*</span></strong>
                            <p className="text-slate-900 font-medium mt-1 p-2 bg-slate-50 rounded text-sm">{viewItem.pincode || 'Not set'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4 mt-4">
                      <h5 className="font-semibold text-slate-900 text-sm uppercase mb-3">Emergency Contact</h5>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <strong className="text-slate-900 text-sm">Name <span className="text-red-600">*</span></strong>
                          <p className="text-slate-900 font-medium mt-1 p-2 bg-slate-50 rounded">{viewItem.emergency_contact_name || 'Not set'}</p>
                        </div>
                        <div>
                          <strong className="text-slate-900 text-sm">Phone <span className="text-red-600">*</span></strong>
                          <p className="text-slate-900 font-medium mt-1 p-2 bg-slate-50 rounded">{viewItem.emergency_contact_phone || 'Not set'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4 mt-4">
                      <h5 className="font-semibold text-slate-900 text-sm uppercase mb-3">Documents</h5>
                      <div className="space-y-3">
                        <div>
                          <strong className="text-slate-900 text-sm">Driving License <span className="text-red-600">*</span></strong>
                          <p className="text-slate-900 font-medium mt-1 p-2 bg-slate-50 rounded">{viewItem.driving_license_number || 'Not set'}</p>
                        </div>
                        <div>
                          <strong className="text-slate-900 text-sm">DL Expiry <span className="text-red-600">*</span></strong>
                          <p className="text-slate-900 font-medium mt-1 p-2 bg-slate-50 rounded">{viewItem.driving_license_expiry ? new Date(viewItem.driving_license_expiry).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'Not set'}</p>
                        </div>
                        <div>
                          <strong className="text-slate-900 text-sm">Aadhar <span className="text-red-600">*</span></strong>
                          <p className="text-slate-900 font-medium mt-1 p-2 bg-slate-50 rounded">{viewItem.aadhar_number || 'Not set'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4 mt-4">
                      <h5 className="font-semibold text-slate-900 text-sm uppercase mb-3">Bank Details</h5>
                      <div className="space-y-3">
                        <div>
                          <strong className="text-slate-900 text-sm">Bank <span className="text-red-600">*</span></strong>
                          <p className="text-slate-900 font-medium mt-1 p-2 bg-slate-50 rounded">{viewItem.bank_name || 'Not set'}</p>
                        </div>
                        <div>
                          <strong className="text-slate-900 text-sm">Account <span className="text-red-600">*</span></strong>
                          <p className="text-slate-900 font-medium mt-1 p-2 bg-slate-50 rounded">{viewItem.account_number || 'Not set'}</p>
                        </div>
                        <div>
                          <strong className="text-slate-900 text-sm">IFSC <span className="text-red-600">*</span></strong>
                          <p className="text-slate-900 font-medium mt-1 p-2 bg-slate-50 rounded">{viewItem.ifsc_code || 'Not set'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4 mt-4">
                      <h5 className="font-semibold text-slate-900 text-sm uppercase mb-3">Vehicle & EV Details</h5>
                      <div className="space-y-3">
                        <div>
                          <strong className="text-slate-900 text-sm">Ownership <span className="text-red-600">*</span></strong>
                          <p className="text-slate-900 font-medium mt-1 p-2 bg-slate-50 rounded capitalize">{viewItem.vehicle_ownership ? viewItem.vehicle_ownership.replace(/_/g, ' ') : 'Not set'}</p>
                        </div>
                        <div>
                          <strong className="text-slate-900 text-sm">EV Type <span className="text-red-600">*</span></strong>
                          <p className="text-slate-900 font-medium mt-1 p-2 bg-slate-50 rounded capitalize">{viewItem.ev_type ? viewItem.ev_type.replace(/_/g, ' ') : 'Not set'}</p>
                        </div>
                        <div>
                          <strong className="text-slate-900 text-sm">Daily Rent <span className="text-red-600">*</span></strong>
                          <p className="text-slate-900 font-bold text-lg mt-1 p-2 bg-slate-50 rounded">₹{parseFloat(viewItem.ev_daily_rent || 0).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4 mt-4">
                      <h5 className="font-semibold text-slate-900 text-sm uppercase mb-3">Other</h5>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <strong className="text-slate-900 text-sm">Client <span className="text-red-600">*</span></strong>
                          <p className="text-slate-900 font-medium mt-1 p-2 bg-slate-50 rounded">{viewItem.client || 'Not set'}</p>
                        </div>
                        <div>
                          <strong className="text-slate-900 text-sm">Status</strong>
                          <p className="text-slate-900 font-medium mt-1 p-2 bg-slate-50 rounded capitalize">{viewItem.status || 'active'}</p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  Object.entries(viewItem).filter(([k]) => k !== 'type').map(([key, value]: any) => (
                    <div key={key}>
                      <strong className="capitalize text-slate-500 text-sm">{key.replace(/_/g, ' ')}:</strong>
                      <p className="text-slate-900 mt-1">{String(value) || 'N/A'}</p>
                    </div>
                  ))
                )}
              </div>
              <div className="p-6 border-t border-slate-200 flex gap-3 justify-end sticky bottom-0 bg-slate-50">
                <button onClick={() => setShowViewModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium">Close</button>
              </div>
            </div>
          </div>
        )}



        {showAddModal && modalType === 'vehicle' && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
                <h3 className="text-xl font-bold text-slate-900">Add New Vehicle</h3>
                <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-slate-100 rounded">
                  <i className="ph-bold ph-x text-xl"></i>
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Vehicle Number <span className="text-red-600">*</span></label>
                  <input
                    type="text"
                    value={formData.vehicle_number || ''}
                    onChange={(e) => setFormData({...formData, vehicle_number: e.target.value})}
                    placeholder="e.g., MH01AB1234"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Vehicle Type <span className="text-red-600">*</span></label>
                  <select
                    value={formData.vehicle_type || ''}
                    onChange={(e) => setFormData({...formData, vehicle_type: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
                    required
                  >
                    <option value="">Select Vehicle Type</option>
                    <option value="EV Two Wheeler">EV Two Wheeler</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Model <span className="text-red-600">*</span></label>
                  <select
                    value={formData.model || ''}
                    onChange={(e) => setFormData({...formData, model: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
                    required
                  >
                    <option value="">Select Model</option>
                    <option value="E-Sprinto">E-Sprinto</option>
                    <option value="Quantum Bziness XS">Quantum Bziness XS</option>
                    <option value="Motovolt M7">Motovolt M7</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Year</label>
                  <input
                    type="number"
                    value={formData.year || ''}
                    onChange={(e) => setFormData({...formData, year: e.target.value ? parseInt(e.target.value) : null})}
                    placeholder="e.g., 2024"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Status</label>
                  <select
                    value={formData.status || 'available'}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
                  >
                    <option value="available">Available</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                
                <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium">Add Vehicle</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showAddModal && modalType === 'hub' && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
                <h3 className="text-xl font-bold text-slate-900">Add New Hub</h3>
                <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-slate-100 rounded">
                  <i className="ph-bold ph-x text-xl"></i>
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Search Location</label>
                  <LocationSearch
                    value={formData.location || ''}
                    onChange={(location, lat, lng, address) => {
                      // Extract city, state, pincode from formatted address
                      const parts = location.split(',').map((p: string) => p.trim());
                      let city = '', state = '', pincode = '';
                      
                      if (parts.length >= 2) {
                        city = parts[parts.length - 3] || '';
                        state = parts[parts.length - 2] || '';
                        pincode = parts[parts.length - 1]?.match(/\d{6}/) ? parts[parts.length - 1] : '';
                      }
                      
                      setFormData({
                        ...formData,
                        location,
                        latitude: lat,
                        longitude: lng,
                        city: city || formData.city,
                        state: state || formData.state,
                        pincode: pincode || formData.pincode
                      });
                    }}
                    placeholder="Search location (City, State, etc.)"
                  />
                </div>
                
                {formData.latitude && formData.longitude && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                    <strong>Location Selected:</strong> Lat: {formData.latitude.toFixed(4)}, Lng: {formData.longitude.toFixed(4)}
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Hub Name</label>
                  <input
                    type="text"
                    value={formData.hub_name || ''}
                    onChange={(e) => setFormData({...formData, hub_name: e.target.value})}
                    placeholder="e.g., Delhi Hub 1"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Hub Code</label>
                  <input
                    type="text"
                    value={formData.hub_code || ''}
                    onChange={(e) => setFormData({...formData, hub_code: e.target.value})}
                    placeholder="e.g., DLH001"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">City</label>
                    <input
                      type="text"
                      value={formData.city || ''}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                      placeholder="City"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">State</label>
                    <input
                      type="text"
                      value={formData.state || ''}
                      onChange={(e) => setFormData({...formData, state: e.target.value})}
                      placeholder="State"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Pincode</label>
                  <input
                    type="text"
                    value={formData.pincode || ''}
                    onChange={(e) => setFormData({...formData, pincode: e.target.value})}
                    placeholder="Pincode"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Manager Name</label>
                  <input
                    type="text"
                    value={formData.manager_name || ''}
                    onChange={(e) => setFormData({...formData, manager_name: e.target.value})}
                    placeholder="Manager full name"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Manager Contact Number</label>
                  <input
                    type="tel"
                    value={formData.manager_phone || ''}
                    onChange={(e) => setFormData({...formData, manager_phone: e.target.value})}
                    placeholder="10-digit phone number"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Status</label>
                  <select
                    value={formData.status || 'active'}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                
                <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium">Add Hub</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showEditModal && editItem && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">Edit {editItem.type === 'vehicle' && editItem.showAssignModal ? 'vehicle' : editItem.type}</h3>
                  <p className="text-xs text-slate-500 mt-1"><span className="text-red-600 font-bold">*</span> = Required fields</p>
                </div>
                <button onClick={() => setShowEditModal(false)} className="p-1 hover:bg-slate-100 rounded">
                  <i className="ph-bold ph-x text-2xl"></i>
                </button>
              </div>
              <form onSubmit={handleUpdateSubmit} className="p-6 space-y-4 max-h-[calc(90vh-120px)] overflow-y-auto">
                {editItem.type === 'rider' && (
                  <>
                    <h4 className="font-semibold text-slate-900 border-b pb-2 text-sm uppercase">Personal Information</h4>
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">Full Name <span className="text-red-600">*</span></label>
                      <input value={editItem.full_name || ''} onChange={(e) => setEditItem({...editItem, full_name: e.target.value})} placeholder="Full Name" className="w-full px-3 py-2 border border-slate-300 rounded-lg" required />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">Email <span className="text-red-600">*</span></label>
                      <input type="email" value={editItem.email || ''} onChange={(e) => setEditItem({...editItem, email: e.target.value})} placeholder="Email" className="w-full px-3 py-2 border border-slate-300 rounded-lg" required />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">Phone <span className="text-red-600">*</span></label>
                      <input type="tel" value={editItem.phone || ''} onChange={(e) => setEditItem({...editItem, phone: e.target.value})} placeholder="Phone" className="w-full px-3 py-2 border border-slate-300 rounded-lg" required />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">Date of Birth</label>
                      <input type="date" value={editItem.date_of_birth ? (typeof editItem.date_of_birth === 'string' ? editItem.date_of_birth.split('T')[0] : editItem.date_of_birth) : ''} onChange={(e) => setEditItem({...editItem, date_of_birth: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">Gender</label>
                      <select value={editItem.gender || ''} onChange={(e) => setEditItem({...editItem, gender: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">Joining Date</label>
                      <input type="date" value={editItem.join_date ? (typeof editItem.join_date === 'string' ? editItem.join_date.split('T')[0] : editItem.join_date) : ''} onChange={(e) => setEditItem({...editItem, join_date: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                    </div>

                    <h4 className="font-semibold text-slate-900 border-b pb-2 text-sm uppercase pt-2">Address Information</h4>
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">Address <span className="text-red-600">*</span></label>
                      <input value={editItem.address || ''} onChange={(e) => setEditItem({...editItem, address: e.target.value})} placeholder="Address" className="w-full px-3 py-2 border border-slate-300 rounded-lg" required />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-semibold text-slate-900 mb-2">City <span className="text-red-600">*</span></label>
                        <input value={editItem.city || ''} onChange={(e) => setEditItem({...editItem, city: e.target.value})} placeholder="City" className="w-full px-3 py-2 border border-slate-300 rounded-lg" required />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-900 mb-2">State <span className="text-red-600">*</span></label>
                        <input value={editItem.state || ''} onChange={(e) => setEditItem({...editItem, state: e.target.value})} placeholder="State" className="w-full px-3 py-2 border border-slate-300 rounded-lg" required />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">Pincode <span className="text-red-600">*</span></label>
                      <input value={editItem.pincode || ''} onChange={(e) => setEditItem({...editItem, pincode: e.target.value})} placeholder="Pincode" className="w-full px-3 py-2 border border-slate-300 rounded-lg" required />
                    </div>

                    <h4 className="font-semibold text-slate-900 border-b pb-2 text-sm uppercase pt-2">Emergency Contact</h4>
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">Emergency Contact Name <span className="text-red-600">*</span></label>
                      <input value={editItem.emergency_contact_name || ''} onChange={(e) => setEditItem({...editItem, emergency_contact_name: e.target.value})} placeholder="Emergency Contact Name" className="w-full px-3 py-2 border border-slate-300 rounded-lg" required />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">Emergency Contact Phone <span className="text-red-600">*</span></label>
                      <input type="tel" value={editItem.emergency_contact_phone || ''} onChange={(e) => setEditItem({...editItem, emergency_contact_phone: e.target.value})} placeholder="Emergency Contact Phone" className="w-full px-3 py-2 border border-slate-300 rounded-lg" required />
                    </div>

                    <h4 className="font-semibold text-slate-900 border-b pb-2 text-sm uppercase pt-2">Documents</h4>
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">Driving License Number <span className="text-red-600">*</span></label>
                      <input value={editItem.driving_license_number || ''} onChange={(e) => setEditItem({...editItem, driving_license_number: e.target.value})} placeholder="Driving License Number" className="w-full px-3 py-2 border border-slate-300 rounded-lg" required />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">DL Expiry Date <span className="text-red-600">*</span></label>
                      <input type="date" value={editItem.driving_license_expiry || ''} onChange={(e) => setEditItem({...editItem, driving_license_expiry: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" required />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">Aadhar Number <span className="text-red-600">*</span></label>
                      <input value={editItem.aadhar_number || ''} onChange={(e) => setEditItem({...editItem, aadhar_number: e.target.value})} placeholder="Aadhar Number" className="w-full px-3 py-2 border border-slate-300 rounded-lg" required />
                    </div>

                    <h4 className="font-semibold text-slate-900 border-b pb-2 text-sm uppercase pt-2">Bank Details</h4>
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">Bank Name <span className="text-red-600">*</span></label>
                      <input value={editItem.bank_name || ''} onChange={(e) => setEditItem({...editItem, bank_name: e.target.value})} placeholder="Bank Name" className="w-full px-3 py-2 border border-slate-300 rounded-lg" required />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">Account Number <span className="text-red-600">*</span></label>
                      <input value={editItem.account_number || ''} onChange={(e) => setEditItem({...editItem, account_number: e.target.value})} placeholder="Account Number" className="w-full px-3 py-2 border border-slate-300 rounded-lg" required />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">IFSC Code <span className="text-red-600">*</span></label>
                      <input value={editItem.ifsc_code || ''} onChange={(e) => setEditItem({...editItem, ifsc_code: e.target.value})} placeholder="IFSC Code" className="w-full px-3 py-2 border border-slate-300 rounded-lg" required />
                    </div>

                    <h4 className="font-semibold text-slate-900 border-b pb-2 text-sm uppercase pt-2">Assignment & Vehicle</h4>
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">Vehicle Ownership <span className="text-red-600">*</span></label>
                      <select value={editItem.vehicle_ownership || ''} onChange={(e) => setEditItem({...editItem, vehicle_ownership: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" required>
                        <option value="">Select Vehicle Ownership</option>
                        <option value="company_ev">Company EV</option>
                        <option value="personal">Personal</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">EV Type <span className="text-red-600">*</span></label>
                      <select value={editItem.ev_type || ''} onChange={(e) => setEditItem({...editItem, ev_type: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" required>
                        <option value="">Select EV Type</option>
                        <option value="sunmobility_swap">Sunmobility Swap (₹243/day)</option>
                        <option value="fixed_battery">Fixed Battery (₹215/day)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">Daily EV Rent (₹) <span className="text-red-600">*</span></label>
                      <input type="number" step="0.01" value={editItem.ev_daily_rent || ''} onChange={(e) => setEditItem({...editItem, ev_daily_rent: e.target.value ? parseFloat(e.target.value) : null})} placeholder="Daily Rent in ₹" className="w-full px-3 py-2 border border-slate-300 rounded-lg" required />
                    </div>
                    <label className="flex items-center gap-2 p-3 border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50">
                      <input type="checkbox" checked={editItem.is_leader || false} onChange={(e) => setEditItem({...editItem, is_leader: e.target.checked})} />
                      <span className="text-sm font-medium text-slate-900">Mark as Leader</span>
                    </label>
                    {editItem.is_leader && (
                      <div>
                        <label className="block text-sm font-semibold text-slate-900 mb-2">Leader Discount %</label>
                        <input type="number" step="0.1" value={editItem.leader_discount_percentage || ''} onChange={(e) => setEditItem({...editItem, leader_discount_percentage: e.target.value ? parseFloat(e.target.value) : 0})} placeholder="Leader Discount %" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                      </div>
                    )}

                    <h4 className="font-semibold text-slate-900 border-b pb-2 text-sm uppercase pt-2">Other</h4>
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">Client <span className="text-red-600">*</span></label>
                      <input value={editItem.client || ''} onChange={(e) => setEditItem({...editItem, client: e.target.value})} placeholder="Client" className="w-full px-3 py-2 border border-slate-300 rounded-lg" required />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">Status</label>
                      <select value={editItem.status || 'active'} onChange={(e) => setEditItem({...editItem, status: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </div>
                  </>
                )}
                {editItem.type === 'vehicle' && (
                  <>
                    {editItem.showAssignModal ? (
                      <>
                        <div className="p-4 bg-blue-100 border border-blue-300 rounded-xl mb-6">
                          <p className="text-sm font-bold text-blue-900">Vehicle: <span className="font-black">{editItem.vehicle_number}</span></p>
                          <p className="text-sm text-blue-900 mt-2">{editItem.vehicle_type}, {editItem.model}</p>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-900 mb-3">Choose a rider...</label>
                          {availableRiders.length === 0 ? (
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-sm">
                              <p className="font-semibold">No unassigned riders available</p>
                              <p className="text-xs mt-1">All riders currently have vehicles assigned, or no riders exist in the system.</p>
                            </div>
                          ) : (
                            <select
                              value={selectedRiderId}
                              onChange={(e) => setSelectedRiderId(e.target.value)}
                              className="w-full px-4 py-3 border-2 border-orange-400 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 text-base font-medium text-slate-900 bg-white hover:border-orange-500 transition-colors"
                              required
                            >
                              <option value="">Choose a rider...</option>
                              {availableRiders.map((rider: any) => (
                                <option key={rider.id} value={rider.cee_id || rider.user_id}>
                                  {rider.full_name} ({rider.cee_id || rider.user_id})
                                </option>
                              ))}
                            </select>
                          )}
                        </div>

                        <div className="flex gap-3 justify-end pt-6 border-t border-slate-300 mt-6">
                          <button
                            type="button"
                            onClick={() => {
                              setShowEditModal(false);
                              setEditItem(null);
                              setSelectedRiderId('');
                            }}
                            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold text-sm"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAssignRider(editItem.id, selectedRiderId)}
                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold text-sm flex items-center gap-2"
                          >
                            <i className="ph-bold ph-check text-lg"></i>
                            Assign Rider
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <label className="block text-sm font-semibold text-slate-900 mb-2">Vehicle Number <span className="text-red-600">*</span></label>
                          <input 
                            value={editItem.vehicle_number || ''} 
                            onChange={(e) => setEditItem({...editItem, vehicle_number: e.target.value})} 
                            placeholder="Vehicle Number" 
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-900 mb-2">Vehicle Type <span className="text-red-600">*</span></label>
                          <select 
                            value={editItem.vehicle_type || ''} 
                            onChange={(e) => setEditItem({...editItem, vehicle_type: e.target.value})} 
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
                            required
                          >
                            <option value="">Select Vehicle Type</option>
                            <option value="EV Two Wheeler">EV Two Wheeler</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-900 mb-2">Model <span className="text-red-600">*</span></label>
                          <select 
                            value={editItem.model || ''} 
                            onChange={(e) => setEditItem({...editItem, model: e.target.value})} 
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
                            required
                          >
                            <option value="">Select Model</option>
                            <option value="E-Sprinto">E-Sprinto</option>
                            <option value="Quantum Bziness XS">Quantum Bziness XS</option>
                            <option value="Motovolt M7">Motovolt M7</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-900 mb-2">Year</label>
                          <input 
                            type="number"
                            value={editItem.year || ''} 
                            onChange={(e) => setEditItem({...editItem, year: e.target.value ? parseInt(e.target.value) : null})} 
                            placeholder="Year" 
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-900 mb-2">Status</label>
                          <select 
                            value={editItem.status || 'available'} 
                            onChange={(e) => setEditItem({...editItem, status: e.target.value})} 
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
                          >
                            <option value="available">Available</option>
                            <option value="assigned">Assigned</option>
                            <option value="maintenance">Maintenance</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </div>

                        {editItem.assigned_rider_id && (
                          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-semibold text-amber-900">Assigned to Rider</p>
                                <p className="text-sm text-amber-800 mt-1">{editItem.assigned_rider_id}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setEditItem({...editItem, assigned_rider_id: null, status: 'available'})}
                                className="px-3 py-1.5 bg-amber-600 text-white text-sm font-medium rounded hover:bg-amber-700 transition-all flex items-center gap-2"
                              >
                                <i className="ph ph-trash text-sm"></i>
                                Unassign
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="flex gap-3 justify-end pt-6 border-t border-slate-300 mt-6">
                          <button type="button" onClick={() => setShowEditModal(false)} className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold text-sm">Cancel</button>
                          <button type="submit" className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-semibold text-sm">Save</button>
                        </div>
                      </>
                    )}
                  </>
                )}
                {editItem.type === 'hub' && (
                  <>
                    <input value={editItem.hub_name || ''} onChange={(e) => setEditItem({...editItem, hub_name: e.target.value})} placeholder="Hub Name" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                    <input value={editItem.hub_code || ''} onChange={(e) => setEditItem({...editItem, hub_code: e.target.value})} placeholder="Hub Code" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                    <LocationSearch
                      value={editItem.location || ''}
                      onChange={(location, lat, lng) => {
                        const parts = location.split(',').map((p: string) => p.trim());
                        let city = '', state = '', pincode = '';
                        if (parts.length >= 2) {
                          city = parts[parts.length - 3] || '';
                          state = parts[parts.length - 2] || '';
                          pincode = parts[parts.length - 1]?.match(/\d{6}/) ? parts[parts.length - 1] : '';
                        }
                        setEditItem({...editItem, location, latitude: lat, longitude: lng, city: city || editItem.city, state: state || editItem.state, pincode: pincode || editItem.pincode});
                      }}
                      placeholder="Update location"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <input value={editItem.city || ''} onChange={(e) => setEditItem({...editItem, city: e.target.value})} placeholder="City" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                      <input value={editItem.state || ''} onChange={(e) => setEditItem({...editItem, state: e.target.value})} placeholder="State" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                    </div>
                    <input value={editItem.pincode || ''} onChange={(e) => setEditItem({...editItem, pincode: e.target.value})} placeholder="Pincode" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                    <input value={editItem.manager_name || ''} onChange={(e) => setEditItem({...editItem, manager_name: e.target.value})} placeholder="Manager Name" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                    <input value={editItem.manager_phone || ''} onChange={(e) => setEditItem({...editItem, manager_phone: e.target.value})} placeholder="Manager Phone" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                    <select value={editItem.status || 'active'} onChange={(e) => setEditItem({...editItem, status: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                    {editItem.latitude !== null && editItem.latitude !== undefined && editItem.longitude !== null && editItem.longitude !== undefined && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                        <strong>Location:</strong> Lat: {typeof editItem.latitude === 'number' ? editItem.latitude.toFixed(4) : parseFloat(editItem.latitude).toFixed(4)}, Lng: {typeof editItem.longitude === 'number' ? editItem.longitude.toFixed(4) : parseFloat(editItem.longitude).toFixed(4)}
                      </div>
                    )}
                  </>
                )}
                {editItem.type === 'store' && (
                  <>
                    <input value={editItem.store_name || ''} onChange={(e) => setEditItem({...editItem, store_name: e.target.value})} placeholder="Store Name" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                    <LocationSearch
                      value={editItem.location || ''}
                      onChange={(location, lat, lng) => setEditItem({...editItem, location, latitude: lat, longitude: lng})}
                      placeholder="Update store location"
                    />
                    {editItem.latitude !== null && editItem.latitude !== undefined && editItem.longitude !== null && editItem.longitude !== undefined && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                        <strong>Location:</strong> Lat: {typeof editItem.latitude === 'number' ? editItem.latitude.toFixed(4) : parseFloat(editItem.latitude).toFixed(4)}, Lng: {typeof editItem.longitude === 'number' ? editItem.longitude.toFixed(4) : parseFloat(editItem.longitude).toFixed(4)}
                      </div>
                    )}
                  </>
                )}
                <div className="flex gap-3 justify-end pt-4 border-t border-slate-200 sticky bottom-0 bg-white">
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
