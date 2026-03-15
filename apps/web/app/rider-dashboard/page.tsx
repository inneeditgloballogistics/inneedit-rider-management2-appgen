'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, LogOut, Package, TrendingUp, Users, Wallet, AlertCircle, Gift, DollarSign, Download, TrendingDown, CheckCircle, User } from 'lucide-react';
import WeatherBadge from '@/components/WeatherBadge';
import RequestAdvanceModal from '@/components/RequestAdvanceModal';
import ReferRiderModal from '@/components/ReferRiderModal';

import html2canvas from 'html2canvas';

interface RiderData {
  id: number;
  user_id: string;
  ceeId: string;
  full_name: string;
  phone: string;
  email: string;
  city?: string;
  state?: string;
  client?: string;
  vehicle_type?: string;
  status: string;
  latitude?: number;
  longitude?: number;
  bank_name?: string;
  account_number?: string;
  onboarding_completed?: boolean;
  assigned_hub_id?: number;
  store_id?: number;
}

interface Hub {
  id: number;
  hub_name: string;
  location: string;
  city: string;
  state: string;
  pincode: string;
  manager_name: string;
  manager_phone: string;
  latitude?: number;
  longitude?: number;
}

interface Store {
  id: number;
  store_name: string;
  location: string;
  city: string;
  state: string;
  pincode: string;
  contact_person: string;
  contact_phone: string;
  store_manager_name?: string;
  store_manager_phone?: string;
  latitude?: number;
  longitude?: number;
}

interface OrderStats {
  total_orders: string;
  total_payout: string;
}

interface Payout {
  id: number;
  week_period: string;
  week_number: number;
  month: number;
  year: number;
  orders_count: number;
  base_payout: string;
  total_incentives: string;
  total_deductions: string;
  net_payout: string;
  final_amount?: string | number;
  final_payout?: string | number;
  status: string;
  payment_date: string;
}

interface Referral {
  id: number;
  referred_name: string;
  referred_phone: string;
  status: string;
  approval_status: string;
  created_at: string;
  month_completion_date?: string;
  amount?: number;
}

interface Deduction {
  id: number;
  deduction_type: string;
  amount: string;
  deduction_date: string;
}

interface Incentive {
  id: number;
  incentive_type: string;
  amount: string;
  incentive_date: string;
}

interface Advance {
  id: number;
  amount: string;
  status: string;
  requested_at: string;
}

interface PayoutDetails {
  allAdditions: number;
  allDeductions: number;
  vehicleRent: number;
  finalAmount: number;
  basePayout?: number;
  entries?: PayrollEntry[];
}

interface PayrollEntry {
  id: number | string;
  entry_type: string;
  amount: number;
  description: string;
  entry_date: string;
  status: string;
}



