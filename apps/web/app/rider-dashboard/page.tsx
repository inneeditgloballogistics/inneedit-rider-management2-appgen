'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, LogOut, Package, TrendingUp, Users, Wallet, AlertCircle, Gift, DollarSign, Download, TrendingDown, Target } from 'lucide-react';
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
  const [payoutDetails, setPayoutDetails] = useState<any>(null);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);

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
        const errorData = await response.json();
        console.error('Session verification error:', errorData.error || errorData);
        setLoading(false);
        setTimeout(() => router.push('/rider-login'), 500);
        return;
      }

      const data = await response.json();
      console.log('Auth successful, rider data:', data);
      setRider(data.rider);
      await fetchAllData(data.rider.user_id);
    } catch (error: any) {
      console.error('Auth check failed:', error.message || error);
      setLoading(false);
      setTimeout(() => router.push('/rider-login'), 500);
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

      // Fetch payouts
      const payoutsRes = await fetch(`/api/payouts?riderId=${riderId}`);
      const payoutsData = await payoutsRes.json();
      setPayouts(payoutsData);
      
      // Set current month's payout (most recent)
      if (payoutsData.length > 0) {
        const currentPayout = payoutsData[0];
        setCurrentPayrollWeek(currentPayout);
        
        // If payout is finalized, set payoutDetails with correct calculation
        if (currentPayout.status === 'finalized') {
          const basePayout = parseFloat(currentPayout.base_payout);
          const netPayout = parseFloat(currentPayout.net_payout);
          const finalAmount = netPayout - basePayout;
          
          setPayoutDetails({
            basePayout: basePayout,
            finalAmount: finalAmount,
            finalPayout: netPayout,
          });
        }
      }

      // Fetch referrals
      const referralsRes = await fetch(`/api/referrals?riderId=${riderId}`);
      const referralsData = await referralsRes.json();
      setReferrals(referralsData);

      // Fetch deductions
      const deductionsRes = await fetch(`/api/deductions?riderId=${riderId}`);
      const deductionsData = await deductionsRes.json();
      setDeductions(deductionsData.deductions);

      // Fetch incentives
      const incentivesRes = await fetch(`/api/incentives?riderId=${riderId}`);
      const incentivesData = await incentivesRes.json();
      setIncentives(incentivesData.incentives);

      // Fetch advances
      const advancesRes = await fetch(`/api/advances?riderId=${riderId}`);
      const advancesData = await advancesRes.json();
      setAdvances(advancesData);
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
      netPayout: parseFloat(currentPayrollWeek.net_payout),
    };
  };

  const pendingReferrals = referrals.filter(r => r.approval_status === 'pending').length;
  const approvedReferrals = referrals.filter(r => r.approval_status === 'approved').length;
  const pendingAdvances = advances.filter(a => a.status === 'pending').length;

  const handleWeekChange = async (week: number) => {
    setSelectedWeek(week);
    // Find payout for selected week
    const weekPayout = payouts.find(
      (p) => p.week_number === week && p.month === new Date().getMonth() + 1 && p.year === new Date().getFullYear()
    ) || currentPayrollWeek;
    if (weekPayout) {
      setCurrentPayrollWeek(weekPayout);
      // If payout is finalized, use the net_payout directly from the payout record
      if (weekPayout.status === 'finalized') {
        const basePayout = parseFloat(weekPayout.base_payout);
        const netPayout = parseFloat(weekPayout.net_payout);
        const finalAmount = netPayout - basePayout;
        
        setPayoutDetails({
          basePayout: basePayout,
          finalAmount: finalAmount,
          finalPayout: netPayout,
        });
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
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
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* SECTION 1: Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Orders</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {orderStats?.total_orders || 0}
                </p>
              </div>
              <Package className="w-12 h-12 text-blue-100" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Earnings</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  ₹{parseFloat(orderStats?.total_payout || '0').toFixed(0)}
                </p>
              </div>
              <Wallet className="w-12 h-12 text-green-100" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Active Referrals</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">
                  {approvedReferrals}
                </p>
                <p className="text-xs text-gray-500 mt-1">{pendingReferrals} pending</p>
              </div>
              <Users className="w-12 h-12 text-purple-100" />
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

              {/* Earnings Breakdown */}
              <div className="mb-8 pb-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Earnings Breakdown</h3>
                <div className="space-y-3">
                  {/* Base Payout */}
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-200 rounded-lg flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Base Payout</p>
                        <p className="text-xs text-gray-600">Orders: {currentPayrollWeek.orders_count}</p>
                      </div>
                    </div>
                    <p className="text-lg font-bold text-gray-900">₹{stats.basePayout.toFixed(2)}</p>
                  </div>

                  {/* Incentives */}
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-200 rounded-lg flex items-center justify-center">
                        <Gift className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Total Incentives</p>
                        <p className="text-xs text-gray-600">Referrals, Bonuses, etc</p>
                      </div>
                    </div>
                    <p className="text-lg font-bold text-green-600">+₹{stats.totalIncentives.toFixed(2)}</p>
                  </div>

                  {/* Deductions */}
                  <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-200 rounded-lg flex items-center justify-center">
                        <TrendingDown className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Total Deductions</p>
                        <p className="text-xs text-gray-600">Damages, Advances, etc</p>
                      </div>
                    </div>
                    <p className="text-lg font-bold text-red-600">-₹{stats.totalDeductions.toFixed(2)}</p>
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

                    {/* All Additions */}
                    <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-sm font-semibold text-green-700 mb-3">All Additions (Week {currentPayrollWeek?.week_number})</p>
                      <p className="text-2xl font-bold text-green-600">₹{Math.max(0, payoutDetails.finalAmount + (stats?.totalDeductions || 0)).toFixed(2)}</p>
                      <p className="text-xs text-gray-600 mt-1">Referrals + Incentives</p>
                    </div>

                    {/* All Deductions */}
                    <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-sm font-semibold text-red-700 mb-3">All Deductions (Week {currentPayrollWeek?.week_number})</p>
                      <p className="text-2xl font-bold text-red-600">₹{(stats?.totalDeductions || 0).toFixed(2)}</p>
                      <p className="text-xs text-gray-600 mt-1">Advances + Other Deductions</p>
                    </div>

                    {/* Vehicle Rent */}
                    <div className="mb-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <p className="text-sm font-semibold text-orange-700 mb-3">Vehicle Rent (Week {currentPayrollWeek?.week_number})</p>
                      <p className="text-2xl font-bold text-orange-600">₹0.00</p>
                      <p className="text-xs text-gray-600 mt-1">Already deducted in total deductions</p>
                    </div>

                    {/* Final Amount Calculation */}
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm font-semibold text-blue-700 mb-4">Final Amount Calculation</p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-700">All Additions</span>
                          <span className="font-medium text-green-600">+₹{Math.max(0, payoutDetails.finalAmount + (stats?.totalDeductions || 0)).toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-700">All Deductions</span>
                          <span className="font-medium text-red-600">-₹{(stats?.totalDeductions || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-700">Vehicle Rent</span>
                          <span className="font-medium text-orange-600">-₹0.00</span>
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
                    <p className="text-xs font-semibold text-green-700 mb-4 uppercase tracking-wide">Final Payout Calculation</p>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Base Amount</span>
                        <span className="text-sm font-semibold text-gray-900">₹{payoutDetails.basePayout.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Final Amount</span>
                        <span className={`text-sm font-semibold ${payoutDetails.finalAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {payoutDetails.finalAmount >= 0 ? '+' : ''}₹{payoutDetails.finalAmount.toFixed(2)}
                        </span>
                      </div>
                      <div className="border-t-2 border-green-400 pt-3 flex items-center justify-between">
                        <span className="font-bold text-gray-900">= FINAL PAYOUT</span>
                        <span className="text-2xl font-bold text-green-600">₹{payoutDetails.finalPayout.toFixed(2)}</span>
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
                  <p className="text-xs text-gray-600 font-medium">This Month Payout</p>
                  <p className="text-sm font-semibold text-indigo-600 mt-1">₹{stats?.netPayout.toFixed(2) || '0.00'}</p>
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
      </div>

      {/* Modals */}
      {rider && (
        <>
          <RequestAdvanceModal
            isOpen={showAdvanceModal}
            onClose={() => setShowAdvanceModal(false)}
            rider={rider}
            onSuccess={() => fetchAllData(rider.user_id)}
          />
          <ReferRiderModal
            isOpen={showReferralModal}
            onClose={() => setShowReferralModal(false)}
            rider={rider}
            onSuccess={() => fetchAllData(rider.user_id)}
          />
        </>
      )}
    </div>
  );
}
