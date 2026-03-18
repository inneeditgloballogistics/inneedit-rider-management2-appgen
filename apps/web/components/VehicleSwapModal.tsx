'use client';

import { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle, Loader } from 'lucide-react';

interface Vehicle {
  id: number;
  vehicle_number: string;
  vehicle_type: string;
  model: string;
  year: number;
  status: string;
  assigned_rider_id: string | null;
  assigned_rider_name?: string;
}

interface VehicleSwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  oldVehicle: Vehicle | null;
  riderCeeId: string;
  riderName: string;
  hubId: number;
  onSwapComplete?: () => void;
}

export default function VehicleSwapModal({
  isOpen,
  onClose,
  oldVehicle,
  riderCeeId,
  riderName,
  hubId,
  onSwapComplete
}: VehicleSwapModalProps) {
  const [step, setStep] = useState<'select' | 'confirm' | 'success' | 'error'>('select');
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);
  const [selectedNewVehicle, setSelectedNewVehicle] = useState<Vehicle | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [ticketNumber, setTicketNumber] = useState('');

  // Fetch available vehicles when modal opens
  useEffect(() => {
    if (isOpen && hubId) {
      fetchAvailableVehicles();
    }
  }, [isOpen, hubId]);

  const fetchAvailableVehicles = async () => {
    try {
      const response = await fetch(`/api/vehicle-swap?action=available-for-swap&hubId=${hubId}`);
      if (response.ok) {
        const vehicles = await response.json();
        setAvailableVehicles(vehicles);
      }
    } catch (err) {
      console.error('Error fetching available vehicles:', err);
    }
  };

  const handleSwap = async () => {
    if (!selectedNewVehicle || !oldVehicle) {
      setError('Please select a vehicle to swap');
      return;
    }

    if (selectedNewVehicle.id === oldVehicle.id) {
      setError('Please select a different vehicle');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/vehicle-swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'perform-swap',
          oldVehicleId: oldVehicle.id,
          newVehicleId: selectedNewVehicle.id,
          riderCeeId,
          hubId,
          notes
        })
      });

      const data = await response.json();

      if (response.ok) {
        setTicketNumber(data.ticketNumber);
        setSuccessMessage(
          `Vehicle swap completed! Rider ${riderName} now has vehicle ${selectedNewVehicle.vehicle_number}. ` +
          `Vehicle ${oldVehicle.vehicle_number} marked for maintenance.`
        );
        setStep('success');
        
        // Refresh available vehicles
        setTimeout(() => {
          fetchAvailableVehicles();
        }, 1000);
      } else {
        setError(data.error || 'Failed to perform swap');
        setStep('error');
      }
    } catch (err: any) {
      setError(err?.message || 'An error occurred during swap');
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('select');
    setSelectedNewVehicle(null);
    setNotes('');
    setError('');
    setSuccessMessage('');
    setTicketNumber('');
    onClose();
  };

  const handleSuccessClose = () => {
    handleClose();
    if (onSwapComplete) {
      onSwapComplete();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Vehicle Swap</h2>
          <button
            onClick={handleClose}
            className="p-1 text-slate-500 hover:text-slate-700 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'select' && (
            <>
              {/* Current Vehicle Info */}
              {oldVehicle && (
                <div className="mb-8 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-600 mb-3">Current Vehicle</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-500">Vehicle Number</p>
                      <p className="text-sm font-semibold text-slate-900">{oldVehicle.vehicle_number}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Type</p>
                      <p className="text-sm font-semibold text-slate-900">{oldVehicle.vehicle_type}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Model</p>
                      <p className="text-sm font-semibold text-slate-900">{oldVehicle.model || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Year</p>
                      <p className="text-sm font-semibold text-slate-900">{oldVehicle.year || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Rider Info */}
              <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">Rider Details</h3>
                <p className="text-sm text-blue-800">{riderName}</p>
                <p className="text-sm text-blue-700 font-medium">CEE ID: {riderCeeId}</p>
              </div>

              {/* Available Vehicles Selection */}
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-slate-900 mb-4">
                  Select Replacement Vehicle
                </h3>
                
                {availableVehicles.length === 0 ? (
                  <div className="p-6 bg-amber-50 border border-amber-200 rounded-lg text-center">
                    <AlertCircle className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                    <p className="text-sm text-amber-800">
                      No available vehicles for swap at this hub
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
                    {availableVehicles.map((vehicle) => (
                      <div
                        key={vehicle.id}
                        onClick={() => setSelectedNewVehicle(vehicle)}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition ${
                          selectedNewVehicle?.id === vehicle.id
                            ? 'border-green-500 bg-green-50'
                            : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-slate-900">{vehicle.vehicle_number}</p>
                            <p className="text-sm text-slate-600">
                              {vehicle.vehicle_type} • {vehicle.model} • {vehicle.year}
                            </p>
                          </div>
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
                            Available
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="mb-8">
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Swap Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about this vehicle swap (e.g., issues to be repaired)..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (selectedNewVehicle) {
                      setStep('confirm');
                    } else {
                      setError('Please select a vehicle to proceed');
                    }
                  }}
                  disabled={!selectedNewVehicle || loading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-slate-300 transition"
                >
                  {loading ? 'Processing...' : 'Continue'}
                </button>
              </div>
            </>
          )}

          {step === 'confirm' && oldVehicle && selectedNewVehicle && (
            <>
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex gap-3 items-start">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-semibold mb-1">Confirm Vehicle Swap</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Old vehicle will be marked as <strong>In Maintenance</strong></li>
                      <li>New vehicle will be assigned to rider <strong>{riderName}</strong></li>
                      <li>A service ticket will be created for the old vehicle</li>
                      <li>Rider will receive a notification</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Swap Summary */}
              <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-xs text-slate-500 font-semibold mb-2">FROM</p>
                  <p className="text-sm font-bold text-slate-900">{oldVehicle.vehicle_number}</p>
                  <p className="text-xs text-slate-600 mt-1">Currently assigned</p>
                </div>
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-300">→</p>
                  </div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-xs text-green-700 font-semibold mb-2">TO</p>
                  <p className="text-sm font-bold text-green-900">{selectedNewVehicle.vehicle_number}</p>
                  <p className="text-xs text-green-700 mt-1">New assignment</p>
                </div>
              </div>

              {/* Rider Info */}
              <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-semibold text-blue-900">Rider: {riderName} ({riderCeeId})</p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setStep('select');
                    setError('');
                  }}
                  disabled={loading}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 disabled:bg-slate-100 transition"
                >
                  Back
                </button>
                <button
                  onClick={handleSwap}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-slate-300 flex items-center justify-center gap-2 transition"
                >
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Confirm Swap'
                  )}
                </button>
              </div>
            </>
          )}

          {step === 'success' && (
            <>
              <div className="text-center mb-6">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Swap Completed!</h3>
                <p className="text-slate-600">{successMessage}</p>
              </div>

              {ticketNumber && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-600 font-semibold mb-1">SERVICE TICKET</p>
                  <p className="text-lg font-bold text-blue-900">{ticketNumber}</p>
                  <p className="text-xs text-blue-700 mt-1">Created for vehicle maintenance</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleSuccessClose}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
                >
                  Done
                </button>
              </div>
            </>
          )}

          {step === 'error' && (
            <>
              <div className="text-center mb-6">
                <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Swap Failed</h3>
                <p className="text-red-600 font-medium">{error}</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setStep('select');
                    setError('');
                  }}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition"
                >
                  Back
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 bg-slate-600 text-white rounded-lg font-semibold hover:bg-slate-700 transition"
                >
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