export default function RiderDashboard() {
  const router = useRouter();
  const [rider, setRider] = useState<RiderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [orderStats, setOrderStats] = useState<OrderStats | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [deductions, setDeductions] = useState<Deduction[]>([]);
  const [incentives, setIncentives] = useState<Incentive[]>([]);
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [currentPayrollWeek, setCurrentPayrollWeek] = useState<Payout | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [downloadingPayslip, setDownloadingPayslip] = useState(false);
  const [payoutDetails, setPayoutDetails] = useState<PayoutDetails | null>(null);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [riderEntries, setRiderEntries] = useState<PayrollEntry[]>([]);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'hub' | 'store'>('dashboard');
  const [hub, setHub] = useState<Hub | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [tabLoading, setTabLoading] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const markOnboardingComplete = async (riderId: string) => {
    try {
      await fetch('/api/riders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: riderId,
          onboarding_completed: true
        })
      });
    } catch (error) {
      console.error('Error marking onboarding complete:', error);
    }
  };



  const checkAuth = async () => {
    try {
      const response = await fetch('/api/rider-auth', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Session verification error:', errorData.error || errorData);
        setLoading(false);
        setTimeout(() => router.push('/rider-login'), 500);
        return;
      }

      const data = await response.json();
      console.log('Auth successful, rider data:', data);
      console.log('Onboarding completed:', data.rider.onboarding_completed);
      setRider(data.rider);
      const ceeId = data.rider.ceeId || data.rider.cee_id;
      console.log('Calling fetchAllData with:', { riderId: data.rider.user_id, ceeId });
      
      // Check if this is rider's first login (onboarding not completed)
      if (data.rider && data.rider.onboarding_completed === false) {
        // Mark onboarding as completed in database
        await markOnboardingComplete(data.rider.user_id);
        // Update local state
        setRider({
          ...data.rider,
          onboarding_completed: true
        });
      }
      
      await fetchAllData(data.rider.user_id, ceeId);
    } catch (error: any) {
      console.error('Auth check failed:', error.message || error);
      setLoading(false);
      setTimeout(() => router.push('/rider-login'), 500);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayoutDetails = async (ceeId: string, weekNumber: number, month: number, year: number, basePayout: number = 0) => {
    try {
      setEntriesLoading(true);
      
      // Fetch aggregated payout details
      const detailsRes = await fetch('/api/payroll/rider-payout-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rider_id: ceeId,
          week_number: weekNumber,
          month: month,
          year: year
        })
      });
      const details = await detailsRes.json();

      // Fetch individual entries for expandable sections
      const { startDate, endDate } = getWeekDateRange(weekNumber, month, year);
      const formatDate = (date: Date) => {
        const y = date.getUTCFullYear();
        const m = String(date.getUTCMonth() + 1).padStart(2, '0');
        const d = String(date.getUTCDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      };

      const entriesRes = await fetch('/api/payroll/rider-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rider_id: ceeId,
          start_date: formatDate(startDate),
          end_date: formatDate(endDate)
        })
      });
      const entriesData = await entriesRes.json();
      setRiderEntries(entriesData.entries || []);

      const finalAmount = details.finalAmount || 0;

      setPayoutDetails({
        allAdditions: details.allAdditions || 0,
        allDeductions: details.allDeductions || 0,
        vehicleRent: details.vehicleRent || 0,
        finalAmount: finalAmount,
        basePayout: basePayout,
      });
    } catch (error) {
      console.error('Error fetching payout details:', error);
      setPayoutDetails(null);
    } finally {
      setEntriesLoading(false);
    }
  };

  const getWeekDateRange = (week: number, month: number, year: number) => {
    let startDate, endDate;
    
    if (week === 1) {
      startDate = new Date(Date.UTC(year, month - 1, 1));
      endDate = new Date(Date.UTC(year, month - 1, 7));
    } else if (week === 2) {
      startDate = new Date(Date.UTC(year, month - 1, 8));
      endDate = new Date(Date.UTC(year, month - 1, 14));
    } else if (week === 3) {
      startDate = new Date(Date.UTC(year, month - 1, 15));
      endDate = new Date(Date.UTC(year, month - 1, 21));
    } else if (week === 4) {
      startDate = new Date(Date.UTC(year, month - 1, 22));
      endDate = new Date(Date.UTC(year, month, 0));
    }
    
    return { startDate, endDate };
  };

  const fetchAllData = async (riderId: string, ceeId?: string) => {
    try {
      // Fetch orders using ceeId ONLY
      const ordersRes = await fetch(`/api/orders?ceeId=${ceeId || ''}`);
      const ordersData = await ordersRes.json();
      setOrderStats(ordersData.stats);

      // Fetch payouts using ceeId ONLY
      let payoutsData: Payout[] = [];
      const payoutsRes = await fetch(`/api/payouts?ceeId=${ceeId || ''}`);
      if (!payoutsRes.ok) {
        console.error('Payouts fetch error:', payoutsRes.status);
        setPayouts([]);
      } else {
        const response = await payoutsRes.json();
        console.log('Payouts data fetched:', response);
        payoutsData = Array.isArray(response) ? response : [];
        setPayouts(payoutsData);
      }
      
      // Set current week's payout - prioritize finalized payouts, then most recent
      if (payoutsData.length > 0) {
        // First, try to find a finalized payout (most recent one)
        let currentWeekPayout = payoutsData.find(p => p.status === 'finalized');
        
        // If no finalized payout, use the most recent one regardless of status
        if (!currentWeekPayout) {
          currentWeekPayout = payoutsData[0];
        }
        
        setCurrentPayrollWeek(currentWeekPayout);
        console.log('Setting current payout:', { 
          week: currentWeekPayout.week_number, 
          month: currentWeekPayout.month,
          year: currentWeekPayout.year,
          status: currentWeekPayout.status,
          final_payout: currentWeekPayout.final_payout,
          net_payout: currentWeekPayout.net_payout
        });
        
        // If payout is finalized, fetch the detailed payout breakdown
        if (currentWeekPayout.status === 'finalized') {
          const basePayout = parseFloat(currentWeekPayout.base_payout) || 0;
          await fetchPayoutDetails(ceeId || '', currentWeekPayout.week_number, currentWeekPayout.month, currentWeekPayout.year, basePayout);
        }
      }

      // Fetch referrals using ceeId
      const referralsRes = await fetch(`/api/referrals?riderId=${ceeId || ''}`);
      const referralsData = await referralsRes.json();
      setReferrals(Array.isArray(referralsData) ? referralsData : []);

      // Fetch deductions using ceeId ONLY
      const deductionsRes = await fetch(`/api/deductions?ceeId=${ceeId || ''}`);
      const deductionsData = await deductionsRes.json();
      setDeductions(Array.isArray(deductionsData.deductions) ? deductionsData.deductions : []);

      // Fetch incentives using ceeId ONLY
      const incentivesRes = await fetch(`/api/incentives?ceeId=${ceeId || ''}`);
      const incentivesData = await incentivesRes.json();
      setIncentives(Array.isArray(incentivesData.incentives) ? incentivesData.incentives : []);

      // Fetch advances using ceeId ONLY
      const advancesRes = await fetch(`/api/advances?ceeId=${ceeId || ''}`);
      const advancesData = await advancesRes.json();
      setAdvances(Array.isArray(advancesData) ? advancesData : []);


    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };



  const handleLogout = async () => {
    try {
      await fetch('/api/rider-auth', {
        method: 'DELETE',
        credentials: 'include',
      });
      router.push('/rider-login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const downloadPayslip = async () => {
    if (!currentPayrollWeek || !rider) return;

    setDownloadingPayslip(true);
    try {
      const element = document.getElementById('payslip-content');
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `payslip-${rider.ceeId}-${currentPayrollWeek.month}-${currentPayrollWeek.year}.png`;
      link.click();
    } catch (error) {
      console.error('Error downloading payslip:', error);
      alert('Failed to download payslip');
    } finally {
      setDownloadingPayslip(false);
    }
  };

  const getPayrollStats = () => {
    if (!currentPayrollWeek) return null;
    return {
      basePayout: parseFloat(currentPayrollWeek.base_payout),
      totalIncentives: parseFloat(currentPayrollWeek.total_incentives),
      totalDeductions: parseFloat(currentPayrollWeek.total_deductions),
      finalPayout: parseFloat(currentPayrollWeek.final_payout || currentPayrollWeek.net_payout),
    };
  };

  const pendingReferrals = Array.isArray(referrals) ? referrals.filter(r => r.approval_status === 'pending').length : 0;
  const approvedReferrals = Array.isArray(referrals) ? referrals.filter(r => r.approval_status === 'approved').length : 0;
  const pendingAdvances = Array.isArray(advances) ? advances.filter(a => a.status === 'pending').length : 0;

  const handleWeekChange = async (week: number) => {
    setSelectedWeek(week);
    // Find payout for selected week
    const weekPayout = payouts.find(
      (p) => p.week_number === week && p.month === new Date().getMonth() + 1 && p.year === new Date().getFullYear()
    ) || currentPayrollWeek;
    if (weekPayout && rider) {
      setCurrentPayrollWeek(weekPayout);
      // If payout is finalized, fetch detailed breakdown
      if (weekPayout.status === 'finalized') {
        const basePayout = parseFloat(weekPayout.base_payout) || 0;
        await fetchPayoutDetails(rider.ceeId, weekPayout.week_number, weekPayout.month, weekPayout.year, basePayout);
      } else {
        setPayoutDetails(null);
      }
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!rider) {
    return null;
  }

  const stats = getPayrollStats();

  const fetchHubDetails = async () => {
    if (!rider?.assigned_hub_id) {
      setHub(null);
      return;
    }
    try {
      setTabLoading(true);
      const response = await fetch(`/api/hubs?id=${rider.assigned_hub_id}`);
      const data = await response.json();
      if (data.length > 0) {
        setHub(data[0]);
      }
    } catch (error) {
      console.error('Error fetching hub details:', error);
    } finally {
      setTabLoading(false);
    }
  };

  const fetchStoreDetails = async () => {
    if (!rider?.store_id) {
      setStore(null);
      return;
    }
    try {
      setTabLoading(true);
      const response = await fetch(`/api/stores?id=${rider.store_id}`);
      const data = await response.json();
      if (data.length > 0) {
        setStore(data[0]);
      }
    } catch (error) {
      console.error('Error fetching store details:', error);
    } finally {
      setTabLoading(false);
    }
  };

  const handleTabChange = async (tab: 'dashboard' | 'hub' | 'store') => {
    setActiveTab(tab);
    if (tab === 'hub' && !hub && rider?.assigned_hub_id) {
      await fetchHubDetails();
    } else if (tab === 'store' && !store && rider?.store_id) {
      await fetchStoreDetails();
    }
  };

  const navigateToLocation = (latitude: number | undefined, longitude: number | undefined, name: string) => {
    if (!latitude || !longitude) {
      alert('Location coordinates not available');
      return;
    }
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    window.open(url, '_blank');
  };

  const getEntriesByType = (type: string): PayrollEntry[] => {
    console.log(`Filtering entries for type: ${type}, total entries:`, riderEntries.length);
    const filtered = riderEntries.filter(e => {
      const entryType = e.entry_type?.toLowerCase() || '';
      console.log(`Checking entry:`, { entryType, description: e.description, amount: e.amount });
      
      if (type === 'additions') {
        return ['referral', 'incentive'].includes(entryType);
      } else if (type === 'deductions') {
        // Include all deductions: advances, security deposits, damages, challans, and others
        return ['advance', 'security_deposit', 'damage', 'challan', 'other'].includes(entryType);
      } else if (type === 'vehicle_rent') {
        return entryType === 'vehicle_rent';
      }
      return false;
    });
    console.log(`Filtered entries for ${type}:`, filtered.length);
    return filtered;
  };

  const ExpandableSection = ({ title, amount, type, entries, color }: any) => (
    <div className={`mb-6 p-4 rounded-lg border ${
      color === 'green' ? 'bg-green-50 border-green-200' :
      color === 'red' ? 'bg-red-50 border-red-200' :
      'bg-orange-50 border-orange-200'
    }`}>
      <button
        onClick={() => setExpandedSection(expandedSection === type ? null : type)}
        className="w-full flex items-center justify-between mb-0"
      >
        <div className="flex-1 text-left">
          <p className={`text-sm font-semibold ${
            color === 'green' ? 'text-green-700' :
            color === 'red' ? 'text-red-700' :
            'text-orange-700'
          } mb-3`}>{title}</p>
          <p className={`text-2xl font-bold ${
            color === 'green' ? 'text-green-600' :
            color === 'red' ? 'text-red-600' :
            'text-orange-600'
          }`}>₹{amount.toFixed(2)}</p>
        </div>
        <div className={`transform transition-transform ml-4 ${
          expandedSection === type ? 'rotate-180' : ''
        }`}>
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </button>

      {/* Expanded Content */}
      {expandedSection === type && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          {entriesLoading ? (
            <div className="text-center py-4">
              <div className="inline-block">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin"></div>
              </div>
            </div>
          ) : entries.length === 0 ? (
            <p className="text-sm text-gray-600 text-center py-4">No entries</p>
          ) : (
            <div className="space-y-2">
              {entries.map((entry, idx) => (
                <div key={`${type}-${entry.id}-${idx}`} className="flex items-center justify-between text-sm bg-white p-3 rounded border border-gray-100">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 capitalize">{entry.entry_type.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-gray-600">{entry.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(entry.entry_date).toLocaleDateString('en-IN', { 
                        day: '2-digit', 
                        month: 'short', 
                        year: 'numeric',
                        timeZone: 'Asia/Kolkata'
                      })}
                    </p>
                  </div>
                  <div className={`text-right font-semibold ${
                    type === 'additions' ? 'text-green-600' :
                    type === 'deductions' ? 'text-red-600' :
                    'text-orange-600'
                  }`}>
                    {type === 'additions' ? '+' : type === 'deductions' ? '-' : '-'}₹{Math.abs(entry.amount).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">CEE ID: {rider.ceeId}</p>
            </div>
          <div className="flex items-center gap-4">
            {rider.latitude && rider.longitude && (
              <WeatherBadge
                latitude={rider.latitude}
                longitude={rider.longitude}
                locationName={rider.city || 'Your Location'}
              />
            )}
            <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition" title="Notifications">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
            <button
              onClick={() => router.push('/rider-profile')}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
              title="View Profile"
            >
              <User className="w-5 h-5" />
              <span className="text-sm font-medium hidden sm:inline">Profile</span>
            </button>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{rider.full_name}</p>
              <p className="text-xs text-gray-500">{rider.client || 'Rider'}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-4 border-t pt-4">
            <button
              onClick={() => handleTabChange('dashboard')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                activeTab === 'dashboard'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              My Dashboard
            </button>
            <button
              onClick={() => handleTabChange('hub')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                activeTab === 'hub'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Hub
            </button>
            <button
              onClick={() => handleTabChange('store')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                activeTab === 'store'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Store
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* HUB TAB */}
        {activeTab === 'hub' && (
          <div className="space-y-6">
            {tabLoading ? (
              <div className="text-center py-12">
                <div className="inline-block">
                  <div className="w-8 h-8 border-3 border-gray-300 border-t-indigo-600 rounded-full animate-spin"></div>
                </div>
                <p className="mt-4 text-gray-600">Loading Hub Details...</p>
              </div>
            ) : hub ? (
              <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                {/* Hub Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-6 text-white">
                  <h2 className="text-3xl font-bold mb-2">{hub.hub_name}</h2>
                  <p className="text-indigo-100">Hub ID: {hub.id}</p>
                </div>

                {/* Hub Details */}
                <div className="p-6 space-y-6">
                  {/* Location Section */}
                  <div className="border-l-4 border-indigo-600 pl-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Location Details</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Full Address</p>
                        <p className="text-base font-medium text-gray-900">{hub.location}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">City</p>
                          <p className="text-base font-medium text-gray-900">{hub.city}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">State</p>
                          <p className="text-base font-medium text-gray-900">{hub.state}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Pincode</p>
                          <p className="text-base font-medium text-gray-900">{hub.pincode}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Coordinates</p>
                          <p className="text-base font-medium text-gray-900">
                            {hub.latitude && hub.longitude ? `${hub.latitude.toFixed(4)}, ${hub.longitude.toFixed(4)}` : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => navigateToLocation(hub.latitude, hub.longitude, hub.hub_name)}
                        className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        Navigate to Hub on Google Maps
                      </button>
                    </div>
                  </div>

                  {/* Hub Manager Section */}
                  <div className="border-l-4 border-blue-600 pl-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Hub Manager Details</h3>
                    <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Manager Name</p>
                        <p className="text-base font-medium text-gray-900">{hub.manager_name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Contact Number</p>
                        <div className="flex items-center gap-2">
                          <a
                            href={`tel:${hub.manager_phone}`}
                            className="text-base font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773c.58 1.694 2.133 3.247 3.827 3.827l.773-1.548a1 1 0 011.06-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 4 14.18 4 9.5V5a1 1 0 011-1h2.153z" />
                            </svg>
                            {hub.manager_phone}
                          </a>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(hub.manager_phone);
                              alert('Phone number copied!');
                            }}
                            className="text-gray-500 hover:text-gray-700"
                            title="Copy phone number"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8 text-center">
                <p className="text-gray-600">No hub assigned to your account</p>
              </div>
            )}
          </div>
        )}

        {/* STORE TAB */}
        {activeTab === 'store' && (
          <div className="space-y-6">
            {tabLoading ? (
              <div className="text-center py-12">
                <div className="inline-block">
                  <div className="w-8 h-8 border-3 border-gray-300 border-t-indigo-600 rounded-full animate-spin"></div>
                </div>
                <p className="mt-4 text-gray-600">Loading Store Details...</p>
              </div>
            ) : store ? (
              <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                {/* Store Header */}
                <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 text-white">
                  <h2 className="text-3xl font-bold mb-2">{store.store_name}</h2>
                  <p className="text-green-100">Store ID: {store.id}</p>
                </div>

                {/* Store Details */}
                <div className="p-6 space-y-6">
                  {/* Location Section */}
                  <div className="border-l-4 border-green-600 pl-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Location Details</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Full Address</p>
                        <p className="text-base font-medium text-gray-900">{store.location}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">City</p>
                          <p className="text-base font-medium text-gray-900">{store.city}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">State</p>
                          <p className="text-base font-medium text-gray-900">{store.state}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Pincode</p>
                          <p className="text-base font-medium text-gray-900">{store.pincode}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Coordinates</p>
                          <p className="text-base font-medium text-gray-900">
                            {store.latitude && store.longitude ? `${store.latitude.toFixed(4)}, ${store.longitude.toFixed(4)}` : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => navigateToLocation(store.latitude, store.longitude, store.store_name)}
                        className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        Navigate to Store on Google Maps
                      </button>
                    </div>
                  </div>

                  {/* Store Contact Section */}
                  <div className="border-l-4 border-blue-600 pl-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Store Contact Details</h3>
                    <div className="bg-blue-50 rounded-lg p-4 space-y-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Contact Person</p>
                        <p className="text-base font-medium text-gray-900">{store.contact_person}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Contact Number</p>
                        <div className="flex items-center gap-2">
                          <a
                            href={`tel:${store.contact_phone}`}
                            className="text-base font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773c.58 1.694 2.133 3.247 3.827 3.827l.773-1.548a1 1 0 011.06-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 4 14.18 4 9.5V5a1 1 0 011-1h2.153z" />
                            </svg>
                            {store.contact_phone}
                          </a>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(store.contact_phone);
                              alert('Phone number copied!');
                            }}
                            className="text-gray-500 hover:text-gray-700"
                            title="Copy phone number"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      {store.store_manager_name && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Store Manager</p>
                          <p className="text-base font-medium text-gray-900">{store.store_manager_name}</p>
                        </div>
                      )}
                      {store.store_manager_phone && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Store Manager Phone</p>
                          <div className="flex items-center gap-2">
                            <a
                              href={`tel:${store.store_manager_phone}`}
                              className="text-base font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-2"
                            >
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773c.58 1.694 2.133 3.247 3.827 3.827l.773-1.548a1 1 0 011.06-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 4 14.18 4 9.5V5a1 1 0 011-1h2.153z" />
                              </svg>
                              {store.store_manager_phone}
                            </a>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(store.store_manager_phone);
                                alert('Phone number copied!');
                              }}
                              className="text-gray-500 hover:text-gray-700"
                              title="Copy phone number"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8 text-center">
                <p className="text-gray-600">No store assigned to your account</p>
              </div>
            )}
          </div>
        )}

        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <>
        {/* SECTION 1: Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">
                  {currentPayrollWeek?.status === 'finalized' && currentPayrollWeek?.week_number 
                    ? `Total Earnings (Week ${currentPayrollWeek.week_number}) Final Payout` 
                    : 'Total Earnings'}
                </p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {currentPayrollWeek?.status === 'finalized'
                    ? `₹${(parseFloat(String(currentPayrollWeek.final_payout)) || parseFloat(String(currentPayrollWeek.net_payout)) || 0).toFixed(0)}`
                    : `₹${parseFloat((orderStats?.total_payout || 0).toString()).toFixed(0)}`}
                </p>
              </div>
              <Wallet className="w-12 h-12 text-green-100" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Pending Advances</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">
                  {pendingAdvances}
                </p>
              </div>
              <TrendingUp className="w-12 h-12 text-orange-100" />
            </div>
          </div>
        </div>



        {/* SECTION 2: Payroll Overview - Main Card */}
        {stats && currentPayrollWeek && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8">
            {/* Payslip Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Payroll Summary</h2>
                  <p className="text-indigo-100 text-sm mt-1">
                    {new Date(currentPayrollWeek.month + '-01-' + currentPayrollWeek.year).toLocaleDateString('en-IN', { month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={downloadPayslip}
                    disabled={downloadingPayslip}
                    className="flex items-center gap-2 bg-white text-indigo-600 px-4 py-2 rounded-lg font-medium hover:bg-indigo-50 transition disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    {downloadingPayslip ? 'Generating...' : 'Download Payslip'}
                  </button>
                </div>
              </div>
            </div>



            {/* Payslip Content */}
            <div id="payslip-content" className="p-8">
              {/* Rider Details */}
              <div className="mb-8 pb-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Rider Information</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 font-medium mb-1">Name</p>
                    <p className="text-sm font-semibold text-gray-900">{rider.full_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-medium mb-1">CEE ID</p>
                    <p className="text-sm font-semibold text-gray-900">{rider.ceeId}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-medium mb-1">Phone</p>
                    <p className="text-sm font-semibold text-gray-900">{rider.phone}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-medium mb-1">Vehicle Type</p>
                    <p className="text-sm font-semibold text-gray-900">{rider.vehicle_type || 'N/A'}</p>
                  </div>
                </div>
              </div>



              {/* Final Amount Calculation */}
              {payoutDetails ? (
                <div className="space-y-4">
                  {/* Calculation Breakdown */}
                  <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
                    <p className="text-sm font-semibold text-green-700 mb-6 flex items-center gap-2">
                      <span className="w-5 h-5 bg-green-600 text-white rounded-full flex items-center justify-center text-xs">✓</span>
                      Payout Finalized
                    </p>

                    {/* Formula Info Box */}
                    <div className="mb-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
                      <p className="text-xs font-semibold text-amber-900 mb-3 uppercase tracking-wide">Formula Applied:</p>
                      <div className="text-xs text-amber-800 space-y-1 font-mono">
                        <p><strong>Final Amount</strong> = All Additions - All Deductions - Vehicle Rent</p>
                        <p><strong>Final Payout</strong> = Base Payout + Final Amount</p>
                      </div>
                    </div>

                    {/* Expandable Sections */}
                    <ExpandableSection
                      title={`All Additions (Week ${currentPayrollWeek?.week_number})`}
                      amount={payoutDetails.allAdditions}
                      type="additions"
                      entries={getEntriesByType('additions')}
                      color="green"
                    />

                    <ExpandableSection
                      title={`All Deductions (Week ${currentPayrollWeek?.week_number})`}
                      amount={payoutDetails.allDeductions}
                      type="deductions"
                      entries={getEntriesByType('deductions')}
                      color="red"
                    />

                    <ExpandableSection
                      title={`Vehicle Rent (Week ${currentPayrollWeek?.week_number})`}
                      amount={payoutDetails.vehicleRent}
                      type="vehicle_rent"
                      entries={getEntriesByType('vehicle_rent')}
                      color="orange"
                    />

                    {/* Final Amount Calculation */}
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm font-semibold text-blue-700 mb-4">Final Amount = All Additions - All Deductions - Vehicle Rent</p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-700">All Additions</span>
                          <span className="font-medium text-green-600">+₹{payoutDetails.allAdditions.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-700">All Deductions</span>
                          <span className="font-medium text-red-600">-₹{payoutDetails.allDeductions.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-700">Vehicle Rent</span>
                          <span className="font-medium text-orange-600">-₹{payoutDetails.vehicleRent.toFixed(2)}</span>
                        </div>
                        <div className="border-t-2 border-blue-300 pt-2 flex items-center justify-between">
                          <span className="font-semibold text-gray-900">= Final Amount</span>
                          <span className={`text-lg font-bold ${payoutDetails.finalAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {payoutDetails.finalAmount >= 0 ? '+' : ''}₹{payoutDetails.finalAmount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Final Payout Box (Green Transparent) */}
                  <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-green-50 p-6 rounded-lg border-2 border-green-300 backdrop-blur-sm">
                    <p className="text-xs font-semibold text-green-700 mb-4 uppercase tracking-wide">Final Payout = Base Payout + Final Amount</p>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Base Payout</span>
                        <span className="text-sm font-semibold text-gray-900">₹{(payoutDetails.basePayout || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">+ Final Amount</span>
                        <span className={`text-sm font-semibold ${payoutDetails.finalAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {payoutDetails.finalAmount >= 0 ? '+' : ''}₹{payoutDetails.finalAmount.toFixed(2)}
                        </span>
                      </div>
                      <div className="border-t-2 border-green-400 pt-3 flex items-center justify-between">
                        <span className="font-bold text-gray-900">= FINAL PAYOUT</span>
                        <span className="text-2xl font-bold text-green-600">₹{((payoutDetails.basePayout || 0) + payoutDetails.finalAmount).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-lg border border-indigo-200">
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Base Payout</span>
                      <span className="text-sm font-medium text-gray-900">₹{stats.basePayout.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">+ Incentives</span>
                      <span className="text-sm font-medium text-green-600">₹{stats.totalIncentives.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">- Deductions</span>
                      <span className="text-sm font-medium text-red-600">₹{stats.totalDeductions.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="border-t border-indigo-300 pt-4 flex items-center justify-between">
                    <span className="text-base font-bold text-gray-900">=</span>
                    <div className="text-right">
                      <p className="text-xs text-gray-600 mb-1">ESTIMATED AMOUNT</p>
                      <p className="text-3xl font-bold text-indigo-600">₹{stats.netPayout.toFixed(2)}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-4 text-center">Awaiting Admin Approval</p>
                </div>
              )}
              {currentPayrollWeek.payment_date && (
                <p className="text-xs text-gray-600 mt-3 pt-3">
                  Paid on: {new Date(currentPayrollWeek.payment_date).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
                </p>
              )}
            </div>
          </div>
        )}

        {/* SECTION 3: Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Left: Recent Transactions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Referrals */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">My Referrals</h3>
                <p className="text-sm text-gray-600 mt-1">{referrals.length} referral{referrals.length !== 1 ? 's' : ''} submitted</p>
              </div>
              <div className="divide-y">
                {referrals.length > 0 ? (
                  referrals.slice(0, 5).map((referral) => (
                    <div key={referral.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{referral.referred_name}</p>
                          <p className="text-sm text-gray-600 mt-1">{referral.referred_phone}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              referral.approval_status === 'approved' ? 'bg-green-100 text-green-800' :
                              referral.approval_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {referral.approval_status === 'approved' ? '✓ Approved' : 
                               referral.approval_status === 'pending' ? 'Pending' : 'Rejected'}
                            </span>
                            {referral.approval_status === 'approved' && referral.amount && (
                              <span className="text-xs font-medium text-green-600">₹{referral.amount}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    No referrals yet. Start referring to earn bonus!
                  </div>
                )}
              </div>
            </div>


          </div>

          {/* Right: Quick Actions & Status */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-sm p-6 text-white">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => setShowAdvanceModal(true)}
                  className="w-full bg-white text-indigo-600 px-4 py-3 rounded-lg font-medium hover:bg-gray-100 transition flex items-center justify-center gap-2"
                >
                  <TrendingUp className="w-4 h-4" />
                  Request Advance
                </button>
                <button
                  onClick={() => setShowReferralModal(true)}
                  className="w-full bg-white text-indigo-600 px-4 py-3 rounded-lg font-medium hover:bg-gray-100 transition flex items-center justify-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  Refer a Rider
                </button>
              </div>
            </div>

            {/* Status Cards */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Status & Info</h3>
              </div>
              <div className="divide-y">
                <div className="p-4">
                  <p className="text-xs text-gray-600 font-medium">Account Status</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1 capitalize flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    {rider.status}
                  </p>
                </div>
                <div className="p-4">
                  <p className="text-xs text-gray-600 font-medium">Bank Account</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    {rider.bank_name ? rider.account_number ? '••••' + rider.account_number.slice(-4) : 'Added' : 'Not Added'}
                  </p>
                </div>
                <div className="p-4">
                  <p className="text-xs text-gray-600 font-medium">This Week Payout</p>
                  <p className="text-sm font-semibold text-indigo-600 mt-1">
                    ₹{currentPayrollWeek?.status === 'finalized'
                      ? (parseFloat(String(currentPayrollWeek.final_payout)) || parseFloat(String(currentPayrollWeek.net_payout)) || 0).toFixed(2)
                      : stats?.finalPayout.toFixed(2) || '0.00'}
                  </p>
                  {currentPayrollWeek?.status !== 'finalized' && <p className="text-xs text-gray-500 mt-1">Estimated (Pending Approval)</p>}
                </div>
              </div>
            </div>

            {/* Deductions Summary */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Active Deductions</h3>
              </div>
              <div className="p-4">
                {deductions.length > 0 ? (
                  <div className="space-y-2">
                    {deductions.slice(0, 3).map((ded) => (
                      <div key={ded.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 capitalize">{ded.deduction_type}</span>
                        <span className="font-semibold text-red-600">-₹{parseFloat(ded.amount).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No active deductions</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4: Earnings Trend */}
        {payouts.length > 1 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Payroll History</h3>
              <p className="text-sm text-gray-600 mt-1">Last 6 months</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Period</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Orders</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Base</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Incentives</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Deductions</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Net Payout</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {payouts.slice(0, 6).map((payout) => (
                    <tr key={payout.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{payout.month}/{payout.year}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{payout.orders_count}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">₹{parseFloat(payout.base_payout).toFixed(0)}</td>
                      <td className="px-6 py-4 text-sm text-green-600 font-medium">+₹{parseFloat(payout.total_incentives).toFixed(0)}</td>
                      <td className="px-6 py-4 text-sm text-red-600 font-medium">-₹{parseFloat(payout.total_deductions).toFixed(0)}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-indigo-600">₹{parseFloat(payout.net_payout).toFixed(0)}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          payout.status === 'paid' ? 'bg-green-100 text-green-800' :
                          payout.status === 'processed' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {payout.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
          </>
        )}
      </div>

      {/* Modals */}
      {rider && (
        <>
          <RequestAdvanceModal
            isOpen={showAdvanceModal}
            onClose={() => setShowAdvanceModal(false)}
            rider={rider}
            onSuccess={() => fetchAllData(rider.user_id, rider.ceeId)}
          />
          <ReferRiderModal
            isOpen={showReferralModal}
            onClose={() => setShowReferralModal(false)}
            rider={rider}
            onSuccess={() => fetchAllData(rider.user_id, rider.ceeId)}
          />
        </>
      )}
    </div>
  );
}
