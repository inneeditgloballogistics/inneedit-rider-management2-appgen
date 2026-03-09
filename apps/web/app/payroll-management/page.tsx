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

interface DeductionEntry {
  id?: number;
  rider_id: string;
  deduction_type: string;
  amount: number;
  description: string;
  deduction_date: string;
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
  const [panelMode, setPanelMode] = useState<'additions' | 'deductions'>('additions');
  const [additionsType, setAdditionsType] = useState<'referral' | 'incentive' | 'others'>('referral');
  const [deductionsType, setDeductionsType] = useState<'advance' | 'security' | 'damage' | 'challan' | 'others'>('advance');
  const [riderEntries, setRiderEntries] = useState<any[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);

  // Form states for entries
  const [additionsForm, setAdditionsForm] = useState({ amount: '', description: '', notes: '' });
  const [deductionsForm, setDeductionsForm] = useState({ amount: '', description: '', notes: '' });
  const [savingEntry, setSavingEntry] = useState(false);

  // Fetch riders based on filters
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

  const openPanel = (rider: Rider, mode: 'additions' | 'deductions') => {
    setSelectedRider(rider);
    setPanelMode(mode);
    setShowPanel(true);
    // Reset forms
    setAdditionsForm({ amount: '', description: '', notes: '' });
    setDeductionsForm({ amount: '', description: '', notes: '' });
    // Reset type dropdowns
    setAdditionsType('referral');
    setDeductionsType('advance');
  };

