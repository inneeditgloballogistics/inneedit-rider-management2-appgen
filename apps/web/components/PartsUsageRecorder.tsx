'use client';

import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';

interface Part {
  id: number;
  part_name: string;
  part_code: string;
  unit_cost: number;
  quantity_in_stock: number;
}

interface PartsUsage {
  id: number;
  part_id: number;
  part_name: string;
  part_code: string;
  unit_cost: number;
  quantity_used: number;
  usage_date: string;
}

export default function PartsUsageRecorder({ 
  ticketId, 
  hubId,
  onPartUsageRecorded 
}: { 
  ticketId: number; 
  hubId: number;
  onPartUsageRecorded?: () => void;
}) {
  const [parts, setParts] = useState<Part[]>([]);
  const [partsUsage, setPartsUsage] = useState<PartsUsage[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    partId: '',
    quantityUsed: 1,
  });

  const [selectedPartDetails, setSelectedPartDetails] = useState<Part | null>(null);

  useEffect(() => {
    fetchParts();
    fetchPartsUsage();
  }, [hubId, ticketId]);

  const fetchParts = async () => {
    try {
      // If hubId is provided and valid, fetch parts for that hub
      // Otherwise fetch all parts from all hubs
      let url = '/api/parts-inventory';
      if (hubId && hubId > 0) {
        url = `/api/parts-inventory?action=by-hub&hubId=${hubId}`;
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        // Filter to show only parts with stock available
        const availableParts = data.filter((p: any) => p.quantity_in_stock > 0);
        console.log('[PartsUsageRecorder] Fetched parts:', { hubId, totalParts: data.length, availableParts: availableParts.length });
        setParts(availableParts);
      } else {
        console.error('[PartsUsageRecorder] Error response:', response.status);
        setParts([]);
      }
    } catch (error) {
      console.error('[PartsUsageRecorder] Error fetching parts:', error);
      setParts([]);
    }
  };

  const fetchPartsUsage = async () => {
    try {
      const response = await fetch(`/api/parts-usage?ticketId=${ticketId}`);
      if (response.ok) {
        const data = await response.json();
        setPartsUsage(data);
      }
    } catch (error) {
      console.error('Error fetching parts usage:', error);
    }
  };

  const handleAddPartUsage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.partId || !formData.quantityUsed) {
      alert('Please select a part and enter quantity');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/parts-usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_ticket_id: ticketId,
          part_id: parseInt(formData.partId),
          quantity_used: parseInt(formData.quantityUsed),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(
          `Part recorded! Cost: ₹${result.total_cost.toLocaleString('en-IN', { 
            maximumFractionDigits: 2 
          })} deducted from rider salary for this week.`
        );
        setFormData({ partId: '', quantityUsed: 1 });
        setSelectedPartDetails(null);
        setShowAddModal(false);
        fetchParts();
        fetchPartsUsage();
        if (onPartUsageRecorded) {
          onPartUsageRecorded();
        }
      } else {
        const error = await response.json();
        alert(`Failed to record parts usage: ${error.error}`);
      }
    } catch (error) {
      console.error('Error recording parts usage:', error);
      alert('Error recording parts usage');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePartSelect = (partId: string) => {
    setFormData({ ...formData, partId });
    const part = parts.find((p) => p.id === parseInt(partId));
    setSelectedPartDetails(part || null);
  };

  const totalCost = selectedPartDetails
    ? selectedPartDetails.unit_cost * formData.quantityUsed
    : 0;

  const totalUsageCost = partsUsage.reduce((sum, usage) => {
    return sum + usage.unit_cost * usage.quantity_used;
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Parts Used in This Ticket</h3>
          <p className="text-sm text-slate-600 mt-1">
            Record parts used - costs will be deducted from rider salary
          </p>
        </div>
        <button
          onClick={() => {
            setFormData({ partId: '', quantityUsed: 1 });
            setSelectedPartDetails(null);
            setShowAddModal(true);
          }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition flex items-center gap-2"
        >
          <Plus size={18} />
          Record Part Usage
        </button>
      </div>

      {partsUsage.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900">Total Parts Cost (Will be deducted from rider salary)</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                ₹{totalUsageCost.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-700">{partsUsage.length} part(s) recorded</p>
              <p className="text-xs text-blue-600 mt-1">This will appear as a deduction in the payroll</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        {partsUsage.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-slate-600">No parts recorded yet for this ticket</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Part Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Unit Cost</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Total Cost</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Recorded Date</th>
                </tr>
              </thead>
              <tbody>
                {partsUsage.map((usage) => (
                  <tr key={usage.id} className="border-b border-slate-200 hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">{usage.part_name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-mono text-slate-600">{usage.part_code || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">₹{usage.unit_cost.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">{usage.quantity_used}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-red-600">₹{(usage.unit_cost * usage.quantity_used).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
                      <p className="text-xs text-red-500 mt-1">Deduction</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600">{new Date(usage.usage_date).toLocaleDateString('en-IN')}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-xl font-bold text-slate-900">Record Parts Usage</h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setFormData({ partId: '', quantityUsed: 1 });
                  setSelectedPartDetails(null);
                }}
                className="p-1 hover:bg-slate-100 rounded-lg transition"
              >
                <X size={20} className="text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleAddPartUsage} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Select Part *</label>
                {parts.length === 0 ? (
                  <div className="w-full px-4 py-3 border border-red-300 bg-red-50 text-red-700 rounded-lg text-sm">
                    <p className="font-medium">⚠️ No parts available in inventory</p>
                    <p className="text-xs mt-1">Please add parts to the inventory first or check stock levels.</p>
                  </div>
                ) : (
                  <select
                    required
                    value={formData.partId}
                    onChange={(e) => handlePartSelect(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  >
                    <option value="">Choose a part from inventory...</option>
                    {parts.map((part) => (
                      <option key={part.id} value={part.id}>
                        {part.part_name} (Code: {part.part_code}) - {part.quantity_in_stock} in stock
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {selectedPartDetails && (
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-slate-600">Unit Cost</p>
                      <p className="text-lg font-bold text-slate-900">₹{selectedPartDetails.unit_cost.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Available Stock</p>
                      <p className="text-lg font-bold text-slate-900">{selectedPartDetails.quantity_in_stock}</p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Quantity Used *</label>
                <input
                  type="number"
                  min="1"
                  max={selectedPartDetails?.quantity_in_stock || 999}
                  required
                  value={formData.quantityUsed}
                  onChange={(e) => setFormData({ ...formData, quantityUsed: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              {selectedPartDetails && (
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <p className="text-sm font-medium text-red-900 mb-2">Deduction Details</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-red-700">
                        {formData.quantityUsed} × ₹{selectedPartDetails.unit_cost.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-red-600">
                      ₹{totalCost.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <p className="text-xs text-red-600 mt-2">
                    ⚠️ This amount will be deducted from the rider's salary for this week
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  type="submit"
                  disabled={submitting || !formData.partId || parts.length === 0}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {submitting ? 'Recording...' : 'Record Part Usage'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({ partId: '', quantityUsed: 1 });
                    setSelectedPartDetails(null);
                  }}
                  className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
