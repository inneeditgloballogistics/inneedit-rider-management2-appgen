'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, LogOut, Package, TrendingUp, Users, Wallet, AlertCircle, Gift, DollarSign } from 'lucide-react';
import WeatherCard from '@/components/WeatherCard';
import WeatherBadge from '@/components/WeatherBadge';

interface RiderData {
  id: number;
  user_id: string;
  ceeId: string;
  full_name: string;
  phone: string;
  email: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  client?: string;
  driving_license_number?: string;
  driving_license_expiry?: string;
  driving_license_url?: string;
  aadhar_number?: string;
  aadhar_url?: string;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  vehicle_type?: string;
  assigned_hub_id?: number;
  assigned_vehicle_id?: number;
  status: string;
  phone_verified?: boolean;
  created_at?: string;
  latitude?: number;
  longitude?: number;
}

interface OrderStats {
  total_orders: string;
  total_payout: string;
}

interface Deduction {
  id: number;
  deduction_type: string;
  amount: string;
  description: string;
  deduction_date: string;
}

interface Incentive {
  id: number;
  incentive_type: string;
  amount: string;
  description: string;
  incentive_date: string;
}

interface Referral {
  id: number;
  referred_name: string;
  referred_phone: string;
  preferred_location: string;
  status: string;
  created_at: string;
}

interface Advance {
  id: number;
  amount: string;
  reason: string;
  status: string;
  requested_at: string;
  admin_notes: string;
}

interface Payout {
  id: number;
  week_period: string;
  month: number;
  year: number;
  orders_count: number;
  base_payout: string;
  total_incentives: string;
  total_deductions: string;
  net_payout: string;
  status: string;
  payment_date: string;
}

