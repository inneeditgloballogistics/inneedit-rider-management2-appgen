'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Truck, X, Loader } from 'lucide-react';

interface SwapRequest {
  id: number;
  ticket_number: string;
  rider_name: string;
  rider_cee_id: string;
  rider_phone: string;
  current_vehicle_number: string;
  current_vehicle_type: string;
  issue_reason: string;
  technician_notes: string;
  status: string;
  hub_name: string;
  technician_name: string;
  created_at: string;
}

interface Vehicle {
  id: number;
  vehicle_number: string;
  vehicle_type: string;
  model: string;
  year: number;
  status: string;
}

export default function SwapRequestsManager({ hubId }: { hubId: number }) {
  const [requests, setRequests] = useState<SwapRequest[]>([]);
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<SwapRequest | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [repairCost, setRepairCost] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  useEffect(() => {
    fetchPendingRequests();
  }, [hubId]);

  useEffect(() => {
    if (showApprovalModal && hubId) {
      fetchAvailableVehicles();
    }
  }, [showApprovalModal, hubId]);

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/swap-requests?action=hub-manager&hubId=${hubId}&status=pending`);
      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      }
    } catch (error) {
      console.error('Error fetching swap requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableVehicles = async () => {
    try {
      const response = await fetch(`/api/vehicle-swap?action=available-for-swap&hubId=${hubId}`);
      if (response.ok) {
        const data = await response.json();
        setAvailableVehicles(data);
      }
    } catch (error) {
      console.error('Error fetching available vehicles:', error);
    }
  };

  const handleApproveRequest = async () => {
    if (!selectedRequest || !selectedVehicle) {
      alert('Please select a replacement vehicle');
      return;
    }

    setSubmitting(true);
    try {
      const hubManager = localStorage.getItem('hubManager');
      const managerData = hubManager ? JSON.parse(hubManager) : null;
      const hubManagerId = managerData?.id || 1;

      const response = await fetch('/api/swap-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          swapRequestId: selectedRequest.id,
          hubManagerId,
          replacementVehicleId: selectedVehicle.id,
          repairCost: parseFloat(repairCost) || 0
        })
      });

      if (response.ok) {
        alert('Swap request approved! The new vehicle is ready for handover.');
        setShowApprovalModal(false);
        setSelectedRequest(null);
        setSelectedVehicle(null);
        setRepairCost('');
        fetchPendingRequests();
      } else {
        const error = await response.json();
        alert(`Failed: ${error.error}`);
      }
    } catch (error) {
      console.error('Error approving swap request:', error);
      alert('Failed to approve swap request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading swap requests...</p>
      </div>
    );
  }

  const pendingCount = requests.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Vehicle Swap Requests</h2>
        <p className="text-sm text-gray-600 mt-1">Review and approve pending vehicle swap requests</p>
      </div>

      {/* Stats */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 font-medium">Pending Swap Requests</p>
            <p className="text-3xl font-bold text-orange-600 mt-1">{pendingCount}</p>
          </div>
          <Truck className="w-12 h-12 text-orange-200" />
        </div>
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {requests.length === 0 ? (
          <div className="p-8 text-center">
            <Truck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No pending swap requests</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {requests.map((request) => (
              <div
                key={request.id}
                className="p-6 hover:bg-gray-50 transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-lg">
                      {request.rider_name} ({request.rider_cee_id})
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Ticket #{request.ticket_number}</p>
                  </div>
                  <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">
                    PENDING
                  </span>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg mb-4">
                  <div>
                    <p className="text-xs text-gray-600 font-medium">Current Vehicle</p>
                    <p className="text-sm font-mono font-semibold text-gray-900">{request.current_vehicle_number}</p>
                    <p className="text-xs text-gray-600 mt-1">{request.current_vehicle_type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-medium">Reason</p>
                    <p className="text-sm font-semibold text-gray-900">{request.issue_reason}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-medium">Technician</p>
                    <p className="text-sm font-semibold text-gray-900">{request.technician_name || 'Not assigned'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-medium">Requested</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {new Date(request.created_at).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                </div>

                {/* Technician Notes */}
                {request.technician_notes && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs font-semibold text-blue-600 mb-1">TECHNICIAN NOTES</p>
                    <p className="text-sm text-blue-800">{request.technician_notes}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedRequest(request);
                      setShowApprovalModal(true);
                      setSelectedVehicle(null);
                      setRepairCost('');
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition flex items-center gap-2"
                  >
                    <CheckCircle size={16} />
                    Approve & Assign
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Approval Modal */}
      {showApprovalModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-white">
              <h3 className="text-xl font-bold text-gray-900">Approve Swap Request</h3>
              <button
                onClick={() => {
                  setShowApprovalModal(false);
                  setSelectedRequest(null);
                  setSelectedVehicle(null);
                }}
                className="p-1 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Request Summary */}
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <p className="text-sm font-semibold text-gray-900 mb-2">
                  {selectedRequest.rider_name} ({selectedRequest.rider_cee_id})
                </p>
                <p className="text-xs text-gray-600">
                  Current: <span className="font-mono">{selectedRequest.current_vehicle_number}</span> • {selectedRequest.current_vehicle_type}
                </p>
                <p className="text-xs text-orange-700 mt-2 font-medium">Reason: {selectedRequest.issue_reason}</p>
              </div>

              {/* Select Replacement Vehicle */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Select Replacement Vehicle *
                </label>
                
                {availableVehicles.length === 0 ? (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
                    <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                    <p className="text-sm text-red-800">No available vehicles for swap at this hub</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto">
                    {availableVehicles.map((vehicle) => (
                      <div
                        key={vehicle.id}
                        onClick={() => setSelectedVehicle(vehicle)}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition ${
                          selectedVehicle?.id === vehicle.id
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                        }`}
                      >
                        <p className="font-semibold text-gray-900">{vehicle.vehicle_number}</p>
                        <p className="text-sm text-gray-600">
                          {vehicle.vehicle_type} • {vehicle.model} • {vehicle.year}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Repair Cost */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Estimated Repair Cost (₹) (Optional)
                </label>
                <input
                  type="number"
                  value={repairCost}
                  onChange={(e) => setRepairCost(e.target.value)}
                  placeholder="Enter repair cost in rupees"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                />
                <p className="text-xs text-gray-500 mt-1">This amount will be deducted from the rider's payout</p>
              </div>

              {/* Info */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-xs font-semibold text-blue-600 mb-2">APPROVAL PROCESS</p>
                <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                  <li>Rider will receive notification with new vehicle details</li>
                  <li>Rider must report to hub to collect replacement vehicle</li>
                  <li>Current vehicle will be marked for maintenance</li>
                  <li>Repair cost will be tracked and deducted automatically</li>
                </ul>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowApprovalModal(false);
                    setSelectedRequest(null);
                    setSelectedVehicle(null);
                  }}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApproveRequest}
                  disabled={!selectedVehicle || submitting}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Approving...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      Approve Swap
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
