'use client';

import { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, X, Edit2, Save } from 'lucide-react';

interface ExtractedRider {
  ceeId: string;
  riderName: string;
  orders: number;
  basePayout: number;
  weekPeriod: string;
}

interface InvoiceUploadProps {
  onImportComplete: () => void;
}

export default function InvoiceUpload({ onImportComplete }: InvoiceUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedRider[]>([]);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<ExtractedRider | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setError('');
    setExtractedData([]);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/payroll/upload', {
        method: 'POST',
        body: formData
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      setExtractedData(result.data);
      setFileName(result.fileName);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setEditForm({ ...extractedData[index] });
  };

  const handleSaveEdit = () => {
    if (editingIndex !== null && editForm) {
      const updated = [...extractedData];
      updated[editingIndex] = editForm;
      setExtractedData(updated);
      setEditingIndex(null);
      setEditForm(null);
    }
  };

  const handleRemove = (index: number) => {
    setExtractedData(extractedData.filter((_, i) => i !== index));
  };

  const handleBulkImport = async () => {
    if (extractedData.length === 0) return;

    setUploading(true);
    setError('');

    try {
      // Fetch current settings for calculations
      const settingsRes = await fetch('/api/settings');
      const settings = await settingsRes.json();
      
      const evMonthlyRent = parseFloat(settings.find((s: any) => s.setting_key === 'ev_monthly_rent')?.setting_value || '0');
      const evWeeklyRent = parseFloat(settings.find((s: any) => s.setting_key === 'ev_weekly_rent')?.setting_value || '0');

      // Process each rider
      const results = [];
      for (const rider of extractedData) {
        try {
          // Find rider by CEE ID
          const ridersRes = await fetch(`/api/riders?ceeId=${encodeURIComponent(rider.ceeId)}`);
          const riders = await ridersRes.json();
          
          if (riders.length === 0) {
            results.push({ ceeId: rider.ceeId, status: 'error', message: 'Rider not found' });
            continue;
          }

          const riderData = riders[0];

          // Fetch incentives
          const incentivesRes = await fetch(`/api/incentives?riderId=${riderData.cee_id}`);
          const incentives = await incentivesRes.json();
          const totalIncentives = incentives.reduce((sum: number, inc: any) => sum + parseFloat(inc.amount), 0);

          // Fetch deductions
          const deductionsRes = await fetch(`/api/deductions?riderId=${riderData.cee_id}`);
          const deductions = await deductionsRes.json();
          const totalDeductions = deductions.reduce((sum: number, ded: any) => sum + parseFloat(ded.amount), 0);

          // Calculate EV rent
          let evRent = 0;
          if (riderData.vehicle_ownership === 'company_ev') {
            const leaderDiscount = riderData.is_leader ? (parseFloat(riderData.leader_discount_percentage) || 0) : 0;
            evRent = evWeeklyRent * (1 - leaderDiscount / 100);
          }

          // Calculate net payout
          const netPayout = rider.basePayout + totalIncentives - totalDeductions - evRent;

          // Create payout record
          const payoutData = {
            riderId: riderData.cee_id,
            weekPeriod: rider.weekPeriod || 'Imported',
            ordersCount: rider.orders,
            basePayout: rider.basePayout,
            totalIncentives,
            totalDeductions,
            evRent,
            netPayout,
            status: 'pending'
          };

          const createRes = await fetch('/api/payroll', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payoutData)
          });

          if (!createRes.ok) {
            throw new Error('Failed to create payout');
          }

          results.push({ ceeId: rider.ceeId, status: 'success' });
        } catch (err: any) {
          results.push({ ceeId: rider.ceeId, status: 'error', message: err.message });
        }
      }

      // Show results summary
      const successful = results.filter(r => r.status === 'success').length;
      const failed = results.filter(r => r.status === 'error').length;

      alert(`Import complete!\n✓ ${successful} payouts created\n✗ ${failed} failed`);

      if (successful > 0) {
        setExtractedData([]);
        setFileName('');
        onImportComplete();
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      {extractedData.length === 0 && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
            isDragging ? 'border-yellow-500 bg-yellow-50' : 'border-gray-300 hover:border-yellow-400'
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 text-yellow-600 animate-spin" />
              <p className="text-gray-600">Processing invoice with AI...</p>
            </div>
          ) : (
            <>
              <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Upload Invoice</h3>
              <p className="text-gray-600 mb-6">
                Drag & drop your invoice here, or click to browse
              </p>
              <input
                type="file"
                id="invoice-upload"
                accept=".pdf,.xlsx,.xls,.csv,.png,.jpg,.jpeg"
                onChange={handleFileSelect}
                className="hidden"
              />
              <label
                htmlFor="invoice-upload"
                className="inline-block px-6 py-3 bg-yellow-600 text-white rounded-lg cursor-pointer hover:bg-yellow-700 transition-colors"
              >
                Choose File
              </label>
              <p className="text-sm text-gray-500 mt-4">
                Supported: PDF, Excel, CSV, Images
              </p>
            </>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-red-900">Upload Failed</h4>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Extracted Data Table */}
      {extractedData.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <h3 className="font-semibold">Extracted Data</h3>
                <p className="text-sm text-gray-600">{fileName} • {extractedData.length} riders found</p>
              </div>
            </div>
            <button
              onClick={() => {
                setExtractedData([]);
                setFileName('');
              }}
              className="text-gray-600 hover:text-red-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              ℹ️ Review the extracted data below. You can edit or remove entries before importing.
            </p>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">CEE ID</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Rider Name</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Orders</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Base Payout</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Week Period</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {extractedData.map((rider, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      {editingIndex === index ? (
                        <>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={editForm?.ceeId || ''}
                              onChange={(e) => setEditForm({ ...editForm!, ceeId: e.target.value })}
                              className="w-full px-2 py-1 border rounded"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={editForm?.riderName || ''}
                              onChange={(e) => setEditForm({ ...editForm!, riderName: e.target.value })}
                              className="w-full px-2 py-1 border rounded"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              value={editForm?.orders || 0}
                              onChange={(e) => setEditForm({ ...editForm!, orders: parseInt(e.target.value) })}
                              className="w-full px-2 py-1 border rounded"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              value={editForm?.basePayout || 0}
                              onChange={(e) => setEditForm({ ...editForm!, basePayout: parseFloat(e.target.value) })}
                              className="w-full px-2 py-1 border rounded"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={editForm?.weekPeriod || ''}
                              onChange={(e) => setEditForm({ ...editForm!, weekPeriod: e.target.value })}
                              className="w-full px-2 py-1 border rounded"
                            />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={handleSaveEdit}
                              className="text-green-600 hover:text-green-700"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 font-mono text-sm">{rider.ceeId}</td>
                          <td className="px-4 py-3">{rider.riderName}</td>
                          <td className="px-4 py-3">{rider.orders}</td>
                          <td className="px-4 py-3">₹{rider.basePayout.toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{rider.weekPeriod || '-'}</td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleEdit(index)}
                              className="text-blue-600 hover:text-blue-700 mr-3"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRemove(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <button
              onClick={() => {
                setExtractedData([]);
                setFileName('');
              }}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleBulkImport}
              disabled={uploading}
              className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Import {extractedData.length} Payouts
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
