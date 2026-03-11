'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Rider {
  id: number;
  cee_id: string;
  full_name: string;
  phone: string;
  email: string;
  vehicle_ownership: string;
  assigned_hub_id: number;
  status: string;
  assigned_vehicle_id?: number;
  vehicle_number?: string;
  model?: string;
  vehicle_type?: string;
  vehicle_year?: number;
  vehicle_status?: string;
}

export default function PayrollManagement() {
  const router = useRouter();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRider, setSelectedRider] = useState<Rider | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const [panelMode, setPanelMode] = useState<'view' | 'add'>('view');
  const [historyDate, setHistoryDate] = useState(new Date().toISOString().split('T')[0]);
  const [historyEntries, setHistoryEntries] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Form states
  const [entryType, setEntryType] = useState<'addition' | 'deduction'>('addition');
  const [additionType, setAdditionType] = useState('referral');
  const [deductionType, setDeductionType] = useState('advance');
  const [formData, setFormData] = useState({ amount: '', description: '', notes: '' });
  const [savingEntry, setSavingEntry] = useState(false);

  useEffect(() => {
    fetchRiders();
  }, [selectedYear, selectedMonth, selectedDate, selectedFilter, searchQuery]);

  const fetchRiders = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/payroll/riders/filter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: selectedYear,
          month: selectedMonth,
          date: selectedDate,
          filter: selectedFilter,
          search: searchQuery
        })
      });
      const data = await response.json();
      setRiders(data.riders || []);
    } catch (error) {
      console.error('Error fetching riders:', error);
      setRiders([]);
    }
    setLoading(false);
  };

  const openPanel = (rider: Rider) => {
    setSelectedRider(rider);
    setPanelMode('view');
    setShowPanel(true);
    setFormData({ amount: '', description: '', notes: '' });
    const today = new Date().toISOString().split('T')[0];
    setHistoryDate(today);
    setHistoryEntries([]);
    fetchHistoryEntries(rider.cee_id, today);
  };

  const fetchHistoryEntries = async (riderId: string, date: string) => {
    setLoadingHistory(true);
    try {
      const response = await fetch('/api/payroll/entries-by-date', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rider_id: riderId, date: date })
      });
      const data = await response.json();
      setHistoryEntries(data.entries || []);
    } catch (error) {
      console.error('Error fetching history entries:', error);
      setHistoryEntries([]);
    }
    setLoadingHistory(false);
  };

  const saveEntry = async () => {
    if (!selectedRider || !formData.amount) {
      alert('Please fill in all required fields');
      return;
    }
    setSavingEntry(true);

    try {
      let payload: any = {
        rider_id: selectedRider.cee_id,
        rider_name: selectedRider.full_name,
        status: 'approved'
      };
      let endpoint = '';

      if (entryType === 'addition') {
        if (additionType === 'referral') {
          payload = { ...payload, referred_name: formData.description, referred_phone: '', preferred_location: '', notes: formData.notes };
          endpoint = '/api/payroll/referrals';
        } else {
          payload = { ...payload, incentive_type: additionType, amount: formData.amount, description: formData.description, incentive_date: historyDate };
          endpoint = '/api/payroll/incentives';
        }
      } else {
        payload = { ...payload, amount: formData.amount, description: formData.description, deduction_date: historyDate };
        if (deductionType === 'advance') {
          payload.reason = formData.description;
          endpoint = '/api/payroll/advances';
        } else {
          payload.deduction_type = deductionType;
          endpoint = '/api/payroll/deductions';
        }
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert('Entry added successfully!');
        setFormData({ amount: '', description: '', notes: '' });
        if (selectedRider) {
          fetchHistoryEntries(selectedRider.cee_id, historyDate);
        }
        setPanelMode('view');
      } else {
        alert('Failed to save entry');
      }
    } catch (error) {
      console.error('Error saving entry:', error);
      alert('Error saving entry');
    }
    setSavingEntry(false);
  };

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  const months = Array.from({ length: 12 }, (_, i) => ({ num: i + 1, name: new Date(2024, i, 1).toLocaleString('default', { month: 'long' }) }));

  const filteredRiders = riders.filter(rider => {
    const matchesSearch = searchQuery === '' || 
      rider.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rider.cee_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rider.phone.includes(searchQuery);

    if (!matchesSearch) return false;
    if (selectedFilter === 'active') return rider.status === 'active';
    if (selectedFilter === 'inactive') return rider.status !== 'active';
    if (selectedFilter === 'own_vehicle') return rider.vehicle_ownership === 'own';
    if (selectedFilter === 'company_ev') return rider.vehicle_ownership === 'company_ev';
    
    return true;
  });

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
              <span className="text-xs font-medium text-slate-500">Payroll Management</span>
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
            <h2 className="font-display text-2xl font-bold text-slate-900 mb-6">Payroll Management</h2>

            {/* Filters */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Year</label>
                  <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600">
                    {years.map(year => <option key={year} value={year}>{year}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Month</label>
                  <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600">
                    {months.map(month => <option key={month.num} value={month.num}>{month.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Date</label>
                  <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Search</label>
                <input type="text" placeholder="Search riders..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600" />
              </div>

              <div className="flex flex-wrap gap-2">
                {[{ value: 'all', label: 'All Riders' }, { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }, { value: 'own_vehicle', label: 'Own Vehicle' }, { value: 'company_ev', label: 'Company EV' }].map(filter => (
                  <button key={filter.value} onClick={() => setSelectedFilter(filter.value)} className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${selectedFilter === filter.value ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Riders Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">CEE ID</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Phone</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Vehicle Type</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Status</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="px-6 py-8 text-center"><div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-brand-600 rounded-full animate-spin"></div></td></tr>
                  ) : filteredRiders.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">No riders found</td></tr>
                  ) : (
                    filteredRiders.map(rider => (
                      <tr key={rider.id} className="border-b border-slate-200 hover:bg-slate-50">
                        <td className="px-6 py-4 text-sm font-semibold text-slate-900">{rider.cee_id}</td>
                        <td className="px-6 py-4 text-sm text-slate-900">{rider.full_name}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{rider.phone}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{rider.vehicle_ownership === 'own' ? 'Own' : rider.vehicle_ownership === 'company_ev' ? 'Company EV' : 'N/A'}</td>
                        <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs font-medium ${rider.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>{rider.status}</span></td>
                        <td className="px-6 py-4 text-right"><button onClick={() => openPanel(rider)} className="text-brand-600 hover:text-brand-700 text-sm font-medium">View Details</button></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Modal */}
      {showPanel && selectedRider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowPanel(false)} />
          <div className="relative bg-white shadow-2xl flex flex-col max-w-3xl w-full max-h-[90vh] rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="px-8 py-6 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
              <div>
                <h2 className="font-display font-bold text-2xl text-slate-900">{selectedRider.full_name}</h2>
                <p className="text-sm text-slate-500 mt-1">CEE ID: {selectedRider.cee_id}</p>
              </div>
              <button onClick={() => setShowPanel(false)} className="p-2 hover:bg-slate-200 rounded-lg"><i className="ph-bold ph-x text-2xl"></i></button>
            </div>

            {/* Rider Info */}
            <div className="px-8 py-5 bg-slate-50 border-b border-slate-200 grid grid-cols-2 gap-4 text-sm">
              <div><strong>CEE ID:</strong> {selectedRider.cee_id}</div>
              <div><strong>Phone:</strong> {selectedRider.phone}</div>
              <div><strong>Email:</strong> {selectedRider.email}</div>
              <div><strong>Vehicle:</strong> {selectedRider.vehicle_ownership === 'own' ? 'Own' : 'Company EV'}</div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-8 py-6">
              {panelMode === 'view' ? (
                <>
                  {loadingHistory ? (
                    <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-slate-200 border-t-brand-600 rounded-full animate-spin"></div></div>
                  ) : (
                    <div className="space-y-6">
                      {/* Date Selector */}
                      <div className="flex items-end gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-900 mb-2">Select Date</label>
                          <input 
                            type="date" 
                            value={historyDate} 
                            onChange={(e) => {
                              setHistoryDate(e.target.value);
                              if (selectedRider) {
                                fetchHistoryEntries(selectedRider.cee_id, e.target.value);
                              }
                            }}
                            className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
                          />
                        </div>
                      </div>

                      {/* History Entries */}
                      <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
                        <h4 className="font-semibold text-slate-900 mb-4">Entries for {new Date(historyDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</h4>
                        
                        {historyEntries.length === 0 ? (
                          <div className="text-center py-8 text-slate-500">
                            <p>No entries found for this date</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {historyEntries.map((entry: any, idx: number) => {
                              // Determine if this is an addition or deduction
                              let isAddition = true;
                              let entryLabel = entry.entry_type || entry.type || 'Entry';
                              
                              // Check if it's a deduction based on table source
                              if (entry.reason !== undefined) {
                                // Advance entry
                                isAddition = false;
                                entryLabel = 'Advance';\n                              } else if (entry.deduction_type !== undefined) {
                                // Deduction entry
                                isAddition = false;
                                entryLabel = entry.deduction_type || 'Deduction';\n                              } else if (entry.incentive_type !== undefined || entry.incentive_date !== undefined) {
                                // Incentive entry\n                                isAddition = true;
                                entryLabel = entry.incentive_type || 'Incentive';\n                              }\n                              \n                              return (\n                                <div key={idx} className=\"bg-white border border-slate-200 rounded-lg p-3 flex justify-between items-center\">\n                                  <div>\n                                    <div className=\"text-sm font-semibold text-slate-900\">{entryLabel}</div>\n                                    {entry.description && <div className=\"text-xs text-slate-600 mt-1\">{entry.description}</div>}\n                                    {entry.reason && <div className=\"text-xs text-slate-600 mt-1\">{entry.reason}</div>}\n                                  </div>\n                                  <div className=\"text-right\">\n                                    <div className={`text-sm font-bold ${isAddition ? 'text-green-700' : 'text-red-700'}`}>\n                                      {isAddition ? '+' : '-'}₹{Math.abs(parseFloat(entry.amount || 0)).toFixed(2)}\n                                    </div>\n                                  </div>\n                                </div>\n                              );\n                            })}
                          </div>
                        )}
                      </div>

                      {/* Add Button */}
                      <div className="pt-4 border-t border-slate-200">
                        <button onClick={() => setPanelMode('add')} className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium">
                          Add Entry
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">Entry Type</label>
                    <select value={entryType} onChange={(e) => setEntryType(e.target.value as 'addition' | 'deduction')} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600">
                      <option value="addition">Addition</option>
                      <option value="deduction">Deduction</option>
                    </select>
                  </div>

                  {entryType === 'addition' ? (
                    <>
                      <div>
                        <label className="block text-sm font-semibold text-slate-900 mb-2">Type</label>
                        <select value={additionType} onChange={(e) => setAdditionType(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600">
                          <option value="referral">Referral</option>
                          <option value="incentive">Incentive</option>
                          <option value="others">Others</option>
                        </select>
                      </div>
                      <input type="number" placeholder="Amount (₹)" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600" />
                      <textarea placeholder="Description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 resize-none" rows={3} />
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-semibold text-slate-900 mb-2">Type</label>
                        <select value={deductionType} onChange={(e) => setDeductionType(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600">
                          <option value="advance">Advance</option>
                          <option value="damage">Damage</option>
                          <option value="challan">Challan</option>
                          <option value="security_deposit">Security Deposit</option>
                          <option value="others">Others</option>
                        </select>
                      </div>
                      <input type="number" placeholder="Amount (₹)" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600" />
                      <textarea placeholder="Description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 resize-none" rows={3} />
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-8 py-5 border-t border-slate-200 flex gap-4 bg-slate-50">
              <button onClick={() => panelMode === 'add' ? setPanelMode('view') : setShowPanel(false)} className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium">
                {panelMode === 'add' ? 'Back' : 'Close'}
              </button>
              {panelMode === 'add' && (
                <button onClick={saveEntry} disabled={savingEntry} className="flex-1 px-4 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium disabled:opacity-50">
                  {savingEntry ? 'Saving...' : 'Save Entry'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
