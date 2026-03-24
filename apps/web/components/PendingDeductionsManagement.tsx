'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

interface Deduction {
  id: number;
  cee_id: string;
  entry_type: string;
  amount: string | number;
  description: string;
  entry_date: string;
  status: string;
  created_at: string;
}

interface RiderInfo {
  [key: string]: {
    full_name: string;
    phone: string;
  };
}

export default function PendingDeductionsManagement() {
  const [deductions, setDeductions] = useState<Deduction[]>([]);
  const [filteredDeductions, setFilteredDeductions] = useState<Deduction[]>([]);
  const [loading, setLoading] = useState(true);
  const [riderInfo, setRiderInfo] = useState<RiderInfo>({});
  const [actioningId, setActioningId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    fetchDeductions();
  }, []);

  useEffect(() => {
    filterDeductionsByStatus();
  }, [deductions, filterStatus]);

  const fetchDeductions = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/deductions?includeAll=true');
      const data = await res.json();
      
      if (Array.isArray(data)) {
        setDeductions(data);
        // Fetch rider info for all unique CEE IDs
        const ceeIds = [...new Set(data.map((d: Deduction) => d.cee_id))];
        await fetchRiderInfo(ceeIds);
      }
    } catch (error) {
      console.error('Error fetching deductions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRiderInfo = async (ceeIds: string[]) => {
    try {
      const res = await fetch('/api/riders');
      const data = await res.json();
      
      const riders = data.riders || [];
      const riderMap: RiderInfo = {};
      
      riders.forEach((rider: any) => {
        riderMap[rider.cee_id] = {
          full_name: rider.full_name,
          phone: rider.phone
        };
      });
      
      setRiderInfo(riderMap);
    } catch (error) {
      console.error('Error fetching rider info:', error);
    }
  };

  const filterDeductionsByStatus = () => {
    if (filterStatus === 'all') {
      setFilteredDeductions(deductions);
    } else {
      setFilteredDeductions(deductions.filter(d => d.status === filterStatus));
    }
  };

  const handleApprove = async (id: number) => {
    try {
      setActioningId(id);
      const res = await fetch('/api/deductions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'approved' })
      });

      const data = await res.json();
      console.log('Approve response:', { status: res.status, ok: res.ok, data });
      
      if (res.ok) {
        alert('Deduction approved!');
        fetchDeductions();
      } else {
        console.error('API error:', data);
        alert(data.error || 'Failed to approve deduction');
      }
    } catch (error) {
      console.error('Error approving deduction:', error);
      alert('Error approving deduction: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (id: number) => {
    if (!window.confirm('Are you sure you want to reject this deduction? Parts will be returned to inventory.')) {
      return;
    }

    try {
      setActioningId(id);
      const res = await fetch('/api/deductions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'rejected' })
      });

      const data = await res.json();
      console.log('Reject response:', { status: res.status, ok: res.ok, data });
      
      if (res.ok) {
        alert('Deduction rejected! Parts returned to inventory.');
        fetchDeductions();
      } else {
        console.error('API error:', data);
        alert(data.error || 'Failed to reject deduction');
      }
    } catch (error) {
      console.error('Error rejecting deduction:', error);
      alert('Error rejecting deduction: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setActioningId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const pendingCount = deductions.filter(d => d.status === 'pending').length;
  const approvedCount = deductions.filter(d => d.status === 'approved').length;
  const rejectedCount = deductions.filter(d => d.status === 'rejected').length;

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block">
          <div className="w-8 h-8 border-3 border-gray-300 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
        <p className="mt-4 text-gray-600">Loading deductions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Pending Approval</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{pendingCount}</p>
            </div>
            <Clock className="w-12 h-12 text-yellow-100" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Approved</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{approvedCount}</p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-100" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Rejected</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{rejectedCount}</p>
            </div>
            <XCircle className="w-12 h-12 text-red-100" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filterStatus === status
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Deductions Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Rider</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">CEE ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Type</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Description</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Amount</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredDeductions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <p className="text-gray-500">No deductions found</p>
                  </td>
                </tr>
              ) : (
                filteredDeductions.map((deduction) => {
                  const rider = riderInfo[deduction.cee_id];
                  return (
                    <tr key={deduction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {rider?.full_name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{deduction.cee_id}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 capitalize">
                        {deduction.entry_type.replace(/_/g, ' ')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{deduction.description}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-red-600">
                        -₹{parseFloat(String(deduction.amount)).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(deduction.entry_date).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          timeZone: 'Asia/Kolkata'
                        })}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(deduction.status)}`}>
                          {getStatusIcon(deduction.status)}
                          {deduction.status.charAt(0).toUpperCase() + deduction.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {deduction.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprove(deduction.id)}
                              disabled={actioningId === deduction.id}
                              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition text-xs font-medium disabled:opacity-50"
                            >
                              {actioningId === deduction.id ? 'Processing...' : 'Approve'}
                            </button>
                            <button
                              onClick={() => handleReject(deduction.id)}
                              disabled={actioningId === deduction.id}
                              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition text-xs font-medium disabled:opacity-50"
                            >
                              {actioningId === deduction.id ? 'Processing...' : 'Reject'}
                            </button>
                          </div>
                        )}
                        {deduction.status === 'approved' && (
                          <span className="text-xs font-semibold text-green-600 flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" /> Approved
                          </span>
                        )}
                        {deduction.status === 'rejected' && (
                          <span className="text-xs font-semibold text-red-600 flex items-center gap-1">
                            <XCircle className="w-4 h-4" /> Rejected
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-semibold mb-1">How it works:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>When a technician uses parts, a deduction is created in <strong>pending</strong> status</li>
              <li>Review each deduction and approve or reject</li>
              <li>Approved deductions will be deducted from rider's next payout</li>
              <li>Rejected deductions return parts to inventory and rider is not charged</li>
              <li>Riders receive notifications when status changes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
