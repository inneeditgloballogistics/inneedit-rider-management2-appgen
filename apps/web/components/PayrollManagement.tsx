'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, Download, CheckCircle, Clock, DollarSign, Users, TrendingUp, Filter } from 'lucide-react';

interface Payout {
  id: number;
  rider_id: string;
  full_name: string;
  cee_id: string;
  week_number: number;
  week_period: string;
  month: number;
  year: number;
  orders_count: number;
  base_payout: number;
  total_incentives: number;
  total_deductions: number;
  net_payout: number;
  status: 'pending' | 'approved' | 'paid';
  payment_date: string;
  created_at: string;
}

export default function PayrollManagement() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [filteredPayouts, setFilteredPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'paid'>('all');
  const [selectedPayouts, setSelectedPayouts] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState<number[]>([]);

  // Stats
  const [stats, setStats] = useState({
    totalPayouts: 0,
    pendingAmount: 0,
    approvedAmount: 0,
    paidAmount: 0,
    totalRiders: 0
  });

  useEffect(() => {
    fetchPayrolls();
  }, [activeTab]);

  const fetchPayrolls = async () => {
    try {
      setLoading(true);
      let url = '/api/payroll';
      if (activeTab === 'pending') url += '?action=pending';
      else if (activeTab !== 'all') url += `?status=${activeTab}`;

      const response = await fetch(url);
      const data = await response.json();
      
      setPayouts(data);
      filterPayouts(data, searchTerm);
      calculateStats(data);
    } catch (error) {
      console.error('Error fetching payrolls:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPayouts = (data: Payout[], search: string) => {
    let filtered = data;
    
    if (search.trim()) {
      filtered = data.filter(p => 
        p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        p.cee_id?.toLowerCase().includes(search.toLowerCase()) ||
        p.rider_id?.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFilteredPayouts(filtered);
  };

  const calculateStats = (data: Payout[]) => {
    const stats = {
      totalPayouts: data.length,
      pendingAmount: data
        .filter(p => p.status === 'pending')
        .reduce((sum, p) => sum + p.net_payout, 0),
      approvedAmount: data
        .filter(p => p.status === 'approved')
        .reduce((sum, p) => sum + p.net_payout, 0),
      paidAmount: data
        .filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + p.net_payout, 0),
      totalRiders: new Set(data.map(p => p.rider_id)).size
    };
    setStats(stats);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    filterPayouts(payouts, value);
  };

  const toggleSelectAll = () => {
    if (selectedPayouts.length === filteredPayouts.length) {
      setSelectedPayouts([]);
    } else {
      setSelectedPayouts(filteredPayouts.map(p => p.id));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedPayouts(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleExpand = (id: number) => {
    setExpandedRows(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const approvePayout = async (id: number) => {
    try {
      setActionLoading(true);
      const response = await fetch('/api/payroll', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', data: { id } })
      });
      if (response.ok) {
        fetchPayrolls();
      }
    } catch (error) {
      console.error('Error approving payout:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const bulkApprove = async () => {
    try {
      setActionLoading(true);
      const response = await fetch('/api/payroll', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'bulk_approve', data: { ids: selectedPayouts } })
      });
      if (response.ok) {
        setSelectedPayouts([]);
        fetchPayrolls();
      }
    } catch (error) {
      console.error('Error bulk approving:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const markAsPaid = async (id: number) => {
    try {
      setActionLoading(true);
      const response = await fetch('/api/payroll', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_paid', data: { id } })
      });
      if (response.ok) {
        fetchPayrolls();
      }
    } catch (error) {
      console.error('Error marking as paid:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const bulkMarkPaid = async () => {
    try {
      setActionLoading(true);
      const response = await fetch('/api/payroll', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'bulk_mark_paid', data: { ids: selectedPayouts } })
      });
      if (response.ok) {
        setSelectedPayouts([]);
        fetchPayrolls();
      }
    } catch (error) {
      console.error('Error bulk marking as paid:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const exportCSV = () => {
    const headers = ['Rider Name', 'CEE ID', 'Orders', 'Base Payout', 'Incentives', 'Deductions', 'Net Payout', 'Status', 'Week', 'Date'];
    const rows = filteredPayouts.map(p => [
      p.full_name,
      p.cee_id,
      p.orders_count,
      p.base_payout.toFixed(2),
      p.total_incentives.toFixed(2),
      p.total_deductions.toFixed(2),
      p.net_payout.toFixed(2),
      p.status,
      p.week_period,
      new Date(p.created_at).toLocaleDateString()
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payroll-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'paid': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payroll Management</h1>
        <p className="text-gray-600">Manage rider payouts and salary processing</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Payouts</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalPayouts}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">₹{stats.pendingAmount.toFixed(0)}</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Approved</p>
              <p className="text-2xl font-bold text-blue-600">₹{stats.approvedAmount.toFixed(0)}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Paid</p>
              <p className="text-2xl font-bold text-green-600">₹{stats.paidAmount.toFixed(0)}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Riders</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalRiders}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow mb-8 p-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <input
              type="text"
              placeholder="Search by rider name, CEE ID..."
              value={searchTerm}
              onChange={handleSearch}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-gray-200">
            {(['all', 'pending', 'approved', 'paid'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 font-medium transition capitalize ${
                  activeTab === tab
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Bulk Actions */}
          {selectedPayouts.length > 0 && (
            <div className="flex gap-2 items-center bg-blue-50 p-4 rounded-lg">
              <span className="text-sm font-medium text-gray-700">
                {selectedPayouts.length} selected
              </span>
              <button
                onClick={bulkApprove}
                disabled={actionLoading}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition"
              >
                Approve Selected
              </button>
              <button
                onClick={bulkMarkPaid}
                disabled={actionLoading}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition"
              >
                Mark as Paid
              </button>
              <button
                onClick={() => setSelectedPayouts([])}
                className="px-3 py-1 text-sm text-gray-700 hover:text-gray-900"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading payroll data...</div>
        ) : filteredPayouts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No payroll records found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedPayouts.length === filteredPayouts.length && filteredPayouts.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Rider</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">CEE ID</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Period</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Orders</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Net Payout</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayouts.map((payout) => (
                  <div key={payout.id}>
                    <tr className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedPayouts.includes(payout.id)}
                          onChange={() => toggleSelect(payout.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{payout.full_name}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{payout.cee_id}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        Week {payout.week_number} • {payout.week_period}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{payout.orders_count}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">
                        ₹{payout.net_payout.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(payout.status)}`}>
                          {payout.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleExpand(payout.id)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <ChevronDown
                              className={`w-4 h-4 transition ${expandedRows.includes(payout.id) ? 'rotate-180' : ''}`}
                            />
                          </button>
                          {payout.status === 'pending' && (
                            <button
                              onClick={() => approvePayout(payout.id)}
                              disabled={actionLoading}
                              className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                              Approve
                            </button>
                          )}
                          {payout.status === 'approved' && (
                            <button
                              onClick={() => markAsPaid(payout.id)}
                              disabled={actionLoading}
                              className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                            >
                              Paid
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedRows.includes(payout.id) && (
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <td colSpan={8} className="px-6 py-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-xs text-gray-600 font-medium">Base Payout</p>
                              <p className="text-lg font-semibold text-gray-900">₹{payout.base_payout.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 font-medium">Incentives</p>
                              <p className="text-lg font-semibold text-green-600">+₹{payout.total_incentives.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 font-medium">Deductions</p>
                              <p className="text-lg font-semibold text-red-600">-₹{payout.total_deductions.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 font-medium">Payment Date</p>
                              <p className="text-lg font-semibold text-gray-900">
                                {payout.payment_date ? new Date(payout.payment_date).toLocaleDateString() : 'Pending'}
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </div>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
