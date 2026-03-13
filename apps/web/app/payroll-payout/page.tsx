'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface PayoutEntry {
  id?: number;
  year: number;
  month: number;
  week: number;
  cee_id: string;
  rider_name: string;
  orders_delivered: number;
  attendance: number;
  base_payout: number;
  cod?: number;
}

interface RiderPayoutData {
  cee_id: string;
  rider_name: string;
  week: number;
  base_payout: number;
  final_amount: number;
  final_payout: number;
  rider_id?: string;
}

export default function PayrollPayout() {
  const router = useRouter();
  const [tab, setTab] = useState<'upload' | 'summary'>('upload');
  const [fileData, setFileData] = useState<PayoutEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [payoutData, setPayoutData] = useState<RiderPayoutData[]>([]);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [finalizingId, setFinalizingId] = useState<string | null>(null);

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  const months = Array.from({ length: 12 }, (_, i) => ({ 
    num: i + 1, 
    name: new Date(2024, i, 1).toLocaleString('default', { month: 'long' }) 
  }));

  const weeks = [
    { id: 1, label: 'Week 1 (1st - 7th)' },
    { id: 2, label: 'Week 2 (8th - 14th)' },
    { id: 3, label: 'Week 3 (15th - 21st)' },
    { id: 4, label: 'Week 4 (22nd - Month End)' }
  ];

  // Fetch payout summary
  useEffect(() => {
    if (tab === 'summary') {
      fetchPayoutSummary();
    }
  }, [tab, selectedYear, selectedMonth, selectedWeek]);

  const fetchPayoutSummary = async () => {
    setPayoutLoading(true);
    try {
      const response = await fetch('/api/payroll/payout-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: selectedYear,
          month: selectedMonth,
          week: selectedWeek
        })
      });

      const data = await response.json();
      setPayoutData(data.payouts || []);
    } catch (error) {
      console.error('Error fetching payout summary:', error);
      setPayoutData([]);
    }
    setPayoutLoading(false);
  };

  // Download template
  const downloadTemplate = () => {
    // Create CSV content
    const headers = ['Year', 'Month', 'Week', 'Cee ID', 'Rider Name', 'Orders Delivered', 'Attendance', 'Base Payout', 'COD'];
    const rows = [
      headers,
      // Sample row
      [new Date().getFullYear(), new Date().getMonth() + 1, 1, 'BB123456', 'John Doe', 25, 95, 5000, 0] // Sample data - IST timezone
    ];

    const csvContent = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    const istDate = new Date(new Date().getTime() + 5.5 * 60 * 60 * 1000);
    link.setAttribute('download', `payout-template-${istDate.toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setUploadMessage('');
    setUploadError('');

    try {
      const text = await file.text();
      const lines = text.trim().split('\n');
      
      // Parse CSV
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const data: PayoutEntry[] = [];

      // Validate headers
      const requiredHeaders = ['year', 'month', 'week', 'cee id', 'rider name', 'orders delivered', 'attendance', 'base payout', 'cod'];
      const hasAllHeaders = requiredHeaders.every(header => 
        headers.includes(header) || headers.includes(header.replace(/ /g, '_'))
      );

      if (!hasAllHeaders) {
        setUploadError('Invalid CSV format. Please use the provided template.');
        setLoading(false);
        return;
      }

      // Parse data rows
      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(',').map(cell => cell.trim());
        if (row.length < 9 || row[0] === '') continue;

        const entry: PayoutEntry = {
          year: parseInt(row[0]),
          month: parseInt(row[1]),
          week: parseInt(row[2]),
          cee_id: row[3],
          rider_name: row[4],
          orders_delivered: parseInt(row[5]),
          attendance: parseInt(row[6]),
          base_payout: parseFloat(row[7]),
          cod: row[8] ? parseFloat(row[8]) : 0
        };
        data.push(entry);
      }

      if (data.length === 0) {
        setUploadError('No valid data found in the CSV file.');
        setLoading(false);
        return;
      }

      setFileData(data);
      setUploadMessage(`Successfully parsed ${data.length} entries. Review and click "Upload" to save.`);
    } catch (error) {
      console.error('Error parsing file:', error);
      setUploadError('Error parsing CSV file. Please ensure it\'s properly formatted.');
    }
    setLoading(false);
  };

  // Upload parsed data to database
  const uploadParsedData = async () => {
    if (fileData.length === 0) {
      setUploadError('No data to upload. Please select a file first.');
      return;
    }

    setLoading(true);
    setUploadMessage('');
    setUploadError('');

    try {
      const response = await fetch('/api/payroll/payout-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries: fileData })
      });

      const result = await response.json();

      if (!response.ok) {
        setUploadError(result.message || 'Error uploading data');
      } else {
        setUploadMessage(`Successfully uploaded ${result.count || fileData.length} entries!`);
        setFileData([]);
        // Reset file input
        const fileInput = document.getElementById('csv-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }
    } catch (error) {
      console.error('Error uploading data:', error);
      setUploadError('Error uploading data to server.');
    }
    setLoading(false);
  };

  // Finalize payout for a specific rider
  const finalizePayout = async (ceeId: string, riderId: string | undefined) => {
    if (!riderId) {
      alert('Rider ID not found');
      return;
    }

    setFinalizingId(ceeId);
    try {
      const response = await fetch('/api/payroll/finalize-payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rider_id: riderId,
          cee_id: ceeId,
          year: selectedYear,
          month: selectedMonth,
          week: selectedWeek
        })
      });

      const result = await response.json();

      if (!response.ok) {
        alert(`Error: ${result.message || 'Failed to finalize payout'}`);
      } else {
        alert(`Payout finalized successfully for ${result.rider_name}`);
        // Refresh the payout summary
        fetchPayoutSummary();
      }
    } catch (error) {
      console.error('Error finalizing payout:', error);
      alert('Error finalizing payout');
    }
    setFinalizingId(null);
  };

  // Calculate totals
  const totalFinalPayout = payoutData.reduce((sum, item) => sum + item.final_payout, 0);

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
              <span className="text-xs font-medium text-slate-500">Payroll Payout</span>
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
          {/* Tabs */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="flex border-b border-slate-200">
              <button
                onClick={() => setTab('upload')}
                className={`flex-1 px-6 py-4 text-sm font-semibold transition-all ${
                  tab === 'upload'
                    ? 'text-brand-600 border-b-2 border-brand-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <i className="ph-bold ph-upload-simple mr-2"></i>
                Invoice Upload
              </button>
              <button
                onClick={() => setTab('summary')}
                className={`flex-1 px-6 py-4 text-sm font-semibold transition-all ${
                  tab === 'summary'
                    ? 'text-brand-600 border-b-2 border-brand-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <i className="ph-bold ph-list mr-2"></i>
                Riders Payout Summary
              </button>
            </div>
          </div>

          {/* Upload Tab */}
          {tab === 'upload' && (
            <div className="space-y-6">
              {/* Template Download */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h2 className="font-display text-2xl font-bold text-slate-900 mb-4">Download Template</h2>
                <p className="text-slate-600 mb-4">
                  Download the Excel template below and fill in the required fields:
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-900 mb-2 font-medium">Template Fields:</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-blue-800">
                    <div>• Year</div>
                    <div>• Month</div>
                    <div>• Week (1-4)</div>
                    <div>• Cee ID</div>
                    <div>• Rider Name</div>
                    <div>• Orders Delivered</div>
                    <div>• Attendance (%)</div>
                    <div>• Base Payout (₹)</div>
                    <div>• COD (₹)</div>
                  </div>
                </div>
                <button
                  onClick={downloadTemplate}
                  className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2"
                >
                  <i className="ph-bold ph-download"></i>
                  Download Template
                </button>
              </div>

              {/* Upload Section */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h2 className="font-display text-2xl font-bold text-slate-900 mb-4">Upload Invoice</h2>
                
                {/* File Upload Area */}
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center mb-6 hover:border-brand-600 hover:bg-brand-50 transition-all">
                  <div className="flex flex-col items-center">
                    <i className="ph-bold ph-file-csv text-4xl text-slate-400 mb-3"></i>
                    <p className="text-slate-900 font-semibold mb-2">Upload CSV File</p>
                    <p className="text-slate-600 text-sm mb-4">Drag and drop your CSV file here or click to select</p>
                    <input
                      id="csv-upload"
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      disabled={loading}
                      className="hidden"
                    />
                    <label htmlFor="csv-upload">
                      <button
                        onClick={() => (document.getElementById('csv-upload') as HTMLInputElement)?.click()}
                        disabled={loading}
                        className="px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium transition-all disabled:opacity-50"
                      >
                        Select File
                      </button>
                    </label>
                  </div>
                </div>

                {/* Messages */}
                {uploadMessage && (
                  <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-4 flex items-start gap-3">
                    <i className="ph-bold ph-check-circle text-xl mt-0.5"></i>
                    <div>{uploadMessage}</div>
                  </div>
                )}
                {uploadError && (
                  <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4 flex items-start gap-3">
                    <i className="ph-bold ph-x-circle text-xl mt-0.5"></i>
                    <div>{uploadError}</div>
                  </div>
                )}

                {/* Preview Table */}
                {fileData.length > 0 && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-3">Preview ({fileData.length} entries)</h3>
                      <div className="overflow-x-auto border border-slate-200 rounded-lg">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                              <th className="px-4 py-2 text-left font-semibold text-slate-900">CEE ID</th>
                              <th className="px-4 py-2 text-left font-semibold text-slate-900">Rider Name</th>
                              <th className="px-4 py-2 text-center font-semibold text-slate-900">Week</th>
                              <th className="px-4 py-2 text-center font-semibold text-slate-900">Orders</th>
                              <th className="px-4 py-2 text-center font-semibold text-slate-900">Base Payout</th>
                              <th className="px-4 py-2 text-center font-semibold text-slate-900">COD</th>
                            </tr>
                          </thead>
                          <tbody>
                            {fileData.slice(0, 10).map((entry, idx) => (
                              <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                                <td className="px-4 py-2 font-semibold text-slate-900">{entry.cee_id}</td>
                                <td className="px-4 py-2 text-slate-900">{entry.rider_name}</td>
                                <td className="px-4 py-2 text-center text-slate-900">{entry.week}</td>
                                <td className="px-4 py-2 text-center text-slate-900">{entry.orders_delivered}</td>
                                <td className="px-4 py-2 text-center text-slate-900">₹{entry.base_payout.toFixed(2)}</td>
                                <td className="px-4 py-2 text-center text-slate-900">₹{(entry.cod || 0).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {fileData.length > 10 && (
                        <p className="text-sm text-slate-500 mt-2">Showing 10 of {fileData.length} entries</p>
                      )}
                    </div>
                    <button
                      onClick={uploadParsedData}
                      disabled={loading}
                      className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <i className="ph-bold ph-upload"></i>
                          Upload to Database
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Summary Tab */}
          {tab === 'summary' && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h2 className="font-display text-xl font-bold text-slate-900 mb-4">Riders Payout Summary</h2>
                
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
                    <label className="block text-sm font-semibold text-slate-900 mb-2">Week</label>
                    <select
                      value={selectedWeek}
                      onChange={(e) => setSelectedWeek(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
                    >
                      {weeks.map(week => (
                        <option key={week.id} value={week.id}>{week.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Payout Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  {payoutLoading ? (
                    <div className="px-6 py-8 text-center text-slate-500">
                      <div className="inline-block">
                        <div className="w-8 h-8 border-4 border-slate-200 border-t-brand-600 rounded-full animate-spin"></div>
                      </div>
                    </div>
                  ) : payoutData.length === 0 ? (
                    <div className="px-6 py-8 text-center text-slate-500">
                      No payout data found for selected period
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">CEE ID</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Rider Name</th>
                          <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">Week</th>
                          <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900">Base Payout (₹)</th>
                          <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900">Final Amount (₹)</th>
                          <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900">Final Payout (₹)</th>
                          <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payoutData.map((payout, idx) => (
                          <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50">
                            <td className="px-6 py-4 text-sm font-semibold text-slate-900">{payout.cee_id}</td>
                            <td className="px-6 py-4 text-sm text-slate-900">{payout.rider_name}</td>
                            <td className="px-6 py-4 text-center text-sm text-slate-900">{payout.week}</td>
                            <td className="px-6 py-4 text-right text-sm font-semibold text-slate-900">₹{payout.base_payout.toFixed(2)}</td>
                            <td className="px-6 py-4 text-right text-sm font-semibold text-slate-900">₹{payout.final_amount.toFixed(2)}</td>
                            <td className={`px-6 py-4 text-right text-sm font-bold ${
                              payout.final_payout >= 0 ? 'text-green-700' : 'text-red-700'
                            }`}>
                              ₹{payout.final_payout.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <button
                                onClick={() => finalizePayout(payout.cee_id, payout.rider_id)}
                                disabled={finalizingId === payout.cee_id}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 justify-center"
                              >
                                {finalizingId === payout.cee_id ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Finalizing...
                                  </>
                                ) : (
                                  <>
                                    <i className="ph-bold ph-check-circle"></i>
                                    Finalize Payout
                                  </>
                                )}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Total Summary Footer */}
                {payoutData.length > 0 && (
                  <div className="bg-brand-50 border-t border-slate-200 px-6 py-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-600 font-medium mb-1">Total Riders: {payoutData.length}</p>
                        <p className="text-xl font-bold text-slate-900">Total Final Payout</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-4xl font-bold ${
                          totalFinalPayout >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          ₹{totalFinalPayout.toFixed(2)}
                        </p>
                        <p className="text-xs text-slate-600 mt-1">Amount to be transferred to riders</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}