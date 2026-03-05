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
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'info' | 'warning' | 'error'>('info');
  const [lastAdvancesCount, setLastAdvancesCount] = useState(0);

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
    // Poll for new advances and notifications every 10 seconds
    const advancesInterval = setInterval(() => {
      fetchCounts(); // This updates pendingAdvancesCount
      fetchNotifications();
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
      
      // Check if new advances were added
      const currentAdvancesCount = advancesData.pendingCount || 0;
      if (lastAdvancesCount > 0 && currentAdvancesCount > lastAdvancesCount) {
        // New advance request detected
        const newRequestsCount = currentAdvancesCount - lastAdvancesCount;
        setToastMessage(`${newRequestsCount} new advance request${newRequestsCount > 1 ? 's' : ''} received!`);
        setToastType('info');
        
        // Auto-hide toast after 5 seconds
        setTimeout(() => setToastMessage(''), 5000);
      }
      
      setLastAdvancesCount(currentAdvancesCount);
      setPendingAdvancesCount(currentAdvancesCount);
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

    {/* Toast Notifications */}
    {toastMessage && (
      <div className={`fixed bottom-6 right-6 z-40 px-6 py-4 rounded-xl shadow-2xl border flex items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-300 ${
        toastType === 'info' ? 'bg-blue-50 border-blue-200 text-blue-800' :
        toastType === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
        toastType === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' :
        'bg-red-50 border-red-200 text-red-800'
      }`}>
        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
          toastType === 'info' ? 'bg-blue-200' :
          toastType === 'success' ? 'bg-green-200' :
          toastType === 'warning' ? 'bg-amber-200' :
          'bg-red-200'
        }`}>
          <i className={`ph-bold text-sm ${
            toastType === 'info' ? 'ph-info text-blue-700' :
            toastType === 'success' ? 'ph-check text-green-700' :
            toastType === 'warning' ? 'ph-warning text-amber-700' :
            'ph-x text-red-700'
          }`}></i>
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm">{toastMessage}</p>
        </div>
        <button
          onClick={() => setToastMessage('')}
          className="ml-2 p-1 hover:bg-white/30 rounded transition-colors"
        >
          <i className="ph-bold ph-x text-lg"></i>
        </button>
      </div>
    )}

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

            {/* Placeholder for other tabs - keeping structure minimal to fix the error */}
            {activeTab !== 'dashboard' && <div className="p-4 text-center text-slate-500">Loading content...</div>}

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