  const fetchRiderEntries = async (riderId: string) => {
    setLoadingEntries(true);
    try {
      const response = await fetch('/api/payroll/rider-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rider_id: riderId })
      });
      const data = await response.json();
      setRiderEntries(data.entries || []);
    } catch (error) {
      console.error('Error fetching rider entries:', error);
      setRiderEntries([]);
    }
    setLoadingEntries(false);
  };

  const saveEntry = async () => {
    if (!selectedRider) return;
    setSavingEntry(true);

    try {
      let payload: any = {
        rider_id: selectedRider.cee_id,
        rider_name: selectedRider.full_name,
        status: 'approved'
      };

      let endpoint = '';

      if (panelMode === 'additions') {
        if (additionsType === 'referral') {
          payload = { ...payload, referred_name: additionsForm.description, referred_phone: '', preferred_location: '', notes: additionsForm.notes, type: 'referral' };
          endpoint = '/api/payroll/referrals';
        } else if (additionsType === 'incentive') {
          payload = { ...payload, incentive_type: additionsType, amount: additionsForm.amount, description: additionsForm.description, incentive_date: selectedDate };
          endpoint = '/api/payroll/incentives';
        } else {
          // Others - treat as incentive
          payload = { ...payload, incentive_type: 'others', amount: additionsForm.amount, description: additionsForm.description, incentive_date: selectedDate };
          endpoint = '/api/payroll/incentives';
        }
      } else if (panelMode === 'deductions') {
        payload = { ...payload, amount: deductionsForm.amount, description: deductionsForm.description, deduction_date: selectedDate };
        
        if (deductionsType === 'advance') {
          payload.type = 'advance';
          payload.reason = deductionsForm.description;
          endpoint = '/api/payroll/advances';
        } else if (deductionsType === 'security') {
          payload.type = 'security_deposit';
          endpoint = '/api/payroll/deductions';
        } else if (deductionsType === 'damage') {
          payload.type = 'damage';
          endpoint = '/api/payroll/deductions';
        } else if (deductionsType === 'challan') {
          payload.type = 'challan';
          endpoint = '/api/payroll/deductions';
        } else {
          // Others
          payload.type = 'others';
          endpoint = '/api/payroll/deductions';
        }
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert(`Entry added successfully and marked as Approved!`);
        setShowPanel(false);
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

            {/* Filters Section */}
            <div className="space-y-4">
              {/* Date Selection */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Date (DD MMM YYYY)</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    {selectedDate && new Date(selectedDate).toLocaleDateString('en-GB', { 
                      day: '2-digit', 
                      month: 'short', 
                      year: 'numeric' 
                    })}
                  </p>
                </div>
              </div>

              {/* Search Bar */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Search by CEE ID, Name, or Phone</label>
                <input
                  type="text"
                  placeholder="Search riders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
                />
              </div>

              {/* Filter Buttons */}
              <div className="flex flex-wrap gap-2 pt-2">
                {[
                  { value: 'all', label: 'All Riders' },
                  { value: 'active', label: 'Active Riders' },
                  { value: 'inactive', label: 'Inactive Riders' },
                  { value: 'own_vehicle', label: 'Own Vehicle' },
                  { value: 'company_ev', label: 'Company EV' }
                ].map(filter => (
                  <button
                    key={filter.value}
                    onClick={() => setSelectedFilter(filter.value)}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                      selectedFilter === filter.value
                        ? 'bg-brand-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
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
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                        <div className="inline-block">
                          <div className="w-8 h-8 border-4 border-slate-200 border-t-brand-600 rounded-full animate-spin"></div>
                        </div>
                      </td>
                    </tr>
                  ) : filteredRiders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                        No riders found for the selected filters
                      </td>
                    </tr>
                  ) : (
                    filteredRiders.map(rider => (
                      <tr key={rider.id} className="border-b border-slate-200 hover:bg-slate-50">
                        <td className="px-6 py-4 text-sm font-semibold text-slate-900">{rider.cee_id}</td>
                        <td className="px-6 py-4 text-sm text-slate-900">{rider.full_name}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{rider.phone}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {rider.vehicle_ownership === 'own' ? 'Own Vehicle' : rider.vehicle_ownership === 'company_ev' ? 'Company Vehicle' : 'Not Assigned'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            rider.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {rider.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => openPanel(rider, 'additions')}
                            className="text-brand-600 hover:text-brand-700 text-sm font-medium"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {filteredRiders.length > 0 && (
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 text-sm text-slate-600">
                Showing {filteredRiders.length} rider{filteredRiders.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Big Popup Modal */}
      {showPanel && selectedRider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black/50 cursor-pointer"
            onClick={() => setShowPanel(false)}
          />

          {/* Modal */}
          <div className="relative bg-white shadow-2xl flex flex-col max-w-2xl w-full max-h-[90vh] rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="px-8 py-6 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
              <div>
                <h2 className="font-display font-bold text-2xl text-slate-900">{selectedRider.full_name}</h2>
                <p className="text-sm text-slate-500 mt-1">CEE ID: {selectedRider.cee_id}</p>
              </div>
              <button 
                onClick={() => setShowPanel(false)}
                className="p-2 hover:bg-slate-200 rounded-lg transition-all"
              >
                <i className="ph-bold ph-x text-2xl"></i>
              </button>
            </div>

            {/* Rider Info */}
              <div className="px-8 py-5 bg-slate-50 border-b border-slate-200 space-y-2 text-sm grid grid-cols-2 gap-4">
              <div><strong>CEE ID:</strong> {selectedRider.cee_id}</div>
              <div><strong>Phone:</strong> {selectedRider.phone}</div>
              <div><strong>Email:</strong> {selectedRider.email}</div>
              <div>
                <strong>Vehicle Type:</strong> {' '}
                {selectedRider.vehicle_ownership === 'own' ? 'Own Vehicle' : selectedRider.vehicle_ownership === 'company_ev' ? 'Company Vehicle' : 'Not Assigned'}
              </div>
              {selectedRider.vehicle_number && (
                <>
                  <div><strong>Vehicle Number:</strong> {selectedRider.vehicle_number}</div>
                  <div><strong>Vehicle Model:</strong> {selectedRider.model || 'N/A'}</div>
                  <div>
                    <strong>Vehicle Status:</strong>{' '}
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      selectedRider.vehicle_status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {selectedRider.vehicle_status || 'Not Assigned'}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 bg-white overflow-x-auto px-8">
              {['additions', 'deductions'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setPanelMode(tab as 'additions' | 'deductions')}
                  className={`px-4 py-3 text-sm font-medium transition-all whitespace-nowrap ${
                    panelMode === tab
                      ? 'border-b-2 border-brand-600 text-brand-600'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Forms */}
            <div className="flex-1 overflow-y-auto px-8 py-6">
              {panelMode === 'additions' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">Addition Type</label>
                    <select
                      value={additionsType}
                      onChange={(e) => setAdditionsType(e.target.value as 'referral' | 'incentive' | 'others')}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
                    >
                      <option value="referral">Referrals</option>
                      <option value="incentive">Incentives</option>
                      <option value="others">Others</option>
                    </select>
                  </div>
                  
                  {additionsType === 'referral' && (
                    <>
                      <input
                        type="text"
                        placeholder="Referred Person Name"
                        value={additionsForm.description}
                        onChange={(e) => setAdditionsForm({...additionsForm, description: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
                      />
                      <textarea
                        placeholder="Notes"
                        value={additionsForm.notes}
                        onChange={(e) => setAdditionsForm({...additionsForm, notes: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 resize-none"
                        rows={4}
                      />
                    </>
                  )}
                  
                  {(additionsType === 'incentive' || additionsType === 'others') && (
                    <>
                      <input
                        type="number"
                        placeholder="Amount (₹)"
                        value={additionsForm.amount}
                        onChange={(e) => setAdditionsForm({...additionsForm, amount: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
                      />
                      <textarea
                        placeholder="Description"
                        value={additionsForm.description}
                        onChange={(e) => setAdditionsForm({...additionsForm, description: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 resize-none"
                        rows={4}
                      />
                    </>
                  )}
                </div>
              )}

              {panelMode === 'deductions' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">Deduction Type</label>
                    <select
                      value={deductionsType}
                      onChange={(e) => setDeductionsType(e.target.value as 'advance' | 'security' | 'damage' | 'challan' | 'others')}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
                    >
                      <option value="security">Security Deposit</option>
                      <option value="advance">Advance</option>
                      <option value="damage">Damage</option>
                      <option value="challan">Challans</option>
                      <option value="others">Others</option>
                    </select>
                  </div>
                  
                  <input
                    type="number"
                    placeholder="Amount (₹)"
                    value={deductionsForm.amount}
                    onChange={(e) => setDeductionsForm({...deductionsForm, amount: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
                  />
                  <textarea
                    placeholder="Description"
                    value={deductionsForm.description}
                    onChange={(e) => setDeductionsForm({...deductionsForm, description: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 resize-none"
                    rows={4}
                  />
                  <textarea
                    placeholder="Notes (optional)"
                    value={deductionsForm.notes}
                    onChange={(e) => setDeductionsForm({...deductionsForm, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 resize-none"
                    rows={3}
                  />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-8 py-5 border-t border-slate-200 flex gap-4 bg-slate-50">
              <button
                onClick={() => setShowPanel(false)}
                className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium transition-all"
              >
                Cancel
              </button>
              <button
                onClick={saveEntry}
                disabled={savingEntry}
                className="flex-1 px-4 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium transition-all disabled:opacity-50"
              >
                {savingEntry ? 'Saving...' : 'Approve'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
