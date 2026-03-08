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

export default function PayrollEntries() {
  const router = useRouter();
  const [entries, setEntries] = useState<PayrollEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedType, setSelectedType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchEntries();
  }, [selectedYear, selectedMonth, selectedType, searchQuery]);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/payroll/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: selectedYear,
          month: selectedMonth,
          type: selectedType,
          search: searchQuery
        })
      });

      const data = await response.json();
      setEntries(data.entries || []);
    } catch (error) {
      console.error('Error fetching entries:', error);
      setEntries([]);
    }
    setLoading(false);
  };

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  const months = Array.from({ length: 12 }, (_, i) => ({ num: i + 1, name: new Date(2024, i, 1).toLocaleString('default', { month: 'long' }) }));

  const entryTypes = [
    { value: 'all', label: 'All Entries' },
    { value: 'referral', label: 'Referrals' },
    { value: 'incentive', label: 'Incentives' },
    { value: 'advance', label: 'Advances' },
    { value: 'security_deposit', label: 'Security Deposit' },
    { value: 'damage', label: 'Damage' },
    { value: 'challan', label: 'Challan' }
  ];

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = searchQuery === '' || 
      entry.rider_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.rider_id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

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
            <h2 className="font-display text-2xl font-bold text-slate-900 mb-6">Payroll Entries</h2>

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

              {/* Search Bar */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Search by Rider Name or CEE ID</label>
                <input
                  type="text"
                  placeholder="Search entries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
                />
              </div>

              {/* Filter Buttons */}
              <div className="flex flex-wrap gap-2 pt-2">
                {entryTypes.map(type => (
                  <button
                    key={type.value}
                    onClick={() => setSelectedType(type.value)}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                      selectedType === type.value
                        ? 'bg-brand-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Entries Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">CEE ID</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Rider Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Type</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900">Amount (₹)</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Description</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                        <div className="inline-block">
                          <div className="w-8 h-8 border-4 border-slate-200 border-t-brand-600 rounded-full animate-spin"></div>
                        </div>
                      </td>
                    </tr>
                  ) : filteredEntries.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                        No entries found for the selected filters
                      </td>
                    </tr>
                  ) : (
                    filteredEntries.map(entry => (
                      <tr key={entry.id} className="border-b border-slate-200 hover:bg-slate-50">
                        <td className="px-6 py-4 text-sm font-semibold text-slate-900">{entry.rider_id}</td>
                        <td className="px-6 py-4 text-sm text-slate-900">{entry.rider_name}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(entry.entry_type)}`}>
                            {entry.entry_type.replace(/_/g, ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-slate-900">₹{(parseFloat(entry.amount.toString()) || 0).toFixed(2)}</td>
                        <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">{entry.description}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {new Date(entry.entry_date || entry.created_at).toLocaleDateString('en-GB', { 
                            day: '2-digit', 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(entry.status)}`}>
                            {entry.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {filteredEntries.length > 0 && (
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 text-sm text-slate-600">
                Showing {filteredEntries.length} entr{filteredEntries.length !== 1 ? 'ies' : 'y'}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
