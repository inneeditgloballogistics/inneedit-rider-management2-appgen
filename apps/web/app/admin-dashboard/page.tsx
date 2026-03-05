'use client';

import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
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
  const { user, signOut } = useAuth();
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
  
  // Dashboard counts
  const [ridersCount, setRidersCount] = useState(0);
  const [vehiclesCount, setVehiclesCount] = useState(0);
  const [hubsCount, setHubsCount] = useState(0);
  const [storesCount, setStoresCount] = useState(0);

  // Payroll state
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

  // Notifications and advances
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [advances, setAdvances] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [pendingAdvancesCount, setPendingAdvancesCount] = useState(0);
  const [pendingReferralsCount, setPendingReferralsCount] = useState(0);

  // Role-based access control - redirect if not admin
  useEffect(() => {
    if (user && user.role && user.role !== 'admin') {
      router.push('/login');
    }
  }, [user, router]);

  useEffect(() => {
    // Fetch counts for dashboard
    fetchCounts();
    fetchNotifications();
    
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
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
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
      console.error('Error fetching counts:', error instanceof Error ? error.message : String(error));
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

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error instanceof Error ? error.message : String(error));
    }
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

  const fetchPayrollData = () => {
    fetchPayoutHistory();
    fetchRiders();
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

  const calculatePayout = async (riderId: string, ordersCount: number, basePayout: number) => {
    try {
      const res = await fetch(`/api/payroll?action=calculate&riderId=${riderId}&ordersCount=${ordersCount}&basePayout=${basePayout}&weekNumber=${weekNumber}&month=${month}&year=${year}`);
      const data = await res.json();
      return data;
    } catch (error) {
      console.error('Error calculating payout:', error);
      return null;
    }
  };

  const handleAddManualEntry = () => {
    setManualEntries([
      ...manualEntries,
      { id: Date.now(), riderId: '', ordersCount: 0, basePayout: 0, calculated: null }
    ]);
  };

  const handleRemoveManualEntry = (id: number) => {
    setManualEntries(manualEntries.filter(entry => entry.id !== id));
  };

  const handleCalculateEntry = async (entryId: number) => {
    const entry = manualEntries.find(e => e.id === entryId);
    if (!entry || !entry.riderId || entry.ordersCount <= 0 || entry.basePayout <= 0) {
      alert('Please fill all fields before calculating');
      return;
    }

    const calculated = await calculatePayout(entry.riderId, entry.ordersCount, entry.basePayout);
    if (calculated) {
      setManualEntries(manualEntries.map(e => 
        e.id === entryId ? { ...e, calculated } : e
      ));
    }
  };

  const handleProcessPayouts = async () => {
    const entriesToProcess = manualEntries.filter(e => e.calculated);
    if (entriesToProcess.length === 0) {
      alert('Please calculate at least one entry before processing');
      return;
    }

    if (!confirm(`Process ${entriesToProcess.length} payout(s)?`)) return;

    try {
      const payouts = entriesToProcess.map(entry => ({
        riderId: entry.riderId,
        weekNumber,
        weekPeriod,
        month,
        year,
        ordersCount: entry.ordersCount,
        basePayout: entry.basePayout,
        totalIncentives: entry.calculated.incentives,
        totalDeductions: entry.calculated.evRent + entry.calculated.deductions + entry.calculated.advances,
        netPayout: entry.calculated.netPayout,
      }));

      await fetch('/api/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'bulk_create', data: { payouts } })
      });

      alert('Payouts created successfully!');
      setManualEntries([]);
      fetchPayoutHistory();
    } catch (error) {
      console.error('Error processing payouts:', error);
      alert('Failed to process payouts');
    }
  };

  const handleApprovePayout = async (id: number) => {
    if (!confirm('Approve this payout?')) return;
    try {
      await fetch('/api/payroll', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', data: { id } })
      });
      fetchPayoutHistory();
    } catch (error) {
      console.error('Error approving payout:', error);
    }
  };

  const handleMarkPaid = async (id: number) => {
    if (!confirm('Mark this payout as paid? This will clear associated advances.')) return;
    try {
      await fetch('/api/payroll', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_paid', data: { id } })
      });
      fetchPayoutHistory();
      alert('Payout marked as paid and advances cleared!');
    } catch (error) {
      console.error('Error marking payout as paid:', error);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedRiders.size === 0) {
      alert('Please select payouts to approve');
      return;
    }
    if (!confirm(`Approve ${selectedRiders.size} payout(s)?`)) return;
    
    try {
      await fetch('/api/payroll', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'bulk_approve', data: { ids: Array.from(selectedRiders) } })
      });
      setSelectedRiders(new Set());
      fetchPayoutHistory();
      alert('Payouts approved successfully!');
    } catch (error) {
      console.error('Error bulk approving:', error);
    }
  };

  const handleBulkMarkPaid = async () => {
    if (selectedRiders.size === 0) {
      alert('Please select payouts to mark as paid');
      return;
    }
    if (!confirm(`Mark ${selectedRiders.size} payout(s) as paid?`)) return;
    
    try {
      await fetch('/api/payroll', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'bulk_mark_paid', data: { ids: Array.from(selectedRiders) } })
      });
      setSelectedRiders(new Set());
      fetchPayoutHistory();
      alert('Payouts marked as paid!');
    } catch (error) {
      console.error('Error bulk marking paid:', error);
    }
  };

  const markNotificationAsRead = async (id: number) => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isRead: true })
    });
    fetchNotifications();
  };

  const markAllAsRead = async () => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isRead: true })
    });
    fetchNotifications();
  };

  const handleAdvanceAction = async (id: number, status: string, notes: string = '') => {
    try {
      await fetch('/api/advances', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id, 
          status, 
          processedBy: user?.email || 'admin',
          adminNotes: notes 
        })
      });
      fetchAdvances();
      fetchNotifications();
      fetchCounts(); // Update the pending advances count
      alert(`Advance request ${status}!`);
    } catch (error) {
      console.error('Error updating advance:', error);
      alert('Failed to update advance request');
    }
  };

  const handleAddNew = async (type: 'vehicle' | 'hub' | 'store') => {
    setModalType(type);
    setFormData({});
    
    // If adding a vehicle, fetch all hubs for the dropdown
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
    
    // If editing a vehicle, fetch all hubs for the dropdown
    if (type === 'vehicle') {
      const res = await fetch('/api/hubs');
      const data = await res.json();
      setHubsForVehicle(data);
    }
    
    // If editing a rider, fetch hubs, stores, and vehicles for dropdowns
    if (type === 'rider') {
      const [hubsRes, storesRes, vehiclesRes] = await Promise.all([
        fetch('/api/hubs'),
        fetch('/api/stores'),
        fetch('/api/vehicles?status=available')
      ]);
      const hubsData = await hubsRes.json();
      const storesData = await storesRes.json();
      const vehiclesData = await vehiclesRes.json();
      
      setHubsForRider(hubsData);
      setStoresForRider(storesData);
      setVehiclesForRider(vehiclesData);
    }
    
    setShowEditModal(true);
  };

  const handleDelete = async (id: number, type: string) => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;
    
    try {
      // Refresh data first to get latest assignments
      if (type === 'hub') {
        await fetchRiders(); // Get latest rider assignments
        await fetchVehicles(); // Get latest vehicle assignments
      }
      
      const endpoint = `/api/${type}s?id=${id}`;
      const response = await fetch(endpoint, { method: 'DELETE' });
      const data = await response.json();
      
      if (!response.ok) {
        // Show error message from server
        alert(data.error || `Failed to delete ${type}`);
        return;
      }
      
      // Success - show message and refresh data
      alert(data.message || `${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`);
      
      if (type === 'rider') {
        fetchRiders();
        fetchCounts();
      }
      if (type === 'vehicle') {
        fetchVehicles();
        fetchCounts();
      }
      if (type === 'hub') {
        fetchHubs();
        fetchCounts();
      }
      if (type === 'store') {
        fetchStores();
        fetchCounts();
      }
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
    if (type === 'rider') {
      fetchRiders();
      fetchHubs(); // Refresh hubs to update assignment counts
    }
    if (type === 'vehicle') {
      fetchVehicles();
      fetchHubs(); // Refresh hubs to update assignment counts
    }
    if (type === 'hub') fetchHubs();
    if (type === 'store') fetchStores();
  };

    return (
      <>
        <GoogleMapsLoader>
        <div className="mesh-bg text-slate-800 antialiased min-h-screen">
          {/* Top Header */}
          <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200">
            <div className="px-6 py-3 flex items-center justify-between">
              {/* Brand */}
              <div className="flex items-center gap-3">
                <div className="h-10">
                  <img src="https://app-cdn.appgen.com/c8d1da7a-8da9-4a1f-8aaa-2cb65f828731/assets/uploaded_1772434426357_uwdii.png" alt="inneedit" className="h-full w-auto" />
                </div>
                <div>
                  <h1 className="font-display font-bold text-sm leading-none text-slate-900">inneedit</h1>
                  <span className="text-xs font-medium text-slate-500">Admin Portal</span>
                </div>
              </div>

              {/* Right Side - Notifications & User */}
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
                >
                  <i className="ph ph-bell text-xl"></i>
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border border-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-700 to-slate-900 flex items-center justify-center text-white text-sm font-bold">
                    {user?.name?.charAt(0) || 'A'}
                  </div>
                  <div className="hidden md:block">
                    <p className="text-sm font-semibold text-slate-900">{user?.name || 'Admin User'}</p>
                    <p className="text-xs text-slate-500">{user?.email || 'admin@inneedit.com'}</p>
                  </div>
                  <button
                    onClick={() => signOut()}
                    className="px-4 py-2 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                  >
                    <i className="ph-bold ph-sign-out"></i>
                    Sign Out
                  </button>
                </div>
              </div>
            </div>

            {/* Horizontal Navigation Tabs */}
            <nav className="border-t border-slate-200 overflow-x-auto">
              <div className="flex px-6">
                <button 
                  onClick={() => setActiveTab('dashboard')} 
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all border-b-2 ${
                    activeTab === 'dashboard' 
                      ? 'border-brand-600 text-brand-600 bg-brand-50/30' 
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <i className="ph-bold ph-gauge text-lg"></i>
                  <span>Dashboard</span>
                </button>
                
                <button 
                  onClick={() => setActiveTab('riders')} 
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all border-b-2 ${
                    activeTab === 'riders' 
                      ? 'border-brand-600 text-brand-600 bg-brand-50/30' 
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <i className="ph-bold ph-users text-lg"></i>
                  <span>Riders</span>
                </button>
                
                <button 
                  onClick={() => setActiveTab('vehicles')} 
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all border-b-2 ${
                    activeTab === 'vehicles' 
                      ? 'border-brand-600 text-brand-600 bg-brand-50/30' 
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <i className="ph-bold ph-truck text-lg"></i>
                  <span>Vehicles</span>
                </button>
                
                <button 
                  onClick={() => setActiveTab('hubs')} 
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all border-b-2 ${
                    activeTab === 'hubs' 
                      ? 'border-brand-600 text-brand-600 bg-brand-50/30' 
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <i className="ph-bold ph-buildings text-lg"></i>
                  <span>Hubs</span>
                </button>
                
                <button 
                  onClick={() => setActiveTab('stores')} 
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all border-b-2 ${
                    activeTab === 'stores' 
                      ? 'border-brand-600 text-brand-600 bg-brand-50/30' 
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <i className="ph-bold ph-storefront text-lg"></i>
                  <span>Stores</span>
                </button>
                
                <button 
                  onClick={() => setActiveTab('advances')} 
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all border-b-2 relative ${
                    activeTab === 'advances' 
                      ? 'border-brand-600 text-brand-600 bg-brand-50/30' 
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <i className="ph-bold ph-currency-dollar text-lg"></i>
                  <span>Advances</span>
                  {pendingAdvancesCount > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                      {pendingAdvancesCount}
                    </span>
                  )}
                </button>
                
                <button 
                  onClick={() => setActiveTab('referrals')} 
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all border-b-2 relative ${
                    activeTab === 'referrals' 
                      ? 'border-brand-600 text-brand-600 bg-brand-50/30' 
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <i className="ph-bold ph-user-plus text-lg"></i>
                  <span>Referrals</span>
                  {pendingReferralsCount > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-purple-500 text-white text-xs font-bold rounded-full">
                      {pendingReferralsCount}
                    </span>
                  )}
                </button>
                
                <button 
                  onClick={() => setActiveTab('payroll')} 
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all border-b-2 ${
                    activeTab === 'payroll' 
                      ? 'border-brand-600 text-brand-600 bg-brand-50/30' 
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <i className="ph-bold ph-wallet text-lg"></i>
                  <span>Payroll</span>
                </button>
              </div>
            </nav>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="fixed top-16 right-6 w-96 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 max-h-96 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={markAllAsRead} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                      Mark all as read
                    </button>
                  )}
                </div>
                <div className="overflow-y-auto flex-1">
                  {notifications.length > 0 ? (
                    notifications.map((notif) => (
                      <div 
                        key={notif.id} 
                        className={`p-4 border-b border-slate-100 hover:bg-slate-50 cursor-pointer ${!notif.is_read ? 'bg-blue-50' : ''}`}
                        onClick={() => {
                          markNotificationAsRead(notif.id);
                          if (notif.type === 'advance') setActiveTab('advances');
                          if (notif.type === 'referral') setActiveTab('referrals');
                          setShowNotifications(false);
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            notif.type === 'advance' ? 'bg-orange-100' : 'bg-purple-100'
                          }`}>
                            <i className={`ph-bold ${notif.type === 'advance' ? 'ph-currency-dollar text-orange-600' : 'ph-user-plus text-purple-600'} text-sm`}></i>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm text-slate-900">{notif.title}</p>
                            <p className="text-xs text-slate-600 mt-1">{notif.message}</p>
                            <p className="text-xs text-slate-400 mt-1">
                              {new Date(notif.created_at).toLocaleString()}
                            </p>
                          </div>
                          {!notif.is_read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-slate-500">
                      <i className="ph-duotone ph-bell-slash text-4xl mb-2"></i>
                      <p className="text-sm">No notifications</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </header>

    {/* Main Content */}
    <main className="pt-[140px] pb-12 px-8">
        <div className="max-w-7xl mx-auto space-y-8">
            
            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && (
              <>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6">
                  <div>
                    <h2 className="font-display text-3xl font-bold text-slate-900 mb-2">Admin Dashboard</h2>
                    <p className="text-slate-600">Overview of fleet operations and key metrics</p>
                  </div>
                </div>

                {/* Top Level Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                        <div className="absolute right-0 top-0 w-24 h-24 bg-brand-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3">
                                <i className="ph-duotone ph-moped text-2xl text-brand-600"></i>
                                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Riders</h3>
                            </div>
                            <p className="text-4xl font-bold text-slate-900 tracking-tight mb-3">{ridersCount}</p>
                            <div className="flex items-center gap-2 text-xs font-medium">
                                <span className="text-green-600 bg-green-50 px-2.5 py-1 rounded-md">Total Registered</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                        <div className="absolute right-0 top-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3">
                                <i className="ph-duotone ph-scooter text-2xl text-blue-600"></i>
                                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Fleet Vehicles</h3>
                            </div>
                            <p className="text-4xl font-bold text-slate-900 tracking-tight mb-3">{vehiclesCount}</p>
                            <div className="flex items-center gap-2 text-xs font-medium">
                                <span className="text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">Fleet Size</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                        <div className="absolute right-0 top-0 w-24 h-24 bg-purple-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3">
                                <i className="ph-duotone ph-buildings text-2xl text-purple-600"></i>
                                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Active Hubs</h3>
                            </div>
                            <p className="text-4xl font-bold text-slate-900 tracking-tight mb-3">{hubsCount}</p>
                            <div className="flex items-center gap-2 text-xs font-medium">
                                <span className="text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">Total Hubs</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                        <div className="absolute right-0 top-0 w-24 h-24 bg-green-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3">
                                <i className="ph-duotone ph-storefront text-2xl text-green-600"></i>
                                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Client Stores</h3>
                            </div>
                            <p className="text-4xl font-bold text-slate-900 tracking-tight mb-3">{storesCount}</p>
                            <div className="flex items-center gap-2 text-xs font-medium">
                                <span className="text-green-600 bg-green-50 px-2.5 py-1 rounded-md">Client Locations</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="font-display font-semibold text-xl text-slate-900 mb-6">Quick Actions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <button onClick={() => setActiveTab('riders')} className="flex items-center gap-4 p-5 rounded-lg border border-slate-200 bg-gradient-to-br from-white to-slate-50 hover:from-white hover:to-white hover:border-brand-300 hover:shadow-md transition-all group">
                            <div className="w-12 h-12 rounded-lg bg-brand-100 text-brand-600 flex items-center justify-center group-hover:bg-brand-600 group-hover:text-white transition-colors">
                                <i className="ph-bold ph-user-plus text-xl"></i>
                            </div>
                            <div className="text-left">
                                <span className="block font-bold text-sm text-slate-900 mb-0.5">Manage Riders</span>
                                <span className="text-xs text-slate-500">View & Register</span>
                            </div>
                        </button>

                        <button onClick={() => setActiveTab('vehicles')} className="flex items-center gap-4 p-5 rounded-lg border border-slate-200 bg-gradient-to-br from-white to-slate-50 hover:from-white hover:to-white hover:border-blue-300 hover:shadow-md transition-all group">
                            <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <i className="ph-bold ph-scooter text-xl"></i>
                            </div>
                            <div className="text-left">
                                <span className="block font-bold text-sm text-slate-900 mb-0.5">Fleet Management</span>
                                <span className="text-xs text-slate-500">Track Vehicles</span>
                            </div>
                        </button>

                        <button onClick={() => setActiveTab('hubs')} className="flex items-center gap-4 p-5 rounded-lg border border-slate-200 bg-gradient-to-br from-white to-slate-50 hover:from-white hover:to-white hover:border-purple-300 hover:shadow-md transition-all group">
                            <div className="w-12 h-12 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                <i className="ph-bold ph-buildings text-xl"></i>
                            </div>
                            <div className="text-left">
                                <span className="block font-bold text-sm text-slate-900 mb-0.5">Hub Management</span>
                                <span className="text-xs text-slate-500">Manage Locations</span>
                            </div>
                        </button>

                        <button onClick={() => setActiveTab('stores')} className="flex items-center gap-4 p-5 rounded-lg border border-slate-200 bg-gradient-to-br from-white to-slate-50 hover:from-white hover:to-white hover:border-green-300 hover:shadow-md transition-all group">
                            <div className="w-12 h-12 rounded-lg bg-green-100 text-green-600 flex items-center justify-center group-hover:bg-green-600 group-hover:text-white transition-colors">
                                <i className="ph-bold ph-storefront text-xl"></i>
                            </div>
                            <div className="text-left">
                                <span className="block font-bold text-sm text-slate-900 mb-0.5">Store Management</span>
                                <span className="text-xs text-slate-500">Client Locations</span>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Full-Width Map Section */}
                <DashboardMapView />
              </>
            )}

            {/* Riders Tab */}
            {activeTab === 'riders' && (
              <>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-200/60">
                  <div>
                    <h2 className="font-display text-3xl font-bold text-slate-900">Rider Management</h2>
                    <p className="text-slate-500 mt-2">View and register new riders</p>
                  </div>
                  <button onClick={() => router.push('/rider-registration')} className="px-4 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-all flex items-center gap-2">
                    <i className="ph-bold ph-plus"></i> Register New Rider
                  </button>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  {riders.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="text-xs text-slate-400 uppercase tracking-wider bg-slate-50/50">
                            <th className="px-6 py-4 font-medium">CEE ID</th>
                            <th className="px-6 py-4 font-medium">Name</th>
                            <th className="px-6 py-4 font-medium">Phone</th>
                            <th className="px-6 py-4 font-medium">Client</th>
                            <th className="px-6 py-4 font-medium">Hub</th>
                            <th className="px-6 py-4 font-medium">Status</th>
                            <th className="px-6 py-4 font-medium">Registered</th>
                            <th className="px-6 py-4 font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                          {riders.map((rider) => (
                            <tr key={rider.id} className="group hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4 font-mono font-bold text-brand-600">{rider.cee_id}</td>
                              <td className="px-6 py-4 font-semibold text-slate-900">{rider.full_name}</td>
                              <td className="px-6 py-4 text-slate-600">{rider.phone}</td>
                              <td className="px-6 py-4 text-slate-600 capitalize">{rider.client}</td>
                              <td className="px-6 py-4 text-slate-600">{rider.hub_name || '-'}</td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  rider.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                                }`}>
                                  {rider.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-slate-600">
                                {rider.created_at ? new Date(rider.created_at).toLocaleDateString() : '-'}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <button onClick={() => handleView(rider, 'rider')} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="View">
                                    <i className="ph-bold ph-eye text-lg"></i>
                                  </button>
                                  <button onClick={() => handleEdit(rider, 'rider')} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded transition-colors" title="Edit">
                                    <i className="ph-bold ph-pencil-simple text-lg"></i>
                                  </button>
                                  <button onClick={() => handleDelete(rider.id, 'rider')} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete">
                                    <i className="ph-bold ph-trash text-lg"></i>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-12 text-center">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="ph-duotone ph-user-plus text-3xl text-slate-400"></i>
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">No Riders Yet</h3>
                      <p className="text-slate-500 mb-6">Click "Register New Rider" to add your first rider.</p>
                      <button onClick={() => router.push('/rider-registration')} className="px-4 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-all inline-flex items-center gap-2">
                        <i className="ph-bold ph-plus"></i> Register New Rider
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Vehicles Tab */}
            {activeTab === 'vehicles' && (
              <>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-200/60">
                  <div>
                    <h2 className="font-display text-3xl font-bold text-slate-900">Vehicle Management</h2>
                    <p className="text-slate-500 mt-2">Manage fleet vehicles and assignments</p>
                  </div>
                  <button onClick={() => handleAddNew('vehicle')} className="px-4 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-all flex items-center gap-2">
                    <i className="ph-bold ph-plus"></i> Add Vehicle
                  </button>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-xs text-slate-400 uppercase tracking-wider bg-slate-50/50">
                          <th className="px-6 py-4 font-medium">Vehicle Number</th>
                          <th className="px-6 py-4 font-medium">Type</th>
                          <th className="px-6 py-4 font-medium">Model</th>
                          <th className="px-6 py-4 font-medium">Year</th>
                          <th className="px-6 py-4 font-medium">Hub</th>
                          <th className="px-6 py-4 font-medium">Status</th>
                          <th className="px-6 py-4 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {vehicles.map((vehicle) => (
                          <tr key={vehicle.id} className="group hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 font-mono font-bold text-slate-900">{vehicle.vehicle_number}</td>
                            <td className="px-6 py-4 text-slate-600">{vehicle.vehicle_type}</td>
                            <td className="px-6 py-4 text-slate-600">{vehicle.model || '-'}</td>
                            <td className="px-6 py-4 text-slate-600">{vehicle.year || '-'}</td>
                            <td className="px-6 py-4 text-slate-600">{vehicle.hub_name || (vehicle.hub_id ? `Hub #${vehicle.hub_id}` : '-')}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                vehicle.status === 'available' ? 'bg-green-100 text-green-800' :
                                vehicle.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                                'bg-amber-100 text-amber-800'
                              }`}>
                                {vehicle.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <button onClick={() => handleView(vehicle, 'vehicle')} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="View">
                                  <i className="ph-bold ph-eye text-lg"></i>
                                </button>
                                <button onClick={() => handleEdit(vehicle, 'vehicle')} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded transition-colors" title="Edit">
                                  <i className="ph-bold ph-pencil-simple text-lg"></i>
                                </button>
                                <button onClick={() => handleDelete(vehicle.id, 'vehicle')} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete">
                                  <i className="ph-bold ph-trash text-lg"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* Hubs Tab */}
            {activeTab === 'hubs' && (
              <>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-200/60">
                  <div>
                    <h2 className="font-display text-3xl font-bold text-slate-900">Hub Management</h2>
                    <p className="text-slate-500 mt-2">Manage operational hubs and locations</p>
                  </div>
                  <button onClick={() => handleAddNew('hub')} className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-all flex items-center gap-2">
                    <i className="ph-bold ph-plus"></i> Add Hub
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {hubs.map((hub) => (
                    <div key={hub.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group relative">
                      <div className="flex justify-between items-start mb-3">
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                          <i className="ph-duotone ph-buildings text-2xl text-purple-600"></i>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          hub.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {hub.status}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-1">{hub.hub_name}</h3>
                      <p className="text-sm text-slate-500 mb-3">{hub.hub_code}</p>
                      <div className="space-y-2 text-sm mb-4">
                        <div className="flex items-start gap-2">
                          <i className="ph ph-map-pin text-slate-400 mt-0.5"></i>
                          <span className="text-slate-600">{hub.location}, {hub.city}</span>
                        </div>
                        {hub.manager_name && (
                          <div className="flex items-start gap-2">
                            <i className="ph ph-user text-slate-400 mt-0.5"></i>
                            <span className="text-slate-600">{hub.manager_name}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                        <button onClick={() => handleView(hub, 'hub')} className="flex-1 p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors text-center text-sm font-medium">
                          <i className="ph-bold ph-eye mr-1"></i>View
                        </button>
                        <button onClick={() => handleEdit(hub, 'hub')} className="flex-1 p-2 text-amber-600 hover:bg-amber-50 rounded transition-colors text-center text-sm font-medium">
                          <i className="ph-bold ph-pencil-simple mr-1"></i>Edit
                        </button>
                        <button onClick={() => handleDelete(hub.id, 'hub')} className="flex-1 p-2 text-red-600 hover:bg-red-50 rounded transition-colors text-center text-sm font-medium">
                          <i className="ph-bold ph-trash mr-1"></i>Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Advances Tab */}
            {activeTab === 'advances' && (
              <>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-200/60">
                  <div>
                    <h2 className="font-display text-3xl font-bold text-slate-900">Advance Requests</h2>
                    <p className="text-slate-500 mt-2">Review and approve rider advance requests</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {advances.length > 0 ? (
                    advances.map((advance) => (
                      <div key={advance.id} className={`bg-white p-6 rounded-2xl border ${
                        advance.status === 'pending' ? 'border-orange-200 bg-orange-50/30' : 'border-slate-200'
                      } shadow-sm`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                advance.status === 'approved' ? 'bg-green-100 text-green-700' :
                                advance.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                'bg-orange-100 text-orange-700'
                              }`}>
                                {(advance.status || 'pending').toUpperCase()}
                              </span>
                              <span className="text-2xl font-bold text-slate-900">₹{parseFloat(advance.amount).toFixed(2)}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-3">
                              <div>
                                <p className="text-xs text-slate-500">Rider Name</p>
                                <p className="font-semibold text-slate-900">{advance.rider_name}</p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500">CEE ID</p>
                                <p className="font-mono font-semibold text-indigo-600">{advance.cee_id}</p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500">Store Location</p>
                                <p className="font-medium text-slate-900">{advance.store_location}</p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500">Requested</p>
                                <p className="text-sm text-slate-600">
                                  {new Date(advance.requested_at).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-lg mb-3">
                              <p className="text-xs text-slate-500 mb-1">Reason</p>
                              <p className="text-sm text-slate-900">{advance.reason}</p>
                            </div>
                            {advance.admin_notes && (
                              <div className="bg-blue-50 p-3 rounded-lg">
                                <p className="text-xs text-blue-600 mb-1">Admin Notes</p>
                                <p className="text-sm text-slate-900">{advance.admin_notes}</p>
                              </div>
                            )}
                          </div>
                          {advance.status === 'pending' && (
                            <div className="flex flex-col gap-2 ml-4">
                              <button
                                onClick={() => {
                                  const notes = prompt('Add notes (optional):');
                                  handleAdvanceAction(advance.id, 'approved', notes || '');
                                }}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-all flex items-center gap-2"
                              >
                                <i className="ph-bold ph-check"></i> Approve
                              </button>
                              <button
                                onClick={() => {
                                  const notes = prompt('Reason for rejection:');
                                  if (notes) handleAdvanceAction(advance.id, 'rejected', notes);
                                }}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all flex items-center gap-2"
                              >
                                <i className="ph-bold ph-x"></i> Reject
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="ph-duotone ph-currency-dollar text-3xl text-slate-400"></i>
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">No Advance Requests</h3>
                      <p className="text-slate-500">All advance requests will appear here</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Referrals Tab */}
            {activeTab === 'referrals' && (
              <>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-200/60">
                  <div>
                    <h2 className="font-display text-3xl font-bold text-slate-900">Rider Referrals</h2>
                    <p className="text-slate-500 mt-2">Manage rider referrals and onboard new riders</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-xs text-slate-400 uppercase tracking-wider bg-slate-50/50">
                          <th className="px-6 py-4 font-medium">Referred By</th>
                          <th className="px-6 py-4 font-medium">CEE ID</th>
                          <th className="px-6 py-4 font-medium">Referred Name</th>
                          <th className="px-6 py-4 font-medium">Phone</th>
                          <th className="px-6 py-4 font-medium">Preferred Location</th>
                          <th className="px-6 py-4 font-medium">Status</th>
                          <th className="px-6 py-4 font-medium">Date</th>
                          <th className="px-6 py-4 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {referrals.map((referral) => (
                          <tr key={referral.id} className="group hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 font-semibold text-slate-900">{referral.referrer_name}</td>
                            <td className="px-6 py-4 font-mono font-bold text-indigo-600">{referral.referrer_cee_id}</td>
                            <td className="px-6 py-4 font-semibold text-slate-900">{referral.referred_name}</td>
                            <td className="px-6 py-4 text-slate-600">{referral.referred_phone}</td>
                            <td className="px-6 py-4 text-slate-600">{referral.preferred_location}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                referral.status === 'registered' ? 'bg-green-100 text-green-700' :
                                referral.status === 'called' ? 'bg-blue-100 text-blue-700' :
                                referral.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {referral.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-600">
                              {new Date(referral.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                {referral.status === 'pending' && (
                                  <>
                                    <button
                                      onClick={async () => {
                                        await fetch('/api/referrals', {
                                          method: 'PATCH',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ id: referral.id, status: 'called' })
                                        });
                                        fetchReferrals();
                                      }}
                                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                      title="Mark as Called"
                                    >
                                      <i className="ph-bold ph-phone text-lg"></i>
                                    </button>
                                    <button
                                      onClick={() => router.push('/rider-registration')}
                                      className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                                      title="Create Rider ID"
                                    >
                                      <i className="ph-bold ph-user-plus text-lg"></i>
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {referrals.length === 0 && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="ph-duotone ph-user-plus text-3xl text-slate-400"></i>
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">No Referrals Yet</h3>
                      <p className="text-slate-500">Rider referrals will appear here</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Payroll Tab */}
            {activeTab === 'payroll' && (
              <>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-200/60">
                  <div>
                    <h2 className="font-display text-3xl font-bold text-slate-900">Payroll Management</h2>
                    <p className="text-slate-500 mt-2">Process rider payouts and manage salary disbursements</p>
                  </div>
                </div>

                {/* Payroll Mode Selector */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <button
                      onClick={() => setPayrollMode('manual')}
                      className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                        payrollMode === 'manual'
                          ? 'border-brand-500 bg-brand-50 text-brand-700'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <i className="ph-duotone ph-keyboard text-3xl"></i>
                        <div className="text-left">
                          <h3 className="font-bold text-lg">Manual Entry</h3>
                          <p className="text-sm text-slate-500">Enter payout data manually</p>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => setPayrollMode('ai')}
                      className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                        payrollMode === 'ai'
                          ? 'border-brand-500 bg-brand-50 text-brand-700'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <i className="ph-duotone ph-magic-wand text-3xl"></i>
                        <div className="text-left">
                          <h3 className="font-bold text-lg">AI Invoice Upload</h3>
                          <p className="text-sm text-slate-500">Upload & auto-extract data</p>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => setPayrollMode('history')}
                      className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                        payrollMode === 'history'
                          ? 'border-brand-500 bg-brand-50 text-brand-700'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <i className="ph-duotone ph-clock-clockwise text-3xl"></i>
                        <div className="text-left">
                          <h3 className="font-bold text-lg">Payout History</h3>
                          <p className="text-sm text-slate-500">View past payouts</p>
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* Week/Month Selector */}
                  <div className="grid grid-cols-4 gap-4 pt-4 border-t border-slate-200">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Week Number</label>
                      <input
                        type="number"
                        min="1"
                        max="52"
                        value={weekNumber}
                        onChange={(e) => setWeekNumber(parseInt(e.target.value))}
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Week Period</label>
                      <input
                        type="text"
                        placeholder="e.g., 1-7 Jan"
                        value={weekPeriod}
                        onChange={(e) => setWeekPeriod(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Month</label>
                      <select
                        value={month}
                        onChange={(e) => setMonth(parseInt(e.target.value))}
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none"
                      >
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {new Date(2024, i, 1).toLocaleString('default', { month: 'long' })}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Year</label>
                      <input
                        type="number"
                        value={year}
                        onChange={(e) => setYear(parseInt(e.target.value))}
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Manual Entry Mode */}
                {payrollMode === 'manual' && (
                  <div className="space-y-4">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-lg text-slate-900">Manual Payout Entries</h3>
                        <button
                          onClick={handleAddManualEntry}
                          className="px-4 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-all flex items-center gap-2"
                        >
                          <i className="ph-bold ph-plus"></i> Add Entry
                        </button>
                      </div>

                      {manualEntries.length === 0 ? (
                        <div className="text-center py-12">
                          <i className="ph-duotone ph-plus-circle text-5xl text-slate-300 mb-3"></i>
                          <p className="text-slate-500">Click "Add Entry" to start adding payout data</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {manualEntries.map((entry) => (
                            <div key={entry.id} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                              <div className="grid grid-cols-12 gap-4 items-start">
                                <div className="col-span-3">
                                  <label className="block text-xs font-medium text-slate-600 mb-1">Rider (CEE ID)</label>
                                  <select
                                    value={entry.riderId}
                                    onChange={(e) => {
                                      setManualEntries(manualEntries.map(e =>
                                        e.id === entry.id ? { ...e, riderId: e.target.value, calculated: null } : e
                                      ));
                                    }}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                                  >
                                    <option value="">Select Rider</option>
                                    {riders.map(rider => (
                                      <option key={rider.cee_id} value={rider.cee_id}>
                                        {rider.cee_id} - {rider.full_name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div className="col-span-2">
                                  <label className="block text-xs font-medium text-slate-600 mb-1">Orders Count</label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={entry.ordersCount}
                                    onChange={(e) => {
                                      setManualEntries(manualEntries.map(ent =>
                                        ent.id === entry.id ? { ...ent, ordersCount: parseInt(e.target.value) || 0, calculated: null } : ent
                                      ));
                                    }}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                                  />
                                </div>
                                <div className="col-span-2">
                                  <label className="block text-xs font-medium text-slate-600 mb-1">Base Payout (₹)</label>
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={entry.basePayout}
                                    onChange={(e) => {
                                      setManualEntries(manualEntries.map(ent =>
                                        ent.id === entry.id ? { ...ent, basePayout: parseFloat(e.target.value) || 0, calculated: null } : ent
                                      ));
                                    }}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                                  />
                                </div>
                                <div className="col-span-4">
                                  {entry.calculated ? (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                                      <p className="text-xs text-green-600 font-medium mb-1">Net Payout</p>
                                      <p className="text-lg font-bold text-green-800">₹{entry.calculated.netPayout.toFixed(2)}</p>
                                      <p className="text-xs text-green-600 mt-1">
                                        Base: ₹{entry.calculated.basePayout} | Inc: +₹{entry.calculated.incentives} | 
                                        Ded: -₹{(entry.calculated.evRent + entry.calculated.deductions + entry.calculated.advances).toFixed(2)}
                                      </p>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => handleCalculateEntry(entry.id)}
                                      className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-all mt-5"
                                    >
                                      Calculate
                                    </button>
                                  )}
                                </div>
                                <div className="col-span-1 flex justify-end mt-5">
                                  <button
                                    onClick={() => handleRemoveManualEntry(entry.id)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                  >
                                    <i className="ph-bold ph-trash text-lg"></i>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}

                          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                            <button
                              onClick={() => setManualEntries([])}
                              className="px-6 py-3 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition-all"
                            >
                              Clear All
                            </button>
                            <button
                              onClick={handleProcessPayouts}
                              className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-all flex items-center gap-2"
                            >
                              <i className="ph-bold ph-check-circle"></i>
                              Process {manualEntries.filter(e => e.calculated).length} Payout(s)
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* AI Upload Mode */}
                {payrollMode === 'ai' && (
                  <InvoiceUpload onImportComplete={fetchPayrollData} />
                )}

                {/* Payout History Mode */}
                {payrollMode === 'history' && (
                  <div className="space-y-4">
                    {selectedRiders.size > 0 && (
                      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-700">
                          {selectedRiders.size} payout(s) selected
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={handleBulkApprove}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-all"
                          >
                            Approve Selected
                          </button>
                          <button
                            onClick={handleBulkMarkPaid}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-all"
                          >
                            Mark as Paid
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                      {payoutHistory.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="text-xs text-slate-400 uppercase tracking-wider bg-slate-50/50">
                                <th className="px-4 py-4">
                                  <input
                                    type="checkbox"
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedRiders(new Set(payoutHistory.map(p => p.id)));
                                      } else {
                                        setSelectedRiders(new Set());
                                      }
                                    }}
                                    className="rounded"
                                  />
                                </th>
                                <th className="px-6 py-4 font-medium">CEE ID</th>
                                <th className="px-6 py-4 font-medium">Rider Name</th>
                                <th className="px-6 py-4 font-medium">Week</th>
                                <th className="px-6 py-4 font-medium">Orders</th>
                                <th className="px-6 py-4 font-medium">Base Payout</th>
                                <th className="px-6 py-4 font-medium">Net Payout</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                              {payoutHistory.map((payout) => (
                                <tr key={payout.id} className="hover:bg-slate-50 transition-colors">
                                  <td className="px-4 py-4">
                                    <input
                                      type="checkbox"
                                      checked={selectedRiders.has(payout.id)}
                                      onChange={(e) => {
                                        const newSelected = new Set(selectedRiders);
                                        if (e.target.checked) {
                                          newSelected.add(payout.id);
                                        } else {
                                          newSelected.delete(payout.id);
                                        }
                                        setSelectedRiders(newSelected);
                                      }}
                                      className="rounded"
                                    />
                                  </td>
                                  <td className="px-6 py-4 font-mono font-bold text-brand-600">{payout.rider_id}</td>
                                  <td className="px-6 py-4 font-semibold text-slate-900">{payout.full_name}</td>
                                  <td className="px-6 py-4 text-slate-600">{payout.week_period || `Week ${payout.week_number}`}</td>
                                  <td className="px-6 py-4 text-slate-600">{payout.orders_count}</td>
                                  <td className="px-6 py-4 font-medium text-slate-900">₹{parseFloat(payout.base_payout).toFixed(2)}</td>
                                  <td className="px-6 py-4 font-bold text-green-700">₹{parseFloat(payout.net_payout).toFixed(2)}</td>
                                  <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                      payout.status === 'paid' ? 'bg-green-100 text-green-700' :
                                      payout.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                                      'bg-yellow-100 text-yellow-700'
                                    }`}>
                                      {payout.status}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                      {payout.status === 'pending' && (
                                        <button
                                          onClick={() => handleApprovePayout(payout.id)}
                                          className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                                          title="Approve"
                                        >
                                          <i className="ph-bold ph-check-circle text-lg"></i>
                                        </button>
                                      )}
                                      {payout.status === 'approved' && (
                                        <button
                                          onClick={() => handleMarkPaid(payout.id)}
                                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                          title="Mark as Paid"
                                        >
                                          <i className="ph-bold ph-credit-card text-lg"></i>
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <i className="ph-duotone ph-clock-clockwise text-5xl text-slate-300 mb-3"></i>
                          <p className="text-slate-500">No payout history yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-200/60">
                  <div>
                    <h2 className="font-display text-3xl font-bold text-slate-900">System Settings</h2>
                    <p className="text-slate-500 mt-2">Configure EV bike rent and leader discounts</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
                  <div className="max-w-3xl">
                    <div className="space-y-6">
                      <div className="p-6 bg-brand-50 border border-brand-200 rounded-xl">
                        <h3 className="font-bold text-lg text-brand-900 mb-4 flex items-center gap-2">
                          <i className="ph-duotone ph-lightning text-2xl"></i>
                          EV Bike Rental Configuration
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-brand-700 mb-2">Monthly EV Rent (₹)</label>
                            <input
                              type="number"
                              value={settings.ev_monthly_rent || 0}
                              onChange={(e) => setSettings({ ...settings, ev_monthly_rent: e.target.value })}
                              className="w-full px-4 py-3 rounded-lg border border-brand-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none"
                            />
                            <p className="text-xs text-brand-600 mt-1">Default monthly EV rental for all riders</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-brand-700 mb-2">Weekly EV Rent (₹)</label>
                            <input
                              type="number"
                              value={settings.ev_weekly_rent || 0}
                              onChange={(e) => setSettings({ ...settings, ev_weekly_rent: e.target.value })}
                              className="w-full px-4 py-3 rounded-lg border border-brand-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none"
                            />
                            <p className="text-xs text-brand-600 mt-1">Default weekly EV rental for all riders</p>
                          </div>
                        </div>
                      </div>

                      <div className="p-6 bg-purple-50 border border-purple-200 rounded-xl">
                        <h3 className="font-bold text-lg text-purple-900 mb-2 flex items-center gap-2">
                          <i className="ph-duotone ph-crown text-2xl"></i>
                          Leader/Supervisor Discount
                        </h3>
                        <p className="text-sm text-purple-700 mb-4">
                          Leaders get rent discounts instead of separate salaries. They work as riders while supervising others.
                        </p>
                        <div>
                          <label className="block text-sm font-medium text-purple-700 mb-2">Default Leader Discount (%)</label>
                          <input
                            type="number"
                            value={settings.leader_discount || 0}
                            onChange={(e) => setSettings({ ...settings, leader_discount: e.target.value })}
                            className="w-full px-4 py-3 rounded-lg border border-purple-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
                          />
                          <p className="text-xs text-purple-600 mt-1">Percentage discount on EV rent for leaders</p>
                        </div>
                      </div>

                      <button
                        onClick={async () => {
                          try {
                            await fetch('/api/settings', {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                ev_monthly_rent: parseFloat(settings.ev_monthly_rent || 0),
                                ev_weekly_rent: parseFloat(settings.ev_weekly_rent || 0),
                                leader_discount: parseFloat(settings.leader_discount || 0),
                              })
                            });
                            alert('Settings saved successfully!');
                            fetchSettings();
                          } catch (error) {
                            console.error('Error saving settings:', error);
                            alert('Failed to save settings');
                          }
                        }}
                        className="w-full px-6 py-4 bg-brand-600 text-white rounded-xl font-bold text-lg hover:bg-brand-700 transition-all flex items-center justify-center gap-2"
                      >
                        <i className="ph-bold ph-floppy-disk text-xl"></i>
                        Save Settings
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Stores Tab */}
            {activeTab === 'stores' && (
              <>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-200/60">
                  <div>
                    <h2 className="font-display text-3xl font-bold text-slate-900">Store Management</h2>
                    <p className="text-slate-500 mt-2">Manage client stores and delivery locations</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setShowMapView(!showMapView)} 
                      className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                        showMapView 
                          ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <i className={`ph-bold ${showMapView ? 'ph-list' : 'ph-map-trifold'}`}></i> 
                      {showMapView ? 'Show List' : 'Map View'}
                    </button>
                    <button onClick={() => handleAddNew('store')} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all flex items-center gap-2">
                      <i className="ph-bold ph-plus"></i> Add Store
                    </button>
                  </div>
                </div>

                {showMapView ? (
                  <StoreMapView />
                ) : (
                  <>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-xs text-slate-400 uppercase tracking-wider bg-slate-50/50">
                          <th className="px-6 py-4 font-medium">Store Name</th>
                          <th className="px-6 py-4 font-medium">Code</th>
                          <th className="px-6 py-4 font-medium">Client</th>
                          <th className="px-6 py-4 font-medium">Location</th>
                          <th className="px-6 py-4 font-medium">Manager Name</th>
                          <th className="px-6 py-4 font-medium">Manager Contact</th>
                          <th className="px-6 py-4 font-medium">Status</th>
                          <th className="px-6 py-4 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {stores.map((store) => (
                          <tr key={store.id} className="group hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 font-semibold text-slate-900">{store.store_name}</td>
                            <td className="px-6 py-4 font-mono text-slate-600">{store.store_code}</td>
                            <td className="px-6 py-4 text-slate-600">{store.client}</td>
                            <td className="px-6 py-4 text-slate-600">{store.city}, {store.state}</td>
                            <td className="px-6 py-4 text-slate-600">{store.store_manager_name || '-'}</td>
                            <td className="px-6 py-4 text-slate-600">{store.store_manager_phone || '-'}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                store.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {store.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <button onClick={() => handleView(store, 'store')} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="View">
                                  <i className="ph-bold ph-eye text-lg"></i>
                                </button>
                                <button onClick={() => handleEdit(store, 'store')} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded transition-colors" title="Edit">
                                  <i className="ph-bold ph-pencil-simple text-lg"></i>
                                </button>
                                <button onClick={() => handleDelete(store.id, 'store')} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete">
                                  <i className="ph-bold ph-trash text-lg"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                  </>
                )}

              </>
            )}



            {/* View Modal */}
            {showViewModal && viewItem && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6" onClick={() => setShowViewModal(false)}>
                <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                  <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="text-2xl font-bold text-slate-900 capitalize">{viewItem.type} Details</h3>
                    <button onClick={() => setShowViewModal(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                      <i className="ph-bold ph-x text-xl text-slate-400"></i>
                    </button>
                  </div>
                  <div className="p-6 space-y-4">
                    {viewItem.type === 'rider' && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div><span className="text-sm text-slate-500">CEE ID:</span><p className="font-semibold text-slate-900">{viewItem.cee_id}</p></div>
                          <div><span className="text-sm text-slate-500">Full Name:</span><p className="font-semibold text-slate-900">{viewItem.full_name}</p></div>
                          <div><span className="text-sm text-slate-500">Phone:</span><p className="font-semibold text-slate-900">{viewItem.phone}</p></div>
                          <div><span className="text-sm text-slate-500">Email:</span><p className="font-semibold text-slate-900">{viewItem.email || '-'}</p></div>
                          <div><span className="text-sm text-slate-500">Client:</span><p className="font-semibold text-slate-900 capitalize">{viewItem.client}</p></div>
                          <div><span className="text-sm text-slate-500">Status:</span><p className="font-semibold text-slate-900 capitalize">{viewItem.status}</p></div>
                          <div className="col-span-2"><span className="text-sm text-slate-500">Address:</span><p className="font-semibold text-slate-900">{viewItem.address || '-'}</p></div>
                        </div>
                      </>
                    )}
                    {viewItem.type === 'vehicle' && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div><span className="text-sm text-slate-500">Vehicle Number:</span><p className="font-semibold text-slate-900">{viewItem.vehicle_number}</p></div>
                          <div><span className="text-sm text-slate-500">Type:</span><p className="font-semibold text-slate-900">{viewItem.vehicle_type}</p></div>
                          <div><span className="text-sm text-slate-500">Model:</span><p className="font-semibold text-slate-900">{viewItem.model || '-'}</p></div>
                          <div><span className="text-sm text-slate-500">Year:</span><p className="font-semibold text-slate-900">{viewItem.year || '-'}</p></div>
                          <div><span className="text-sm text-slate-500">Hub:</span><p className="font-semibold text-slate-900">{viewItem.hub_name || '-'}</p></div>
                          <div><span className="text-sm text-slate-500">Status:</span><p className="font-semibold text-slate-900 capitalize">{viewItem.status}</p></div>
                        </div>
                      </>
                    )}
                    {viewItem.type === 'hub' && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div><span className="text-sm text-slate-500">Hub Name:</span><p className="font-semibold text-slate-900">{viewItem.hub_name}</p></div>
                          <div><span className="text-sm text-slate-500">Hub Code:</span><p className="font-semibold text-slate-900">{viewItem.hub_code}</p></div>
                          <div className="col-span-2"><span className="text-sm text-slate-500">Location:</span><p className="font-semibold text-slate-900">{viewItem.location}</p></div>
                          <div><span className="text-sm text-slate-500">City:</span><p className="font-semibold text-slate-900">{viewItem.city}</p></div>
                          <div><span className="text-sm text-slate-500">State:</span><p className="font-semibold text-slate-900">{viewItem.state}</p></div>
                          <div><span className="text-sm text-slate-500">Manager:</span><p className="font-semibold text-slate-900">{viewItem.manager_name || '-'}</p></div>
                          <div><span className="text-sm text-slate-500">Manager Phone:</span><p className="font-semibold text-slate-900">{viewItem.manager_phone || '-'}</p></div>
                        </div>
                      </>
                    )}
                    {viewItem.type === 'store' && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div><span className="text-sm text-slate-500">Store Name:</span><p className="font-semibold text-slate-900">{viewItem.store_name}</p></div>
                          <div><span className="text-sm text-slate-500">Store Code:</span><p className="font-semibold text-slate-900">{viewItem.store_code}</p></div>
                          <div><span className="text-sm text-slate-500">Client:</span><p className="font-semibold text-slate-900">{viewItem.client}</p></div>
                          <div><span className="text-sm text-slate-500">Status:</span><p className="font-semibold text-slate-900 capitalize">{viewItem.status}</p></div>
                          <div className="col-span-2"><span className="text-sm text-slate-500">Location:</span><p className="font-semibold text-slate-900">{viewItem.location}</p></div>
                          <div><span className="text-sm text-slate-500">City:</span><p className="font-semibold text-slate-900">{viewItem.city}</p></div>
                          <div><span className="text-sm text-slate-500">State:</span><p className="font-semibold text-slate-900">{viewItem.state}</p></div>
                          <div><span className="text-sm text-slate-500">Contact Person:</span><p className="font-semibold text-slate-900">{viewItem.contact_person || '-'}</p></div>
                          <div><span className="text-sm text-slate-500">Contact Phone:</span><p className="font-semibold text-slate-900">{viewItem.contact_phone || '-'}</p></div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Edit Modal */}
            {showEditModal && editItem && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6" onClick={() => setShowEditModal(false)}>
                <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                  <div className="p-6 border-b border-slate-200">
                    <h3 className="text-2xl font-bold text-slate-900 capitalize">Edit {editItem.type}</h3>
                  </div>
                  <form onSubmit={handleUpdateSubmit} className="p-6 space-y-4">
                    {editItem.type === 'rider' && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">CEE ID*</label>
                            <input 
                              type="text" 
                              required 
                              value={editItem.cee_id || ''} 
                              className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-slate-50 font-mono text-slate-500" 
                              disabled
                            />
                            <p className="text-xs text-slate-500 mt-1">CEE ID cannot be changed</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Full Name*</label>
                            <input 
                              type="text" 
                              required 
                              value={editItem.full_name || ''} 
                              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none" 
                              onChange={(e) => setEditItem({...editItem, full_name: e.target.value})} 
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Phone*</label>
                            <input 
                              type="tel" 
                              required 
                              value={editItem.phone || ''} 
                              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none" 
                              onChange={(e) => setEditItem({...editItem, phone: e.target.value})} 
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                            <input 
                              type="email" 
                              value={editItem.email || ''} 
                              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none" 
                              onChange={(e) => setEditItem({...editItem, email: e.target.value})} 
                            />
                          </div>
                        </div>

                        <div className="bg-brand-50 border border-brand-200 rounded-lg p-4">
                          <h4 className="font-semibold text-brand-900 mb-3 flex items-center gap-2">
                            <i className="ph-duotone ph-buildings text-lg"></i>
                            Assignment Details
                          </h4>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-brand-700 mb-2">Client*</label>
                              <select 
                                required
                                value={editItem.client || ''} 
                                className="w-full px-4 py-2 rounded-lg border border-brand-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none" 
                                onChange={(e) => setEditItem({...editItem, client: e.target.value})}
                              >
                                <option value="">Select client</option>
                                <option value="BigBasket">BigBasket</option>
                                <option value="Zepto">Zepto</option>
                                <option value="Blinkit">Blinkit</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-brand-700 mb-2">Store*</label>
                              <select 
                                required
                                value={editItem.store_id || ''} 
                                className="w-full px-4 py-2 rounded-lg border border-brand-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none" 
                                onChange={(e) => setEditItem({...editItem, store_id: e.target.value ? parseInt(e.target.value) : null})}
                              >
                                <option value="">Select store</option>
                                {storesForRider.map((store) => (
                                  <option key={store.id} value={store.id}>
                                    {store.store_name} - {store.client} ({store.city})
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="mt-4">
                            <label className="block text-sm font-medium text-brand-700 mb-2">Hub*</label>
                            <select 
                              required
                              value={editItem.assigned_hub_id || ''} 
                              className="w-full px-4 py-2 rounded-lg border border-brand-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none" 
                              onChange={(e) => setEditItem({...editItem, assigned_hub_id: e.target.value ? parseInt(e.target.value) : null})}
                            >
                              <option value="">Select hub</option>
                              {hubsForRider.map((hub) => (
                                <option key={hub.id} value={hub.id}>
                                  {hub.hub_name} - {hub.hub_code} ({hub.city})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                          <h4 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                            <i className="ph-duotone ph-scooter text-lg"></i>
                            Vehicle Assignment
                          </h4>
                          
                          <div>
                            <label className="block text-sm font-medium text-purple-700 mb-2">Assigned Vehicle</label>
                            <select 
                              value={editItem.assigned_vehicle_id || ''} 
                              className="w-full px-4 py-2 rounded-lg border border-purple-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none" 
                              onChange={(e) => setEditItem({...editItem, assigned_vehicle_id: e.target.value ? parseInt(e.target.value) : null})}
                            >
                              <option value="">No vehicle assigned</option>
                              {vehiclesForRider.map((vehicle) => (
                                <option key={vehicle.id} value={vehicle.id}>
                                  {vehicle.vehicle_number} - {vehicle.vehicle_type} ({vehicle.status})
                                </option>
                              ))}
                            </select>
                            <p className="text-xs text-purple-600 mt-1">Only available vehicles are shown</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                            <select 
                              value={editItem.status || 'active'} 
                              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none" 
                              onChange={(e) => setEditItem({...editItem, status: e.target.value})}
                            >
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                              <option value="suspended">Suspended</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Vehicle Ownership</label>
                            <select 
                              value={editItem.vehicle_ownership || 'company'} 
                              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none" 
                              onChange={(e) => setEditItem({...editItem, vehicle_ownership: e.target.value})}
                            >
                              <option value="company">Company EV</option>
                              <option value="own">Own Vehicle</option>
                            </select>
                          </div>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <input 
                              type="checkbox" 
                              id="is_leader"
                              checked={editItem.is_leader || false}
                              onChange={(e) => setEditItem({...editItem, is_leader: e.target.checked})}
                              className="w-4 h-4 text-amber-600 rounded"
                            />
                            <label htmlFor="is_leader" className="text-sm font-semibold text-amber-900">
                              <i className="ph-duotone ph-crown mr-1"></i>
                              Mark as Leader/Supervisor
                            </label>
                          </div>
                          <p className="text-xs text-amber-700 ml-6">Leaders get rent discounts and supervise other riders</p>
                        </div>
                      </>
                    )}
                    {editItem.type === 'vehicle' && (
                      <>
                        <div><label className="block text-sm font-medium text-slate-700 mb-2">Vehicle Number*</label>
                        <input type="text" required value={editItem.vehicle_number || ''} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none" onChange={(e) => setEditItem({...editItem, vehicle_number: e.target.value})} /></div>
                        <div><label className="block text-sm font-medium text-slate-700 mb-2">Type*</label>
                        <input type="text" required value={editItem.vehicle_type || ''} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none" onChange={(e) => setEditItem({...editItem, vehicle_type: e.target.value})} /></div>
                        <div><label className="block text-sm font-medium text-slate-700 mb-2">Model</label>
                        <input type="text" value={editItem.model || ''} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none" onChange={(e) => setEditItem({...editItem, model: e.target.value})} /></div>
                        <div><label className="block text-sm font-medium text-slate-700 mb-2">Year</label>
                        <input type="number" value={editItem.year || ''} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none" onChange={(e) => setEditItem({...editItem, year: e.target.value})} /></div>
                        <div><label className="block text-sm font-medium text-slate-700 mb-2">Assign to Hub</label>
                        <select value={editItem.hub_id || ''} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none" onChange={(e) => setEditItem({...editItem, hub_id: e.target.value ? parseInt(e.target.value) : null})}>
                          <option value="">No Hub</option>
                          {hubsForVehicle.map((hub) => (
                            <option key={hub.id} value={hub.id}>
                              {hub.hub_name} - {hub.hub_code} ({hub.city})
                            </option>
                          ))}
                        </select></div>
                        <div><label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                        <select value={editItem.status || 'available'} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none" onChange={(e) => setEditItem({...editItem, status: e.target.value})}>
                          <option value="available">Available</option>
                          <option value="assigned">Assigned</option>
                          <option value="maintenance">Maintenance</option>
                        </select></div>
                      </>
                    )}
                    {editItem.type === 'hub' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            <i className="ph-bold ph-magnifying-glass mr-1"></i>
                            Update Location (Google Maps)
                          </label>
                          <GooglePlacesAutocomplete
                            onPlaceSelected={(details) => {
                              setEditItem({
                                ...editItem,
                                hub_name: details.storeName || editItem.hub_name,
                                location: details.fullAddress,
                                city: details.city,
                                state: details.state,
                                pincode: details.pincode,
                                latitude: details.latitude,
                                longitude: details.longitude,
                              });
                            }}
                            placeholder="Search to update location..."
                          />
                        </div>

                        <div><label className="block text-sm font-medium text-slate-700 mb-2">Hub Name*</label>
                        <input type="text" required value={editItem.hub_name || ''} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none" onChange={(e) => setEditItem({...editItem, hub_name: e.target.value})} /></div>
                        <div><label className="block text-sm font-medium text-slate-700 mb-2">Full Address*</label>
                        <input type="text" required value={editItem.location || ''} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none" onChange={(e) => setEditItem({...editItem, location: e.target.value})} /></div>
                        <div className="grid grid-cols-3 gap-4">
                          <div><label className="block text-sm font-medium text-slate-700 mb-2">City</label>
                          <input type="text" value={editItem.city || ''} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none" onChange={(e) => setEditItem({...editItem, city: e.target.value})} /></div>
                          <div><label className="block text-sm font-medium text-slate-700 mb-2">State</label>
                          <input type="text" value={editItem.state || ''} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none" onChange={(e) => setEditItem({...editItem, state: e.target.value})} /></div>
                          <div><label className="block text-sm font-medium text-slate-700 mb-2">Pincode</label>
                          <input type="text" value={editItem.pincode || ''} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none" onChange={(e) => setEditItem({...editItem, pincode: e.target.value})} /></div>
                        </div>
                        <div><label className="block text-sm font-medium text-slate-700 mb-2">Manager Name</label>
                        <input type="text" value={editItem.manager_name || ''} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none" onChange={(e) => setEditItem({...editItem, manager_name: e.target.value})} /></div>
                        {editItem.latitude && editItem.longitude && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-sm text-green-800">
                              <i className="ph-bold ph-map-pin text-lg text-green-600"></i>
                              <span className="font-medium">Coordinates:</span>
                              <span className="font-mono text-xs">{parseFloat(editItem.latitude).toFixed(6)}, {parseFloat(editItem.longitude).toFixed(6)}</span>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                    {editItem.type === 'store' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            <i className="ph-bold ph-magnifying-glass mr-1"></i>
                            Update Location (Google Maps)
                          </label>
                          <GooglePlacesAutocomplete
                            onPlaceSelected={(details) => {
                              setEditItem({
                                ...editItem,
                                store_name: details.storeName || editItem.store_name,
                                location: details.fullAddress,
                                city: details.city,
                                state: details.state,
                                pincode: details.pincode,
                                latitude: details.latitude,
                                longitude: details.longitude,
                              });
                            }}
                            placeholder="Search to update location..."
                          />
                        </div>

                        <div><label className="block text-sm font-medium text-slate-700 mb-2">Store Name*</label>
                        <input type="text" required value={editItem.store_name || ''} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" onChange={(e) => setEditItem({...editItem, store_name: e.target.value})} /></div>
                        <div><label className="block text-sm font-medium text-slate-700 mb-2">Client</label>
                        <select value={editItem.client || ''} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" onChange={(e) => setEditItem({...editItem, client: e.target.value})}>
                          <option value="">Select client</option>
                          <option value="BigBasket">BigBasket</option>
                          <option value="Zepto">Zepto</option>
                          <option value="Blinkit">Blinkit</option>
                        </select></div>
                        <div><label className="block text-sm font-medium text-slate-700 mb-2">Full Address*</label>
                        <input type="text" required value={editItem.location || ''} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" onChange={(e) => setEditItem({...editItem, location: e.target.value})} /></div>
                        <div className="grid grid-cols-3 gap-4">
                          <div><label className="block text-sm font-medium text-slate-700 mb-2">City</label>
                          <input type="text" value={editItem.city || ''} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" onChange={(e) => setEditItem({...editItem, city: e.target.value})} /></div>
                          <div><label className="block text-sm font-medium text-slate-700 mb-2">State</label>
                          <input type="text" value={editItem.state || ''} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" onChange={(e) => setEditItem({...editItem, state: e.target.value})} /></div>
                          <div><label className="block text-sm font-medium text-slate-700 mb-2">Pincode</label>
                          <input type="text" value={editItem.pincode || ''} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" onChange={(e) => setEditItem({...editItem, pincode: e.target.value})} /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div><label className="block text-sm font-medium text-slate-700 mb-2">Store Manager Name</label>
                          <input type="text" value={editItem.store_manager_name || ''} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" onChange={(e) => setEditItem({...editItem, store_manager_name: e.target.value})} /></div>
                          <div><label className="block text-sm font-medium text-slate-700 mb-2">Store Manager Phone</label>
                          <input type="tel" value={editItem.store_manager_phone || ''} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" onChange={(e) => setEditItem({...editItem, store_manager_phone: e.target.value})} /></div>
                        </div>

                        {editItem.latitude && editItem.longitude && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-sm text-green-800">
                              <i className="ph-bold ph-map-pin text-lg text-green-600"></i>
                              <span className="font-medium">Coordinates:</span>
                              <span className="font-mono text-xs">{parseFloat(editItem.latitude).toFixed(6)}, {parseFloat(editItem.longitude).toFixed(6)}</span>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                    <div className="flex gap-3 pt-4">
                      <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 px-4 py-3 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition-all">Cancel</button>
                      <button type="submit" className="flex-1 px-4 py-3 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-all">Update</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Add Modal */}
            {showAddModal && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6" onClick={() => setShowAddModal(false)}>
                <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                  <div className="p-6 border-b border-slate-200">
                    <h3 className="text-2xl font-bold text-slate-900">Add New {modalType === 'vehicle' ? 'Vehicle' : modalType === 'hub' ? 'Hub' : 'Store'}</h3>
                  </div>
                  <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {modalType === 'vehicle' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Vehicle Number*</label>
                          <input type="text" required className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none" onChange={(e) => setFormData({...formData, vehicle_number: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Vehicle Type*</label>
                          <select required className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none" onChange={(e) => setFormData({...formData, vehicle_type: e.target.value})}>
                            <option value="">Select type</option>
                            <option value="Electric Scooter">Electric Scooter</option>
                            <option value="Petrol Scooter">Petrol Scooter</option>
                            <option value="Motorcycle">Motorcycle</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Model</label>
                            <input type="text" className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none" onChange={(e) => setFormData({...formData, model: e.target.value})} />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Year</label>
                            <input type="number" className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none" onChange={(e) => setFormData({...formData, year: e.target.value})} />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Assign to Hub</label>
                          <select className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none" onChange={(e) => setFormData({...formData, hub_id: e.target.value ? parseInt(e.target.value) : null})}>
                            <option value="">Select hub (optional)</option>
                            {hubsForVehicle.map((hub) => (
                              <option key={hub.id} value={hub.id}>
                                {hub.hub_name} - {hub.hub_code} ({hub.city})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                          <select className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none" onChange={(e) => setFormData({...formData, status: e.target.value})}>
                            <option value="available">Available</option>
                            <option value="assigned">Assigned</option>
                            <option value="maintenance">Maintenance</option>
                          </select>
                        </div>
                      </>
                    )}

                    {modalType === 'hub' && (
                      <>
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                          <div className="flex items-start gap-3">
                            <i className="ph-duotone ph-info text-2xl text-purple-600 mt-0.5"></i>
                            <div>
                              <h4 className="font-semibold text-purple-900 mb-1">Search with Google Maps</h4>
                              <p className="text-sm text-purple-700">Search and select a location to auto-fill hub details including coordinates</p>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            <i className="ph-bold ph-magnifying-glass mr-1"></i>
                            Search Location (Google Maps)
                          </label>
                          <GooglePlacesAutocomplete
                            onPlaceSelected={(details) => {
                              setFormData({
                                ...formData,
                                hub_name: details.storeName || formData.hub_name,
                                location: details.fullAddress,
                                city: details.city,
                                state: details.state,
                                pincode: details.pincode,
                                latitude: details.latitude,
                                longitude: details.longitude,
                              });
                            }}
                            placeholder="Search for hub location..."
                          />
                        </div>

                        <div className="border-t border-slate-200 pt-4">
                          <p className="text-xs text-slate-500 mb-3 uppercase font-semibold tracking-wide">Hub Details</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Hub Name*</label>
                          <input 
                            type="text" 
                            required 
                            value={formData.hub_name || ''} 
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none" 
                            onChange={(e) => setFormData({...formData, hub_name: e.target.value})} 
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Hub Code*</label>
                          <input type="text" required className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none" onChange={(e) => setFormData({...formData, hub_code: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Full Address*</label>
                          <input 
                            type="text" 
                            required 
                            value={formData.location || ''} 
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none" 
                            onChange={(e) => setFormData({...formData, location: e.target.value})} 
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">City</label>
                            <input 
                              type="text" 
                              value={formData.city || ''} 
                              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none" 
                              onChange={(e) => setFormData({...formData, city: e.target.value})} 
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">State</label>
                            <input 
                              type="text" 
                              value={formData.state || ''} 
                              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none" 
                              onChange={(e) => setFormData({...formData, state: e.target.value})} 
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Pincode</label>
                            <input 
                              type="text" 
                              value={formData.pincode || ''} 
                              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none" 
                              onChange={(e) => setFormData({...formData, pincode: e.target.value})} 
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Manager Name</label>
                            <input type="text" className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none" onChange={(e) => setFormData({...formData, manager_name: e.target.value})} />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Manager Phone</label>
                            <input type="tel" className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none" onChange={(e) => setFormData({...formData, manager_phone: e.target.value})} />
                          </div>
                        </div>

                        {formData.latitude && formData.longitude && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-sm text-green-800">
                              <i className="ph-bold ph-check-circle text-lg text-green-600"></i>
                              <span className="font-medium">Location coordinates captured:</span>
                              <span className="font-mono text-xs">{formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}</span>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {modalType === 'store' && (
                      <>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                          <div className="flex items-start gap-3">
                            <i className="ph-duotone ph-info text-2xl text-blue-600 mt-0.5"></i>
                            <div>
                              <h4 className="font-semibold text-blue-900 mb-1">Search with Google Maps</h4>
                              <p className="text-sm text-blue-700">Search and select a location to auto-fill store details including coordinates for map view</p>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            <i className="ph-bold ph-magnifying-glass mr-1"></i>
                            Search Location (Google Maps)
                          </label>
                          <GooglePlacesAutocomplete
                            onPlaceSelected={(details) => {
                              setFormData({
                                ...formData,
                                store_name: details.storeName || formData.store_name,
                                location: details.fullAddress,
                                city: details.city,
                                state: details.state,
                                pincode: details.pincode,
                                latitude: details.latitude,
                                longitude: details.longitude,
                              });
                            }}
                            placeholder="Search for store location..."
                          />
                        </div>

                        <div className="border-t border-slate-200 pt-4">
                          <p className="text-xs text-slate-500 mb-3 uppercase font-semibold tracking-wide">Store Details</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Store Name*</label>
                          <input 
                            type="text" 
                            required 
                            value={formData.store_name || ''} 
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" 
                            onChange={(e) => setFormData({...formData, store_name: e.target.value})} 
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Store Code*</label>
                            <input type="text" required className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" onChange={(e) => setFormData({...formData, store_code: e.target.value})} />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Client*</label>
                            <select required className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" onChange={(e) => setFormData({...formData, client: e.target.value})}>
                              <option value="">Select client</option>
                              <option value="BigBasket">BigBasket</option>
                              <option value="Zepto">Zepto</option>
                              <option value="Blinkit">Blinkit</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Full Address*</label>
                          <input 
                            type="text" 
                            required 
                            value={formData.location || ''} 
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" 
                            onChange={(e) => setFormData({...formData, location: e.target.value})} 
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">City</label>
                            <input 
                              type="text" 
                              value={formData.city || ''} 
                              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" 
                              onChange={(e) => setFormData({...formData, city: e.target.value})} 
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">State</label>
                            <input 
                              type="text" 
                              value={formData.state || ''} 
                              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" 
                              onChange={(e) => setFormData({...formData, state: e.target.value})} 
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Pincode</label>
                            <input 
                              type="text" 
                              value={formData.pincode || ''} 
                              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" 
                              onChange={(e) => setFormData({...formData, pincode: e.target.value})} 
                            />
                          </div>
                        </div>

                        <div className="border-t border-slate-200 pt-4">
                          <p className="text-xs text-slate-500 mb-3 uppercase font-semibold tracking-wide">Store Manager</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Manager Name</label>
                            <input type="text" className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" onChange={(e) => setFormData({...formData, store_manager_name: e.target.value})} />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Manager Phone</label>
                            <input type="tel" className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" onChange={(e) => setFormData({...formData, store_manager_phone: e.target.value})} />
                          </div>
                        </div>

                        {formData.latitude && formData.longitude && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-sm text-green-800">
                              <i className="ph-bold ph-check-circle text-lg text-green-600"></i>
                              <span className="font-medium">Location coordinates captured:</span>
                              <span className="font-mono text-xs">{formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}</span>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    <div className="flex gap-3 pt-4">
                      <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-3 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition-all">Cancel</button>
                      <button type="submit" className="flex-1 px-4 py-3 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-all">Add {modalType === 'vehicle' ? 'Vehicle' : modalType === 'hub' ? 'Hub' : 'Store'}</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

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
        </GoogleMapsLoader>
      </>
    );
}

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute>
      <AdminDashboardContent />
    </ProtectedRoute>
  );
}
