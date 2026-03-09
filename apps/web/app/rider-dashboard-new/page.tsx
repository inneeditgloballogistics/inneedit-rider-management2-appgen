'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, LogOut, Package, TrendingUp, Users, Wallet, AlertCircle, Gift, DollarSign, Download, TrendingDown, Target } from 'lucide-react';
import WeatherBadge from '@/components/WeatherBadge';
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

export default function RiderDashboardNew() {
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
  const [downloadingPayslip, setDownloadingPayslip] = useState(false);

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

      // Fetch payouts
      const payoutsRes = await fetch(`/api/payouts?riderId=${riderId}`);
      const payoutsData = await payoutsRes.json();
      setPayouts(payoutsData);
      
      // Set current month's payout (most recent)
      if (payoutsData.length > 0) {
        setCurrentPayrollWeek(payoutsData[0]);
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
          <div className="flex items-center gap-4">\n            {rider.latitude && rider.longitude && (\n              <WeatherBadge\n                latitude={rider.latitude}\n                longitude={rider.longitude}\n                locationName={rider.city || 'Your Location'}\n              />\n            )}\n            <div className=\"text-right hidden sm:block\">\n              <p className=\"text-sm font-medium text-gray-900\">{rider.full_name}</p>\n              <p className=\"text-xs text-gray-500\">{rider.client || 'Rider'}</p>\n            </div>\n            <button\n              onClick={handleLogout}\n              className=\"p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition\"\n            >\n              <LogOut className=\"w-5 h-5\" />\n            </button>\n          </div>\n        </div>\n      </header>\n\n      {/* Main Content */}\n      <div className=\"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8\">\n        {/* SECTION 1: Quick Stats */}\n        <div className=\"grid grid-cols-1 md:grid-cols-4 gap-4 mb-8\">\n          <div className=\"bg-white p-6 rounded-lg shadow-sm border border-gray-200\">\n            <div className=\"flex items-center justify-between\">\n              <div>\n                <p className=\"text-sm text-gray-600 font-medium\">Total Orders</p>\n                <p className=\"text-3xl font-bold text-gray-900 mt-2\">\n                  {orderStats?.total_orders || 0}\n                </p>\n              </div>\n              <Package className=\"w-12 h-12 text-blue-100\" />\n            </div>\n          </div>\n\n          <div className=\"bg-white p-6 rounded-lg shadow-sm border border-gray-200\">\n            <div className=\"flex items-center justify-between\">\n              <div>\n                <p className=\"text-sm text-gray-600 font-medium\">Total Earnings</p>\n                <p className=\"text-3xl font-bold text-green-600 mt-2\">\n                  ₹{parseFloat(orderStats?.total_payout || '0').toFixed(0)}\n                </p>\n              </div>\n              <Wallet className=\"w-12 h-12 text-green-100\" />\n            </div>\n          </div>\n\n          <div className=\"bg-white p-6 rounded-lg shadow-sm border border-gray-200\">\n            <div className=\"flex items-center justify-between\">\n              <div>\n                <p className=\"text-sm text-gray-600 font-medium\">Active Referrals</p>\n                <p className=\"text-3xl font-bold text-purple-600 mt-2\">\n                  {approvedReferrals}\n                </p>\n                <p className=\"text-xs text-gray-500 mt-1\">{pendingReferrals} pending</p>\n              </div>\n              <Users className=\"w-12 h-12 text-purple-100\" />\n            </div>\n          </div>\n\n          <div className=\"bg-white p-6 rounded-lg shadow-sm border border-gray-200\">\n            <div className=\"flex items-center justify-between\">\n              <div>\n                <p className=\"text-sm text-gray-600 font-medium\">Pending Advances</p>\n                <p className=\"text-3xl font-bold text-orange-600 mt-2\">\n                  {pendingAdvances}\n                </p>\n              </div>\n              <TrendingUp className=\"w-12 h-12 text-orange-100\" />\n            </div>\n          </div>\n        </div>\n\n        {/* SECTION 2: Payroll Overview - Main Card */}\n        {stats && currentPayrollWeek && (\n          <div className=\"bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8\">\n            {/* Payslip Header */}\n            <div className=\"bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white\">\n              <div className=\"flex items-center justify-between\">\n                <div>\n                  <h2 className=\"text-2xl font-bold\">Payroll Summary</h2>\n                  <p className=\"text-indigo-100 text-sm mt-1\">\n                    {new Date(currentPayrollWeek.month + '-01-' + currentPayrollWeek.year).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}\n                  </p>\n                </div>\n                <button\n                  onClick={downloadPayslip}\n                  disabled={downloadingPayslip}\n                  className=\"flex items-center gap-2 bg-white text-indigo-600 px-4 py-2 rounded-lg font-medium hover:bg-indigo-50 transition disabled:opacity-50\"\n                >\n                  <Download className=\"w-4 h-4\" />\n                  {downloadingPayslip ? 'Generating...' : 'Download Payslip'}\n                </button>\n              </div>\n            </div>\n\n            {/* Payslip Content */}\n            <div id=\"payslip-content\" className=\"p-8\">\n              {/* Rider Details */}\n              <div className=\"mb-8 pb-6 border-b border-gray-200\">\n                <h3 className=\"text-lg font-semibold text-gray-900 mb-4\">Rider Information</h3>\n                <div className=\"grid grid-cols-2 md:grid-cols-4 gap-4\">\n                  <div>\n                    <p className=\"text-xs text-gray-600 font-medium mb-1\">Name</p>\n                    <p className=\"text-sm font-semibold text-gray-900\">{rider.full_name}</p>\n                  </div>\n                  <div>\n                    <p className=\"text-xs text-gray-600 font-medium mb-1\">CEE ID</p>\n                    <p className=\"text-sm font-semibold text-gray-900\">{rider.ceeId}</p>\n                  </div>\n                  <div>\n                    <p className=\"text-xs text-gray-600 font-medium mb-1\">Phone</p>\n                    <p className=\"text-sm font-semibold text-gray-900\">{rider.phone}</p>\n                  </div>\n                  <div>\n                    <p className=\"text-xs text-gray-600 font-medium mb-1\">Vehicle Type</p>\n                    <p className=\"text-sm font-semibold text-gray-900\">{rider.vehicle_type || 'N/A'}</p>\n                  </div>\n                </div>\n              </div>\n\n              {/* Earnings Breakdown */}\n              <div className=\"mb-8 pb-6 border-b border-gray-200\">\n                <h3 className=\"text-lg font-semibold text-gray-900 mb-6\">Earnings Breakdown</h3>\n                <div className=\"space-y-3\">\n                  {/* Base Payout */}\n                  <div className=\"flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200\">\n                    <div className=\"flex items-center gap-3\">\n                      <div className=\"w-10 h-10 bg-blue-200 rounded-lg flex items-center justify-center\">\n                        <DollarSign className=\"w-5 h-5 text-blue-600\" />\n                      </div>\n                      <div>\n                        <p className=\"text-sm font-medium text-gray-900\">Base Payout</p>\n                        <p className=\"text-xs text-gray-600\">Orders: {currentPayrollWeek.orders_count}</p>\n                      </div>\n                    </div>\n                    <p className=\"text-lg font-bold text-gray-900\">₹{stats.basePayout.toFixed(2)}</p>\n                  </div>\n\n                  {/* Incentives */}\n                  <div className=\"flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200\">\n                    <div className=\"flex items-center gap-3\">\n                      <div className=\"w-10 h-10 bg-green-200 rounded-lg flex items-center justify-center\">\n                        <Gift className=\"w-5 h-5 text-green-600\" />\n                      </div>\n                      <div>\n                        <p className=\"text-sm font-medium text-gray-900\">Total Incentives</p>\n                        <p className=\"text-xs text-gray-600\">Referrals, Bonuses, etc</p>\n                      </div>\n                    </div>\n                    <p className=\"text-lg font-bold text-green-600\">+₹{stats.totalIncentives.toFixed(2)}</p>\n                  </div>\n\n                  {/* Deductions */}\n                  <div className=\"flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200\">\n                    <div className=\"flex items-center gap-3\">\n                      <div className=\"w-10 h-10 bg-red-200 rounded-lg flex items-center justify-center\">\n                        <TrendingDown className=\"w-5 h-5 text-red-600\" />\n                      </div>\n                      <div>\n                        <p className=\"text-sm font-medium text-gray-900\">Total Deductions</p>\n                        <p className=\"text-xs text-gray-600\">Damages, Advances, etc</p>\n                      </div>\n                    </div>\n                    <p className=\"text-lg font-bold text-red-600\">-₹{stats.totalDeductions.toFixed(2)}</p>\n                  </div>\n                </div>\n              </div>\n\n              {/* Final Amount Calculation */}\n              <div className=\"bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-lg border border-indigo-200\">\n                <div className=\"space-y-2 mb-4\">\n                  <div className=\"flex items-center justify-between\">\n                    <span className=\"text-sm text-gray-700\">Base Payout</span>\n                    <span className=\"text-sm font-medium text-gray-900\">₹{stats.basePayout.toFixed(2)}</span>\n                  </div>\n                  <div className=\"flex items-center justify-between\">\n                    <span className=\"text-sm text-gray-700\">+ Incentives</span>\n                    <span className=\"text-sm font-medium text-green-600\">₹{stats.totalIncentives.toFixed(2)}</span>\n                  </div>\n                  <div className=\"flex items-center justify-between\">\n                    <span className=\"text-sm text-gray-700\">- Deductions</span>\n                    <span className=\"text-sm font-medium text-red-600\">₹{stats.totalDeductions.toFixed(2)}</span>\n                  </div>\n                </div>\n                <div className=\"border-t border-indigo-300 pt-4 flex items-center justify-between\">\n                  <span className=\"text-base font-bold text-gray-900\">=</span>\n                  <div className=\"text-right\">\n                    <p className=\"text-xs text-gray-600 mb-1\">FINAL AMOUNT DUE</p>\n                    <p className=\"text-3xl font-bold text-indigo-600\">₹{stats.netPayout.toFixed(2)}</p>\n                  </div>\n                </div>\n                {currentPayrollWeek.payment_date && (\n                  <p className=\"text-xs text-gray-600 mt-3 pt-3 border-t border-indigo-300\">\n                    Paid on: {new Date(currentPayrollWeek.payment_date).toLocaleDateString()}\n                  </p>\n                )}\n              </div>\n            </div>\n          </div>\n        )}\n\n        {/* SECTION 3: Two Column Layout */}\n        <div className=\"grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8\">\n          {/* Left: Recent Transactions */}\n          <div className=\"lg:col-span-2 space-y-6\">\n            {/* Referrals */}\n            <div className=\"bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden\">\n              <div className=\"p-6 border-b border-gray-200\">\n                <h3 className=\"text-lg font-semibold text-gray-900\">My Referrals</h3>\n                <p className=\"text-sm text-gray-600 mt-1\">{referrals.length} referral{referrals.length !== 1 ? 's' : ''} submitted</p>\n              </div>\n              <div className=\"divide-y\">\n                {referrals.length > 0 ? (\n                  referrals.slice(0, 5).map((referral) => (\n                    <div key={referral.id} className=\"p-4 hover:bg-gray-50\">\n                      <div className=\"flex items-start justify-between\">\n                        <div className=\"flex-1\">\n                          <p className=\"font-medium text-gray-900\">{referral.referred_name}</p>\n                          <p className=\"text-sm text-gray-600 mt-1\">{referral.referred_phone}</p>\n                          <div className=\"flex items-center gap-2 mt-2\">\n                            <span className={`text-xs px-2 py-1 rounded-full ${\n                              referral.approval_status === 'approved' ? 'bg-green-100 text-green-800' :\n                              referral.approval_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :\n                              'bg-red-100 text-red-800'\n                            }`}>\n                              {referral.approval_status === 'approved' ? '✓ Approved' : \n                               referral.approval_status === 'pending' ? 'Pending' : 'Rejected'}\n                            </span>\n                            {referral.approval_status === 'approved' && referral.amount && (\n                              <span className=\"text-xs font-medium text-green-600\">₹{referral.amount}</span>\n                            )}\n                          </div>\n                        </div>\n                      </div>\n                    </div>\n                  ))\n                ) : (\n                  <div className=\"p-6 text-center text-gray-500\">\n                    No referrals yet. Start referring to earn bonus!\n                  </div>\n                )}\n              </div>\n            </div>\n\n            {/* Incentives */}\n            <div className=\"bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden\">\n              <div className=\"p-6 border-b border-gray-200\">\n                <h3 className=\"text-lg font-semibold text-gray-900\">Recent Incentives</h3>\n                <p className=\"text-sm text-gray-600 mt-1\">Total: ₹{incentives.reduce((sum, i) => sum + parseFloat(i.amount || '0'), 0).toFixed(2)}</p>\n              </div>\n              <div className=\"divide-y\">\n                {incentives.length > 0 ? (\n                  incentives.slice(0, 5).map((incentive) => (\n                    <div key={incentive.id} className=\"p-4 hover:bg-gray-50 flex items-center justify-between\">\n                      <div>\n                        <p className=\"font-medium text-gray-900 capitalize\">{incentive.incentive_type}</p>\n                        <p className=\"text-xs text-gray-600 mt-1\">{new Date(incentive.incentive_date).toLocaleDateString()}</p>\n                      </div>\n                      <p className=\"font-semibold text-green-600\">+₹{parseFloat(incentive.amount || '0').toFixed(2)}</p>\n                    </div>\n                  ))\n                ) : (\n                  <div className=\"p-6 text-center text-gray-500\">\n                    No incentives yet\n                  </div>\n                )}\n              </div>\n            </div>\n          </div>\n\n          {/* Right: Quick Actions & Status */}\n          <div className=\"space-y-6\">\n            {/* Quick Actions */}\n            <div className=\"bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-sm p-6 text-white\">\n              <h3 className=\"text-lg font-semibold mb-4\">Quick Actions</h3>\n              <div className=\"space-y-3\">\n                <button\n                  onClick={() => router.push('/rider-dashboard?tab=advances')}\n                  className=\"w-full bg-white text-indigo-600 px-4 py-3 rounded-lg font-medium hover:bg-gray-100 transition flex items-center justify-center gap-2\"\n                >\n                  <TrendingUp className=\"w-4 h-4\" />\n                  Request Advance\n                </button>\n                <button\n                  onClick={() => router.push('/rider-dashboard?tab=referrals')}\n                  className=\"w-full bg-white text-indigo-600 px-4 py-3 rounded-lg font-medium hover:bg-gray-100 transition flex items-center justify-center gap-2\"\n                >\n                  <Users className=\"w-4 h-4\" />\n                  Refer a Rider\n                </button>\n              </div>\n            </div>\n\n            {/* Status Cards */}\n            <div className=\"bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden\">\n              <div className=\"p-6 border-b border-gray-200\">\n                <h3 className=\"font-semibold text-gray-900\">Status & Info</h3>\n              </div>\n              <div className=\"divide-y\">\n                <div className=\"p-4\">\n                  <p className=\"text-xs text-gray-600 font-medium\">Account Status</p>\n                  <p className=\"text-sm font-semibold text-gray-900 mt-1 capitalize flex items-center gap-2\">\n                    <span className=\"w-2 h-2 bg-green-500 rounded-full\"></span>\n                    {rider.status}\n                  </p>\n                </div>\n                <div className=\"p-4\">\n                  <p className=\"text-xs text-gray-600 font-medium\">Bank Account</p>\n                  <p className=\"text-sm font-semibold text-gray-900 mt-1\">\n                    {rider.bank_name ? rider.account_number ? '••••' + rider.account_number.slice(-4) : 'Added' : 'Not Added'}\n                  </p>\n                </div>\n                <div className=\"p-4\">\n                  <p className=\"text-xs text-gray-600 font-medium\">This Month Payout</p>\n                  <p className=\"text-sm font-semibold text-indigo-600 mt-1\">₹{stats?.netPayout.toFixed(2) || '0.00'}</p>\n                </div>\n              </div>\n            </div>\n\n            {/* Deductions Summary */}\n            <div className=\"bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden\">\n              <div className=\"p-6 border-b border-gray-200\">\n                <h3 className=\"font-semibold text-gray-900\">Active Deductions</h3>\n              </div>\n              <div className=\"p-4\">\n                {deductions.length > 0 ? (\n                  <div className=\"space-y-2\">\n                    {deductions.slice(0, 3).map((ded) => (\n                      <div key={ded.id} className=\"flex items-center justify-between text-sm\">\n                        <span className=\"text-gray-600 capitalize\">{ded.deduction_type}</span>\n                        <span className=\"font-semibold text-red-600\">-₹{parseFloat(ded.amount).toFixed(2)}</span>\n                      </div>\n                    ))}\n                  </div>\n                ) : (\n                  <p className=\"text-sm text-gray-500\">No active deductions</p>\n                )}\n              </div>\n            </div>\n          </div>\n        </div>\n\n        {/* SECTION 4: Earnings Trend */}\n        {payouts.length > 1 && (\n          <div className=\"bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden\">\n            <div className=\"p-6 border-b border-gray-200\">\n              <h3 className=\"text-lg font-semibold text-gray-900\">Payroll History</h3>\n              <p className=\"text-sm text-gray-600 mt-1\">Last 6 months</p>\n            </div>\n            <div className=\"overflow-x-auto\">\n              <table className=\"w-full\">\n                <thead className=\"bg-gray-50 border-b border-gray-200\">\n                  <tr>\n                    <th className=\"px-6 py-4 text-left text-sm font-medium text-gray-600\">Period</th>\n                    <th className=\"px-6 py-4 text-left text-sm font-medium text-gray-600\">Orders</th>\n                    <th className=\"px-6 py-4 text-left text-sm font-medium text-gray-600\">Base</th>\n                    <th className=\"px-6 py-4 text-left text-sm font-medium text-gray-600\">Incentives</th>\n                    <th className=\"px-6 py-4 text-left text-sm font-medium text-gray-600\">Deductions</th>\n                    <th className=\"px-6 py-4 text-left text-sm font-medium text-gray-600\">Net Payout</th>\n                    <th className=\"px-6 py-4 text-left text-sm font-medium text-gray-600\">Status</th>\n                  </tr>\n                </thead>\n                <tbody className=\"divide-y\">\n                  {payouts.slice(0, 6).map((payout) => (\n                    <tr key={payout.id} className=\"hover:bg-gray-50\">\n                      <td className=\"px-6 py-4 text-sm font-medium text-gray-900\">{payout.month}/{payout.year}</td>\n                      <td className=\"px-6 py-4 text-sm text-gray-600\">{payout.orders_count}</td>\n                      <td className=\"px-6 py-4 text-sm text-gray-900\">₹{parseFloat(payout.base_payout).toFixed(0)}</td>\n                      <td className=\"px-6 py-4 text-sm text-green-600 font-medium\">+₹{parseFloat(payout.total_incentives).toFixed(0)}</td>\n                      <td className=\"px-6 py-4 text-sm text-red-600 font-medium\">-₹{parseFloat(payout.total_deductions).toFixed(0)}</td>\n                      <td className=\"px-6 py-4 text-sm font-semibold text-indigo-600\">₹{parseFloat(payout.net_payout).toFixed(0)}</td>\n                      <td className=\"px-6 py-4\">\n                        <span className={`text-xs px-2 py-1 rounded-full ${\n                          payout.status === 'paid' ? 'bg-green-100 text-green-800' :\n                          payout.status === 'processed' ? 'bg-blue-100 text-blue-800' :\n                          'bg-yellow-100 text-yellow-800'\n                        }`}>\n                          {payout.status}\n                        </span>\n                      </td>\n                    </tr>\n                  ))}\n                </tbody>\n              </table>\n            </div>\n          </div>\n        )}\n      </div>\n    </div>\n  );\n}\n