export default function RiderDashboard() {
  const router = useRouter();
  const [rider, setRider] = useState<RiderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Week selection states
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [weeklyPayout, setWeeklyPayout] = useState<Payout | null>(null);
  
  // Data states
  const [orderStats, setOrderStats] = useState<OrderStats | null>(null);
  const [deductions, setDeductions] = useState<Deduction[]>([]);
  const [deductionSummary, setDeductionSummary] = useState<any[]>([]);
  const [incentives, setIncentives] = useState<Incentive[]>([]);
  const [incentiveSummary, setIncentiveSummary] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);

  // Form states
  const [showAdvanceForm, setShowAdvanceForm] = useState(false);
  const [showReferralForm, setShowReferralForm] = useState(false);
  const [showEditBankForm, setShowEditBankForm] = useState(false);
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [advanceReason, setAdvanceReason] = useState('');
  const [referredName, setReferredName] = useState('');
  const [referredPhone, setReferredPhone] = useState('');
  const [preferredLocation, setPreferredLocation] = useState('');
  
  // Bank details form states
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/rider-auth', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        router.push('/rider-login');
        return;
      }

      const data = await response.json();
      setRider(data.rider);
      
      // Initialize bank form with existing data
      setBankName(data.rider.bank_name || '');
      setAccountNumber(data.rider.account_number || '');
      setIfscCode(data.rider.ifsc_code || '');
      
      await fetchAllData(data.rider.user_id);
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/rider-login');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllData = async (riderId: string) => {
    try {
      // Fetch orders
      const ordersRes = await fetch(`/api/orders?riderId=${riderId}`);
      const ordersData = await ordersRes.json();
      setOrderStats(ordersData.stats);

      // Fetch deductions
      const deductionsRes = await fetch(`/api/deductions?riderId=${riderId}`);
      const deductionsData = await deductionsRes.json();
      setDeductions(deductionsData.deductions);
      setDeductionSummary(deductionsData.summary);

      // Fetch incentives
      const incentivesRes = await fetch(`/api/incentives?riderId=${riderId}`);
      const incentivesData = await incentivesRes.json();
      setIncentives(incentivesData.incentives);
      setIncentiveSummary(incentivesData.summary);

      // Fetch referrals
      const referralsRes = await fetch(`/api/referrals?riderId=${riderId}`);
      const referralsData = await referralsRes.json();
      setReferrals(referralsData);

      // Fetch advances
      const advancesRes = await fetch(`/api/advances?riderId=${riderId}`);
      const advancesData = await advancesRes.json();
      setAdvances(advancesData);

      // Fetch payouts
      const payoutsRes = await fetch(`/api/payouts?riderId=${riderId}`);
      const payoutsData = await payoutsRes.json();
      setPayouts(payoutsData);
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

  const fetchWeeklyPayout = async (month: number, year: number, weekNum: number) => {
    if (!rider) return;

    try {
      const response = await fetch(`/api/payouts?riderId=${rider.user_id}&month=${month}&year=${year}&weekNumber=${weekNum}`);
      const data = await response.json();
      
      if (data.length > 0) {
        setWeeklyPayout(data[0]);
      } else {
        setWeeklyPayout(null);
      }
    } catch (error) {
      console.error('Error fetching weekly payout:', error);
    }
  };

  const handleWeekSelection = (weekNum: number) => {
    setSelectedWeek(weekNum);
    fetchWeeklyPayout(selectedMonth, selectedYear, weekNum);
  };

  const handleAdvanceRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rider) return;

    try {
      const response = await fetch('/api/advances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          riderId: rider.user_id,
          ceeId: rider.ceeId,
          riderName: rider.full_name,
          storeLocation: `${rider.city || ''}, ${rider.state || ''}`.trim(),
          amount: parseFloat(advanceAmount),
          reason: advanceReason,
        }),
      });

      if (response.ok) {
        setShowAdvanceForm(false);
        setAdvanceAmount('');
        setAdvanceReason('');
        await fetchAllData(rider.user_id);
        alert('Advance request submitted successfully!');
      }
    } catch (error) {
      console.error('Error submitting advance request:', error);
      alert('Failed to submit advance request');
    }
  };

  const handleReferralSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rider) return;

    try {
      const response = await fetch('/api/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referrerId: rider.user_id,
          referrerCeeId: rider.ceeId,
          referrerName: rider.full_name,
          referredName,
          referredPhone,
          preferredLocation,
        }),
      });

      if (response.ok) {
        setShowReferralForm(false);
        setReferredName('');
        setReferredPhone('');
        setPreferredLocation('');
        await fetchAllData(rider.user_id);
        alert('Referral submitted successfully!');
      }
    } catch (error) {
      console.error('Error submitting referral:', error);
      alert('Failed to submit referral');
    }
  };

  const handleBankDetailsUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rider) return;

    try {
      const response = await fetch('/api/riders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: rider.user_id,
          bank_name: bankName,
          account_number: accountNumber,
          ifsc_code: ifscCode,
        }),
      });

      if (response.ok) {
        const updatedRider = await response.json();
        setRider(updatedRider.rider);
        setShowEditBankForm(false);
        alert('Bank details updated successfully! Admin will be notified.');
      } else {
        alert('Failed to update bank details');
      }
    } catch (error) {
      console.error('Error updating bank details:', error);
      alert('Failed to update bank details');
    }
  };

  // Generate month options for current year
  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  const weeks = [
    { value: 1, label: 'Week 1 (1-7)', period: '1-7' },
    { value: 2, label: 'Week 2 (8-14)', period: '8-14' },
    { value: 3, label: 'Week 3 (15-21)', period: '15-21' },
    { value: 4, label: 'Week 4 (22-End)', period: '22-End' },
  ];

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Rider Dashboard</h1>
            <p className="text-sm text-gray-600">CEE ID: {rider.ceeId}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:block">
              <WeatherBadge 
                latitude={rider.latitude || 12.9716} 
                longitude={rider.longitude || 77.5946} 
                locationName={rider.city || 'Your Location'} 
              />
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{rider.full_name}</p>
              <p className="text-xs text-gray-500">{rider.client || 'N/A'}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>
        {/* Stats Overview and Weather */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {orderStats?.total_orders || 0}
                </p>
              </div>
              <Package className="w-10 h-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Payout</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  ₹{parseFloat(orderStats?.total_payout || '0').toFixed(2)}
                </p>
              </div>
              <Wallet className="w-10 h-10 text-green-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Referrals</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {referrals.length}
                </p>
              </div>
              <Users className="w-10 h-10 text-purple-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Incentives</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">
                  ₹{incentiveSummary.reduce((sum, item) => sum + parseFloat(item.total_amount), 0).toFixed(2)}
                </p>
              </div>
              <Gift className="w-10 h-10 text-orange-500" />
            </div>
          </div>

          {/* Current Location Weather */}
          {rider && rider.latitude && rider.longitude && (
            <WeatherCard
              latitude={rider.latitude || 12.9716}
              longitude={rider.longitude || 77.5946}
              locationName={`${rider.city || 'Your Location'}`}
              showDetails={true}
            />
          )}
          {(!rider || !rider.latitude || !rider.longitude) && (
            <WeatherCard
              latitude={12.9716}
              longitude={77.5946}
              locationName="Hyderabad"
              showDetails={true}
            />
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border mb-8">
          <div className="border-b">
            <div className="flex overflow-x-auto">
              {['overview', 'profile', 'payouts', 'deductions', 'incentives', 'referrals', 'advances'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-4 font-medium whitespace-nowrap ${
                    activeTab === tab
                      ? 'border-b-2 border-indigo-600 text-indigo-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div>
                <h3 className="text-lg font-semibold mb-6">My Complete Profile</h3>
                
                {/* Personal Information */}
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    Personal Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Full Name</p>
                      <p className="font-medium text-gray-900">{rider.full_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">CEE ID</p>
                      <p className="font-medium text-gray-900">{rider.ceeId}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium text-gray-900">{rider.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium text-gray-900">{rider.email || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Date of Birth</p>
                      <p className="font-medium text-gray-900">
                        {rider.date_of_birth ? new Date(rider.date_of_birth).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Gender</p>
                      <p className="font-medium text-gray-900">{rider.gender || 'N/A'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="font-medium text-gray-900">
                        {rider.address || 'N/A'}
                        {rider.city && `, ${rider.city}`}
                        {rider.state && `, ${rider.state}`}
                        {rider.pincode && ` - ${rider.pincode}`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Work Information */}
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    Work Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Client</p>
                      <p className="font-medium text-gray-900">{rider.client || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                        rider.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {rider.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Vehicle Type</p>
                      <p className="font-medium text-gray-900">{rider.vehicle_type || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Assigned Hub</p>
                      <p className="font-medium text-gray-900">{rider.assigned_hub_id || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Bank Details Section */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 mb-6 border border-green-100">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                      </div>
                      Bank & UPI Details
                    </h4>
                    <button
                      onClick={() => setShowEditBankForm(true)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
                    >
                      Edit Details
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Bank Name</p>
                      <p className="font-medium text-gray-900">{rider.bank_name || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Account Number</p>
                      <p className="font-medium text-gray-900">
                        {rider.account_number ? '••••' + rider.account_number.slice(-4) : 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">IFSC Code</p>
                      <p className="font-medium text-gray-900">{rider.ifsc_code || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="mt-4 bg-white rounded-lg p-3 border border-green-200">
                    <p className="text-xs text-gray-600">
                      <span className="font-medium">Note:</span> When you update your bank details, admin will be automatically notified for verification.
                    </p>
                  </div>
                </div>

                {/* Documents Section */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    Documents
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Driving License Number</p>
                      <p className="font-medium text-gray-900">{rider.driving_license_number || 'N/A'}</p>
                      {rider.driving_license_expiry && (
                        <p className="text-xs text-gray-500 mt-1">
                          Expires: {new Date(rider.driving_license_expiry).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Aadhar Number</p>
                      <p className="font-medium text-gray-900">
                        {rider.aadhar_number ? '••••-••••-' + rider.aadhar_number.slice(-4) : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Emergency Contact</p>
                      <p className="font-medium text-gray-900">{rider.emergency_contact_name || 'N/A'}</p>
                      <p className="text-xs text-gray-500">{rider.emergency_contact_phone || ''}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Quick Actions */}
                  <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-lg text-white">
                    <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                      <button
                        onClick={() => setShowAdvanceForm(true)}
                        className="w-full bg-white text-indigo-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition"
                      >
                        Request Advance
                      </button>
                      <button
                        onClick={() => setShowReferralForm(true)}
                        className="w-full bg-white text-indigo-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition"
                      >
                        Refer a Rider
                      </button>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Deductions Summary</h3>
                    <div className="space-y-2">
                      {deductionSummary.map((item, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 capitalize">{item.deduction_type}</span>
                          <span className="text-sm font-medium text-red-600">-₹{parseFloat(item.total_amount).toFixed(2)}</span>
                        </div>
                      ))}
                      {deductionSummary.length === 0 && (
                        <p className="text-sm text-gray-500">No deductions</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payouts Tab */}
            {activeTab === 'payouts' && (
              <div>
                <h3 className="text-lg font-semibold mb-6">Weekly Payouts</h3>
                
                {/* Week Selector */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-lg mb-6 border border-indigo-100">
                  <h4 className="font-medium text-gray-900 mb-4">View Earnings by Week</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Select Month</label>
                      <select
                        value={selectedMonth}
                        onChange={(e) => {
                          setSelectedMonth(parseInt(e.target.value));
                          setSelectedWeek(null);
                          setWeeklyPayout(null);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                      >
                        {months.map((month) => (
                          <option key={month.value} value={month.value}>
                            {month.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Select Year</label>
                      <select
                        value={selectedYear}
                        onChange={(e) => {
                          setSelectedYear(parseInt(e.target.value));
                          setSelectedWeek(null);
                          setWeeklyPayout(null);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                      >
                        <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
                        <option value={new Date().getFullYear() - 1}>{new Date().getFullYear() - 1}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Select Week</label>
                      <select
                        value={selectedWeek || ''}
                        onChange={(e) => handleWeekSelection(parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                      >
                        <option value="">Choose week...</option>
                        {weeks.map((week) => (
                          <option key={week.value} value={week.value}>
                            {week.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Weekly Earnings Display */}
                  {selectedWeek && (
                    <div className="mt-6">
                      {weeklyPayout ? (
                        <div className="bg-white rounded-lg p-6 shadow-sm border border-indigo-200">
                          <div className="flex items-center justify-between mb-4">
                            <h5 className="text-lg font-semibold text-gray-900">
                              Week {selectedWeek} - {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
                            </h5>
                            <span className={`text-xs px-3 py-1 rounded-full ${
                              weeklyPayout.status === 'paid' ? 'bg-green-100 text-green-800' :
                              weeklyPayout.status === 'processed' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {weeklyPayout.status}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div className="bg-blue-50 p-4 rounded-lg">
                              <p className="text-xs text-gray-600 mb-1">Orders Completed</p>
                              <p className="text-2xl font-bold text-blue-600">{weeklyPayout.orders_count}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <p className="text-xs text-gray-600 mb-1">Base Payout</p>
                              <p className="text-2xl font-bold text-gray-900">₹{parseFloat(weeklyPayout.base_payout).toFixed(2)}</p>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg">
                              <p className="text-xs text-gray-600 mb-1">Incentives</p>
                              <p className="text-2xl font-bold text-green-600">+₹{parseFloat(weeklyPayout.total_incentives).toFixed(2)}</p>
                            </div>
                            <div className="bg-red-50 p-4 rounded-lg">
                              <p className="text-xs text-gray-600 mb-1">Deductions</p>
                              <p className="text-2xl font-bold text-red-600">-₹{parseFloat(weeklyPayout.total_deductions).toFixed(2)}</p>
                            </div>
                          </div>

                          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-lg text-white">
                            <p className="text-sm opacity-90 mb-1">Net Payout Received</p>
                            <p className="text-4xl font-bold">₹{parseFloat(weeklyPayout.net_payout).toFixed(2)}</p>
                            {weeklyPayout.payment_date && (
                              <p className="text-sm opacity-90 mt-2">
                                Paid on: {new Date(weeklyPayout.payment_date).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white rounded-lg p-8 text-center border border-gray-200">
                          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-600">No payout data found for this week</p>
                          <p className="text-sm text-gray-500 mt-1">Select a different week to view earnings</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* All Payouts Table */}
                <h4 className="font-medium text-gray-900 mb-3">All Payouts History</h4>
                {payouts.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Week</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Period</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Orders</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Base</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Incentives</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Deductions</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Net Payout</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {payouts.map((payout) => (
                          <tr key={payout.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm">{payout.month}/{payout.year}</td>
                            <td className="px-4 py-3 text-sm">{payout.week_period}</td>
                            <td className="px-4 py-3 text-sm">{payout.orders_count}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">₹{parseFloat(payout.base_payout).toFixed(2)}</td>
                            <td className="px-4 py-3 text-sm text-green-600">+₹{parseFloat(payout.total_incentives).toFixed(2)}</td>
                            <td className="px-4 py-3 text-sm text-red-600">-₹{parseFloat(payout.total_deductions).toFixed(2)}</td>
                            <td className="px-4 py-3 text-sm font-semibold text-indigo-600">₹{parseFloat(payout.net_payout).toFixed(2)}</td>
                            <td className="px-4 py-3">
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
                ) : (
                  <div className="text-center py-8 text-gray-500">No payout records yet</div>
                )}
              </div>
            )}

            {/* Deductions Tab */}
            {activeTab === 'deductions' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Deductions</h3>
                {deductions.length > 0 ? (
                  <div className="space-y-3">
                    {deductions.map((deduction) => (
                      <div key={deduction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium capitalize">{deduction.deduction_type}</span>
                            <span className="text-xs text-gray-500">
                              {new Date(deduction.deduction_date).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{deduction.description}</p>
                        </div>
                        <span className="text-lg font-semibold text-red-600">-₹{parseFloat(deduction.amount).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">No deductions</div>
                )}
              </div>
            )}

            {/* Incentives Tab */}
            {activeTab === 'incentives' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Incentives</h3>
                {incentives.length > 0 ? (
                  <div className="space-y-3">
                    {incentives.map((incentive) => (
                      <div key={incentive.id} className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium capitalize">{incentive.incentive_type}</span>
                            <span className="text-xs text-gray-500">
                              {new Date(incentive.incentive_date).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{incentive.description}</p>
                        </div>
                        <span className="text-lg font-semibold text-green-600">+₹{parseFloat(incentive.amount).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">No incentives yet</div>
                )}
              </div>
            )}

            {/* Referrals Tab */}
            {activeTab === 'referrals' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">My Referrals</h3>
                  <button
                    onClick={() => setShowReferralForm(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                  >
                    + New Referral
                  </button>
                </div>
                {referrals.length > 0 ? (
                  <div className="space-y-3">
                    {referrals.map((referral) => (
                      <div key={referral.id} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{referral.referred_name}</p>
                            <p className="text-sm text-gray-600">{referral.referred_phone}</p>
                            <p className="text-sm text-gray-500 mt-1">Location: {referral.preferred_location}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(referral.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <span className={`text-xs px-3 py-1 rounded-full ${
                            referral.status === 'registered' ? 'bg-green-100 text-green-800' :
                            referral.status === 'called' ? 'bg-blue-100 text-blue-800' :
                            referral.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {referral.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">No referrals yet</div>
                )}
              </div>
            )}

            {/* Advances Tab */}
            {activeTab === 'advances' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Advance Requests</h3>
                  <button
                    onClick={() => setShowAdvanceForm(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                  >
                    + Request Advance
                  </button>
                </div>
                {advances.length > 0 ? (
                  <div className="space-y-3">
                    {advances.map((advance) => (
                      <div key={advance.id} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-semibold text-gray-900">₹{parseFloat(advance.amount).toFixed(2)}</span>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                advance.status === 'approved' ? 'bg-green-100 text-green-800' :
                                advance.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {advance.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{advance.reason}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              Requested: {new Date(advance.requested_at).toLocaleDateString()}
                            </p>
                            {advance.admin_notes && (
                              <p className="text-sm text-gray-700 mt-2 bg-white p-2 rounded border">
                                Admin: {advance.admin_notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">No advance requests</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Advance Request Modal */}
      {showAdvanceForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Request Advance</h3>
            <form onSubmit={handleAdvanceRequest}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <input
                    type="number"
                    value={advanceAmount}
                    onChange={(e) => setAdvanceAmount(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter amount"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                  <textarea
                    value={advanceReason}
                    onChange={(e) => setAdvanceReason(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    rows={3}
                    placeholder="Why do you need this advance?"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAdvanceForm(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Referral Form Modal */}
      {showReferralForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Refer a Rider</h3>
            <form onSubmit={handleReferralSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={referredName}
                    onChange={(e) => setReferredName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter rider's name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={referredPhone}
                    onChange={(e) => setReferredPhone(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter phone number"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Location</label>
                  <input
                    type="text"
                    value={preferredLocation}
                    onChange={(e) => setPreferredLocation(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Where will they work?"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowReferralForm(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                  Submit Referral
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Bank Details Modal */}
      {showEditBankForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Edit Bank & UPI Details</h3>
            <form onSubmit={handleBankDetailsUpdate}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., HDFC Bank"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter account number"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                  <input
                    type="text"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., HDFC0001234"
                    required
                  />
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-xs text-yellow-800">
                    <strong>Note:</strong> After updating, admin will be notified to verify and approve your new bank details.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditBankForm(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  Update Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
