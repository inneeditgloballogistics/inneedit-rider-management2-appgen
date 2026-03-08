'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface PayrollEntry {
  id: number;
  rider_id: string;
  rider_name: string;
  entry_type: string;
  amount: number;
  description: string;
  status: string;
  created_at: string;
  entry_date: string;
  reason?: string;
  admin_notes?: string;
  referred_name?: string;
  referred_phone?: string;
}

interface Rider {
  id: number;
  rider_id: string;
  cee_id?: string;
  rider_name: string;
  full_name?: string;
  phone: string;
  vehicle_ownership?: string;
  vehicle_type?: string;
  vehicle_number?: string;
}

export default function PayrollEntries() {
  const router = useRouter();
  const [entries, setEntries] = useState<PayrollEntry[]>([]);
  const [ridersList, setRidersList] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRider, setSelectedRider] = useState<Rider | null>(null);
  const [riderDetails, setRiderDetails] = useState<PayrollEntry[]>([]);
  const [riderDetailsLoading, setRiderDetailsLoading] = useState(false);

  useEffect(() => {
    if (selectedWeek) {
      fetchRidersList();
    }
  }, [selectedYear, selectedMonth, selectedWeek]);

  const getWeekDateRange = (week: number, month: number, year: number) => {
    let startDate, endDate;
    
    if (week === 1) {
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month - 1, 7);
    } else if (week === 2) {
      startDate = new Date(year, month - 1, 8);
      endDate = new Date(year, month - 1, 14);
    } else if (week === 3) {
      startDate = new Date(year, month - 1, 15);
      endDate = new Date(year, month - 1, 21);
    } else if (week === 4) {
      startDate = new Date(year, month - 1, 22);
      endDate = new Date(year, month + 1, 0); // Last day of month
    }
    
    return { startDate, endDate };
  };

  const fetchRidersList = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getWeekDateRange(selectedWeek, selectedMonth, selectedYear);
      
      const response = await fetch('/api/payroll/riders/filter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'active'
        })
      });

      const data = await response.json();
      setRidersList(data.riders || []);
    } catch (error) {
      console.error('Error fetching riders:', error);
      setRidersList([]);
    }
    setLoading(false);
  };

  const fetchRiderDetails = async (riderId: string) => {
    setRiderDetailsLoading(true);
    try {
      const response = await fetch('/api/payroll/rider-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rider_id: riderId })
      });

      const data = await response.json();
      setRiderDetails(data.entries || []);
    } catch (error) {
      console.error('Error fetching rider details:', error);
      setRiderDetails([]);
    }
    setRiderDetailsLoading(false);
  };

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  const months = Array.from({ length: 12 }, (_, i) => ({ num: i + 1, name: new Date(2024, i, 1).toLocaleString('default', { month: 'long' }) }));

  const weeks = [
    { id: 1, label: 'Week 1 (1st - 7th)' },
    { id: 2, label: 'Week 2 (8th - 14th)' },
    { id: 3, label: 'Week 3 (15th - 21st)' },
    { id: 4, label: 'Week 4 (22nd - Month End)' }
  ];

  const entryTypes = [
    { value: 'all', label: 'All Entries' },
    { value: 'referral', label: 'Referrals' },
    { value: 'incentive', label: 'Incentives' },
    { value: 'advance', label: 'Advances' },
    { value: 'security_deposit', label: 'Security Deposit' },
    { value: 'damage', label: 'Damage' },
    { value: 'challan', label: 'Challan' }
  ];

  const handleRiderClick = (rider: Rider) => {
    setSelectedRider(rider);
    fetchRiderDetails(rider.rider_id);
  };

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'referral': return 'bg-blue-100 text-blue-700';
      case 'incentive': return 'bg-green-100 text-green-700';
      case 'advance': return 'bg-purple-100 text-purple-700';
      case 'security_deposit': return 'bg-orange-100 text-orange-700';
      case 'damage': return 'bg-red-100 text-red-700';
      case 'challan': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="mesh-bg text-slate-800 antialiased min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10">
              <img src="https://app-cdn.appgen.com/c8d1da7a-8da9-4a1f-8aaa-2cb65f828731/assets/uploaded_1772434426357_uwdii.png" alt="inneedit" className="h-full w-auto" />
            </div>
            <div>
              <h1 className="font-display font-bold text-sm leading-none text-slate-900">inneedit</h1>
              <span className="text-xs font-medium text-slate-500">Payroll Entries</span>
            </div>
          </div>
          <button 
            onClick={() => router.push('/admin-dashboard')}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
          >
            <i className="ph-bold ph-arrow-left"></i>
            Back
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-[100px] pb-12 px-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="font-display text-2xl font-bold text-slate-900 mb-6">Payroll Entries by Week</h2>

            {/* Filters Section */}
            <div className="space-y-4">
              {/* Date Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Year</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
                  >
                    {years.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Month</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
                  >
                    {months.map(month => (
                      <option key={month.num} value={month.num}>{month.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Week Selection */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-3">Select Week</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                  {weeks.map(week => (
                    <button
                      key={week.id}
                      onClick={() => setSelectedWeek(week.id)}
                      className={`px-4 py-3 rounded-lg font-medium text-sm transition-all border ${
                        selectedWeek === week.id
                          ? 'bg-brand-600 text-white border-brand-600'
                          : 'bg-white text-slate-700 border-slate-300 hover:border-brand-600'
                      }`}
                    >
                      {week.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Riders List */}
          {selectedWeek && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <h3 className="font-display text-lg font-bold text-slate-900">Active Riders</h3>
              </div>
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="px-6 py-8 text-center text-slate-500">
                    <div className="inline-block">
                      <div className="w-8 h-8 border-4 border-slate-200 border-t-brand-600 rounded-full animate-spin"></div>
                    </div>
                  </div>
                ) : ridersList.length === 0 ? (
                  <div className="px-6 py-8 text-center text-slate-500">
                    No riders found
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">CEE ID</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Rider Name</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Phone</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Vehicle Type</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ridersList.map(rider => (
                        <tr key={rider.id} className="border-b border-slate-200 hover:bg-slate-50">
                          <td className="px-6 py-4 text-sm font-semibold text-slate-900">{rider.cee_id || rider.rider_id}</td>
                          <td className="px-6 py-4 text-sm text-slate-900">{rider.full_name || rider.rider_name}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{rider.phone}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {rider.vehicle_ownership === 'own' ? 'Own Vehicle' : rider.vehicle_ownership === 'company_ev' ? 'Company Vehicle' : 'Not Assigned'}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleRiderClick(rider)}
                              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium transition-all"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              {ridersList.length > 0 && (
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 text-sm text-slate-600">
                  Showing {ridersList.length} rider{ridersList.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Rider Details Modal */}
      {selectedRider && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold text-slate-900">{selectedRider.full_name || selectedRider.rider_name}</h2>
                <p className="text-sm text-slate-600">CEE ID: {selectedRider.cee_id || selectedRider.rider_id}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedRider(null);
                  setRiderDetails([]);
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-all"
              >
                <i className="ph-bold ph-x text-xl text-slate-600"></i>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Rider Info */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h3 className="font-display text-sm font-bold text-slate-900 mb-3">Rider Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-600 font-medium mb-1">Phone</p>
                    <p className="text-sm text-slate-900 font-semibold">{selectedRider.phone}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 font-medium mb-1">Vehicle Type</p>
                    <p className="text-sm text-slate-900 font-semibold">
                      {selectedRider.vehicle_ownership === 'own' ? 'Own Vehicle' : selectedRider.vehicle_ownership === 'company_ev' ? 'Company Vehicle' : 'Not Assigned'}
                    </p>
                  </div>
                  {selectedRider.vehicle_number && (
                    <div>
                      <p className="text-xs text-slate-600 font-medium mb-1">Vehicle Number</p>
                      <p className="text-sm text-slate-900 font-semibold">{selectedRider.vehicle_number}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Entries Tabs */}
              <div>
                <h3 className="font-display text-sm font-bold text-slate-900 mb-4">All Entries & Details</h3>
                {riderDetailsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-8 h-8 border-4 border-slate-200 border-t-brand-600 rounded-full animate-spin"></div>
                  </div>
                ) : riderDetails.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    No entries found for this rider
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Group entries by type */}
                    {(() => {
                      const grouped = riderDetails.reduce((acc, entry) => {
                        const type = entry.entry_type;
                        if (!acc[type]) acc[type] = [];
                        acc[type].push(entry);
                        return acc;
                      }, {} as Record<string, PayrollEntry[]>);

                      return Object.entries(grouped).map(([type, typeEntries]) => (
                        <div key={type} className="border border-slate-200 rounded-lg overflow-hidden">
                          {/* Section Header */}
                          <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                            <h4 className="font-semibold text-sm text-slate-900 flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${
                                type === 'referral' ? 'bg-blue-600' :
                                type === 'incentive' ? 'bg-green-600' :
                                type === 'advance' ? 'bg-purple-600' :
                                type === 'security_deposit' ? 'bg-orange-600' :
                                type === 'damage' ? 'bg-red-600' :
                                type === 'challan' ? 'bg-yellow-600' : 'bg-slate-600'
                              }`}></span>
                              {type.replace(/_/g, ' ').toUpperCase()} ({typeEntries.length})
                            </h4>
                          </div>

                          {/* Section Content */}
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-white border-b border-slate-100">
                                <tr>
                                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Description</th>
                                  <th className="px-4 py-3 text-right font-semibold text-slate-700">Amount (₹)</th>
                                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Date</th>
                                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {typeEntries.map(entry => (
                                  <tr key={entry.id} className="border-b border-slate-100 hover:bg-slate-50">
                                    <td className="px-4 py-3 text-slate-900">{entry.description}</td>
                                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                                      ₹{(parseFloat(entry.amount.toString()) || 0).toFixed(2)}
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">
                                      {new Date(entry.entry_date || entry.created_at).toLocaleDateString('en-GB', { 
                                        day: '2-digit', 
                                        month: 'short', 
                                        year: 'numeric' 
                                      })}
                                    </td>
                                    <td className="px-4 py-3">
                                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(entry.status)}`}>
                                        {entry.status.toUpperCase()}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ));
                    })()}

                    {/* Summary */}
                    <div className="bg-brand-50 border border-brand-200 rounded-lg p-4 mt-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-slate-600 font-medium mb-1">Total Referrals</p>
                          <p className="text-lg font-bold text-slate-900">{riderDetails.filter(e => e.entry_type === 'referral').length}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-600 font-medium mb-1">Total Incentives</p>
                          <p className="text-lg font-bold text-slate-900">₹{riderDetails.filter(e => e.entry_type === 'incentive').reduce((sum, e) => sum + (parseFloat(e.amount.toString()) || 0), 0).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-600 font-medium mb-1">Total Advances</p>
                          <p className="text-lg font-bold text-slate-900">₹{riderDetails.filter(e => e.entry_type === 'advance').reduce((sum, e) => sum + (parseFloat(e.amount.toString()) || 0), 0).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-600 font-medium mb-1">Total Deductions</p>
                          <p className="text-lg font-bold text-slate-900">₹{riderDetails.filter(e => ['security_deposit', 'damage', 'challan'].includes(e.entry_type)).reduce((sum, e) => sum + (parseFloat(e.amount.toString()) || 0), 0).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
