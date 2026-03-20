'use client';

import { useState, useEffect } from 'react';
import { Search, Calendar, MapPin, TrendingUp, AlertCircle } from 'lucide-react';

interface SwapRecord {
  id: number;
  ticket_id: number;
  rider_name: string;
  rider_cee_id: string;
  rider_phone: string;
  old_vehicle_number: string;
  old_vehicle_type: string;
  old_model: string;
  new_vehicle_number: string;
  new_vehicle_type: string;
  new_model: string;
  issue_reason: string;
  technician_notes: string;
  status: string;
  created_at: string;
  completed_at: string;
  repair_cost: number;
  hub_name: string;
  hub_code: string;
  ticket_number: string;
}

interface VehicleSwapHistorySearchProps {
  role?: 'admin' | 'hub_manager' | 'technician';
  userHubId?: number;
}

export default function VehicleSwapHistorySearch({
  role = 'admin',
  userHubId
}: VehicleSwapHistorySearchProps) {
  const [searchInput, setSearchInput] = useState('');
  const [swapHistory, setSwapHistory] = useState<SwapRecord[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<SwapRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [expandedSwap, setExpandedSwap] = useState<number | null>(null);

  // Fetch swap history for a specific vehicle
  const handleSearch = async (vehicleNumber: string) => {
    if (!vehicleNumber.trim()) {
      setSwapHistory([]);
      setFilteredHistory([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        vehicleNumber: vehicleNumber.trim(),
        role: role,
        ...(userHubId && { userHubId: userHubId.toString() })
      });

      const response = await fetch(`/api/swap-requests/history?${params}`);
      if (!response.ok) throw new Error('Failed to fetch');

      const data = await response.json();
      setSwapHistory(data || []);
      setFilteredHistory(data || []);
      setSearched(true);
      setSelectedVehicle(vehicleNumber.trim());
    } catch (error) {
      console.error('Error searching swap history:', error);
      setSwapHistory([]);
      setFilteredHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(searchInput);
    }
  };

  // Analyze swap frequency and patterns
  const getSwapStatistics = () => {
    if (!swapHistory || !Array.isArray(swapHistory) || swapHistory.length === 0) return null;

    const totalSwaps = swapHistory.length;
    const completedSwaps = swapHistory.filter(s => s.status === 'completed').length;
    const approvedSwaps = swapHistory.filter(s => s.status === 'approved').length;
    const pendingSwaps = swapHistory.filter(s => s.status === 'pending').length;
    const totalRepairCost = swapHistory.reduce((sum, s) => sum + (s.repair_cost || 0), 0);

    // Get all riders involved
    const uniqueRiders = new Set(swapHistory.map(s => s.rider_cee_id)).size;

    return {
      totalSwaps,
      completedSwaps,
      approvedSwaps,
      pendingSwaps,
      totalRepairCost,
      uniqueRiders,
      lastSwap: swapHistory[0]?.created_at,
      mostRecentStatus: swapHistory[0]?.status
    };
  };

  const stats = getSwapStatistics();

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Kolkata'
      });
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'approved':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'rejected':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Search Section */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl shadow-lg p-8 text-white">
        <h2 className="text-3xl font-bold mb-2">Vehicle Swap History Tracker</h2>
        <p className="text-slate-300 mb-6">
          Search by vehicle number to view complete swap history, incidents, and repair records
        </p>

        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Enter vehicle number (e.g., KA-01-EV-1234)"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
              onKeyPress={handleKeyPress}
              className="w-full pl-12 pr-4 py-3 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>
          <button
            onClick={() => handleSearch(searchInput)}
            disabled={loading || !searchInput.trim()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white rounded-lg font-semibold transition-all flex items-center gap-2 whitespace-nowrap"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Searching...
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                Search
              </>
            )}
          </button>
        </div>
      </div>

      {/* Statistics Section */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
            <p className="text-xs font-semibold text-slate-600 uppercase mb-2">Total Swaps</p>
            <p className="text-3xl font-bold text-slate-900">{stats.totalSwaps}</p>
          </div>

          <div className="bg-green-50 rounded-lg border border-green-200 p-4 shadow-sm">
            <p className="text-xs font-semibold text-green-700 uppercase mb-2">Completed</p>
            <p className="text-3xl font-bold text-green-900">{stats.completedSwaps}</p>
          </div>

          <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 shadow-sm">
            <p className="text-xs font-semibold text-blue-700 uppercase mb-2">Approved</p>
            <p className="text-3xl font-bold text-blue-900">{stats.approvedSwaps}</p>
          </div>

          <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4 shadow-sm">
            <p className="text-xs font-semibold text-yellow-700 uppercase mb-2">Pending</p>
            <p className="text-3xl font-bold text-yellow-900">{stats.pendingSwaps}</p>
          </div>

          <div className="bg-purple-50 rounded-lg border border-purple-200 p-4 shadow-sm">
            <p className="text-xs font-semibold text-purple-700 uppercase mb-2">Unique Riders</p>
            <p className="text-3xl font-bold text-purple-900">{stats.uniqueRiders}</p>
          </div>

          <div className="bg-orange-50 rounded-lg border border-orange-200 p-4 shadow-sm">
            <p className="text-xs font-semibold text-orange-700 uppercase mb-2">Repair Cost</p>
            <p className="text-2xl font-bold text-orange-900">₹{(Number(stats.totalRepairCost) || 0).toFixed(0)}</p>
          </div>
        </div>
      )}

      {/* Results Section */}
      {searched && (
        <>
          {!swapHistory || !Array.isArray(swapHistory) || swapHistory.length === 0 ? (
            <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-12 text-center">
              <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No Swap History Found</h3>
              <p className="text-slate-600">
                {selectedVehicle ? `Vehicle "${selectedVehicle}" has no swap records yet.` : 'Try searching with a vehicle number.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-slate-900">
                  {swapHistory.length} Swap Record{swapHistory.length !== 1 ? 's' : ''} Found
                </h3>
              </div>

              {swapHistory.map((swap, index) => (
                <div
                  key={swap.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-all"
                >
                  {/* Header */}
                  <button
                    onClick={() => setExpandedSwap(expandedSwap === swap.id ? null : swap.id)}
                    className="w-full px-6 py-4 bg-slate-50 hover:bg-slate-100 flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-4 text-left flex-1">
                      <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                        #{index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-mono font-bold text-slate-900">
                            {swap.old_vehicle_number}
                          </span>
                          <span className="text-slate-500">→</span>
                          <span className="font-mono font-bold text-slate-900">
                            {swap.new_vehicle_number}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">
                          Rider: <span className="font-semibold">{swap.rider_name}</span> ({swap.rider_cee_id})
                        </p>
                      </div>
                      <div className="text-right hidden md:block">
                        <p className="text-xs text-slate-500 flex items-center gap-1 justify-end mb-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(swap.created_at)}
                        </p>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(swap.status)}`}>
                          {swap.status?.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className="flex-shrink-0 ml-4">
                      <i className={`ph-bold ph-caret-down text-xl text-slate-500 transition-transform ${expandedSwap === swap.id ? 'rotate-180' : ''}`}></i>
                    </div>
                  </button>

                  {/* Expanded Details */}
                  {expandedSwap === swap.id && (
                    <div className="border-t border-slate-200 p-6 space-y-6">
                      {/* Vehicle Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-slate-50 rounded-lg p-4">
                          <h4 className="font-semibold text-slate-900 mb-3 text-sm uppercase text-slate-600">Original Vehicle</h4>
                          <div className="space-y-2 text-sm">
                            <div>
                              <p className="text-xs text-slate-600">Vehicle Number</p>
                              <p className="font-mono font-bold text-slate-900">{swap.old_vehicle_number}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-600">Type & Model</p>
                              <p className="text-slate-900">{swap.old_vehicle_type} - {swap.old_model}</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                          <h4 className="font-semibold text-slate-900 mb-3 text-sm uppercase text-green-700">Replacement Vehicle</h4>
                          <div className="space-y-2 text-sm">
                            <div>
                              <p className="text-xs text-slate-600">Vehicle Number</p>
                              <p className="font-mono font-bold text-slate-900">{swap.new_vehicle_number}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-600">Type & Model</p>
                              <p className="text-slate-900">{swap.new_vehicle_type} - {swap.new_model}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Rider & Hub Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border border-slate-200 rounded-lg p-4">
                          <h4 className="font-semibold text-slate-900 mb-3 text-sm uppercase text-slate-600">Rider Information</h4>
                          <div className="space-y-2 text-sm">
                            <div>
                              <p className="text-xs text-slate-600">Name</p>
                              <p className="text-slate-900 font-semibold">{swap.rider_name}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-600">CEE ID</p>
                              <p className="font-mono text-slate-900 font-semibold">{swap.rider_cee_id}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-600">Phone</p>
                              <p className="text-slate-900">{swap.rider_phone}</p>
                            </div>
                          </div>
                        </div>

                        <div className="border border-slate-200 rounded-lg p-4">
                          <h4 className="font-semibold text-slate-900 mb-3 text-sm uppercase text-slate-600">Hub Information</h4>
                          <div className="space-y-2 text-sm">
                            <div>
                              <p className="text-xs text-slate-600">Hub Name</p>
                              <p className="text-slate-900 font-semibold">{swap.hub_name}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-600">Hub Code</p>
                              <p className="font-mono text-slate-900 font-semibold">{swap.hub_code}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-600">Ticket</p>
                              <p className="text-slate-900">{swap.ticket_number || 'N/A'}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Issue & Timeline */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border border-slate-200 rounded-lg p-4">
                          <h4 className="font-semibold text-slate-900 mb-2 text-sm uppercase text-slate-600">Issue Reason</h4>
                          <p className="text-slate-900 text-sm leading-relaxed">{swap.issue_reason || 'Not specified'}</p>
                        </div>

                        <div className="border border-slate-200 rounded-lg p-4">
                          <h4 className="font-semibold text-slate-900 mb-2 text-sm uppercase text-slate-600">Technician Notes</h4>
                          <p className="text-slate-900 text-sm leading-relaxed">{swap.technician_notes || 'No notes provided'}</p>
                        </div>
                      </div>

                      {/* Timeline & Status */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="border border-slate-200 rounded-lg p-4">
                          <h4 className="font-semibold text-slate-900 mb-2 text-sm uppercase text-slate-600">Status</h4>
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(swap.status)}`}>
                            {swap.status?.toUpperCase()}
                          </span>
                        </div>

                        <div className="border border-slate-200 rounded-lg p-4">
                          <h4 className="font-semibold text-slate-900 mb-2 text-sm uppercase text-slate-600">Created</h4>
                          <p className="text-slate-900 text-sm">{formatDate(swap.created_at)}</p>
                        </div>

                        <div className="border border-slate-200 rounded-lg p-4">
                          <h4 className="font-semibold text-slate-900 mb-2 text-sm uppercase text-slate-600">Completed</h4>
                          <p className="text-slate-900 text-sm">{swap.completed_at ? formatDate(swap.completed_at) : 'Pending'}</p>
                        </div>
                      </div>

                      {/* Repair Cost */}
                      {swap.repair_cost > 0 && (
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                          <h4 className="font-semibold text-slate-900 mb-2 text-sm uppercase text-orange-700">Repair Cost</h4>
                          <p className="text-2xl font-bold text-orange-900">₹{swap.repair_cost.toFixed(2)}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!searched && (
        <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 p-12 text-center">
          <Search className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Start Searching</h3>
          <p className="text-slate-600">
            Enter a vehicle number above to view its complete swap history and maintenance records
          </p>
        </div>
      )}
    </div>
  );
}
