'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, FileText, User, Calendar, Wrench } from 'lucide-react';

interface VehicleInspection {
  id: number;
  vehicle_number: string;
  vehicle_type: string;
  model: string;
  latest_ticket_id: number;
  ticket_number: string;
  issue_description: string;
  completion_date: string;
  technician_notes: string;
  technician_name: string;
  rider_name: string;
  rider_cee_id: string;
}

interface Props {
  hubId: number;
  hubManagerId: number;
}

export default function VehicleInspectionManager({ hubId, hubManagerId }: Props) {
  const [vehicles, setVehicles] = useState<VehicleInspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState<number | null>(null);
  const [expandedVehicle, setExpandedVehicle] = useState<number | null>(null);

  useEffect(() => {
    fetchVehiclesForInspection();
  }, [hubId]);

  const fetchVehiclesForInspection = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/vehicles/inspection?action=ready-for-inspection&hubId=${hubId}`
      );
      if (response.ok) {
        const data = await response.json();
        setVehicles(data);
      }
    } catch (error) {
      console.error('Error fetching vehicles for inspection:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReady = async (vehicleId: number) => {
    try {
      setConfirming(vehicleId);
      const response = await fetch('/api/vehicles/inspection', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'confirm-ready',
          vehicleId,
          hubManagerId
        })
      });

      if (response.ok) {
        // Remove vehicle from list
        setVehicles(vehicles.filter(v => v.id !== vehicleId));
        setExpandedVehicle(null);
      } else {
        alert('Failed to confirm vehicle as ready');
      }
    } catch (error) {
      console.error('Error confirming vehicle:', error);
      alert('Error confirming vehicle');
    } finally {
      setConfirming(null);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse"></div>
        <p className="text-slate-500 font-medium">Loading vehicles...</p>
      </div>
    );
  }

  if (vehicles.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
        <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500 font-medium">No vehicles ready for inspection</p>
        <p className="text-xs text-slate-400 mt-2">All vehicles are either available or still under maintenance</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-8 py-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-blue-100">
        <h2 className="text-xl font-bold text-blue-900 flex items-center gap-2">
          <Wrench className="w-6 h-6" />
          Vehicles Ready for Inspection
        </h2>
        <p className="text-sm text-blue-800 mt-1">
          {vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''} completed maintenance. Review and confirm when ready to return to service.
        </p>
      </div>

      <div className="divide-y divide-slate-200">
        {vehicles.map((vehicle) => (
          <div key={vehicle.id} className="hover:bg-blue-50 transition">
            {/* Summary Card */}
            <button
              onClick={() => setExpandedVehicle(expandedVehicle === vehicle.id ? null : vehicle.id)}
              className="w-full text-left px-8 py-6 flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-lg font-bold text-slate-900 font-mono">
                    {vehicle.vehicle_number}
                  </h3>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                    {vehicle.vehicle_type}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <User className="w-4 h-4" />
                    <span>{vehicle.rider_name} ({vehicle.rider_cee_id})</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <FileText className="w-4 h-4" />
                    <span>Ticket #{vehicle.ticket_number}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(vehicle.completion_date)}</span>
                  </div>
                </div>
              </div>

              <div className="ml-6">{expandedVehicle === vehicle.id ? '▼' : '▶'}</div>
            </button>

            {/* Expanded Details */}
            {expandedVehicle === vehicle.id && (
              <div className="px-8 py-6 bg-slate-50 border-t border-slate-200 space-y-6">
                {/* Issue Description */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-2">Issue Description</h4>
                  <p className="text-sm text-slate-700 bg-white p-3 rounded border border-slate-200">
                    {vehicle.issue_description}
                  </p>
                </div>

                {/* Technician Notes */}
                {vehicle.technician_notes && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 mb-2">Technician Notes</h4>
                    <div className="p-4 bg-white rounded border border-slate-200">
                      <p className="text-xs text-slate-600 font-medium mb-2">Technician: {vehicle.technician_name}</p>
                      <p className="text-sm text-slate-700">{vehicle.technician_notes}</p>
                    </div>
                  </div>
                )}

                {/* Vehicle Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-white rounded border border-slate-200">
                  <div>
                    <p className="text-xs text-slate-600 font-medium">Vehicle Number</p>
                    <p className="text-sm font-mono font-bold text-slate-900 mt-1">{vehicle.vehicle_number}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 font-medium">Type</p>
                    <p className="text-sm font-semibold text-slate-900 mt-1">{vehicle.vehicle_type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 font-medium">Model</p>
                    <p className="text-sm font-semibold text-slate-900 mt-1">{vehicle.model}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 font-medium">Completion Date</p>
                    <p className="text-sm font-semibold text-slate-900 mt-1">{formatDate(vehicle.completion_date)}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-slate-200">
                  <button
                    onClick={() => handleConfirmReady(vehicle.id)}
                    disabled={confirming === vehicle.id}
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    {confirming === vehicle.id ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Confirming...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Confirm Ready - Return to Service
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setExpandedVehicle(null)}
                    className="px-6 py-3 bg-slate-200 text-slate-900 rounded-lg font-semibold hover:bg-slate-300 transition">
                    Review Later
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
