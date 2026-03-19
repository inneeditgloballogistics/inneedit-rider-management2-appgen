'use client';

import { useState, useEffect } from 'react';
import { Pencil, AlertCircle, X, CheckCircle, Wrench } from 'lucide-react';

interface Vehicle {
  id: number;
  vehicle_number: string;
  vehicle_type: string;
  model: string;
  year: number;
  assigned_rider_id: string;
  status: string;
  hub_id: number;
}

export default function TechnicianVehicleManagement({ vehicles, onRefresh, technicianId }: { vehicles: Vehicle[], onRefresh?: () => void, technicianId: string }) {
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showRepairModal, setShowRepairModal] = useState(false);
  const [repairNotes, setRepairNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleEditClick = (vehicle: Vehicle) => {
    if (vehicle.status === 'in_maintenance') {
      setSelectedVehicle(vehicle);
      setRepairNotes('');
      setShowRepairModal(true);
    } else {
      alert('Only vehicles in maintenance can be marked as repaired');
    }
  };

  const handleMarkRepaired = async () => {
    if (!selectedVehicle) return;

    setSubmitting(true);
    try {
      // Update vehicle status to repaired
      const response = await fetch('/api/vehicles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedVehicle.id,
          status: 'repair_completed',
          vehicle_number: selectedVehicle.vehicle_number,
          vehicle_type: selectedVehicle.vehicle_type,
          model: selectedVehicle.model,
          year: selectedVehicle.year,
          hub_id: selectedVehicle.hub_id,
          assigned_rider_id: selectedVehicle.assigned_rider_id
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update vehicle status');
      }

      // Find the service ticket for this vehicle with "Resolved" status
      const ticketsResponse = await fetch(`/api/service-tickets?action=technician&technicianId=${technicianId}`);
      const tickets = await ticketsResponse.json();
      
      const vehicleTicket = tickets.find((t: any) => {
        return t.vehicle_number === selectedVehicle.vehicle_number && t.status === 'Resolved';
      });

      if (vehicleTicket) {
        // Send notification to hub manager
        const notificationResponse = await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'vehicle_ready_for_inspection',
            title: 'Vehicle Ready for Inspection',
            message: `Vehicle ${selectedVehicle.vehicle_number} has been repaired and is ready for inspection. Ticket: ${vehicleTicket.ticket_number}`,
            related_id: selectedVehicle.id,
            recipient_type: 'hub_manager',
            recipient_id: selectedVehicle.hub_id,
            vehicle_info: {
              vehicle_number: selectedVehicle.vehicle_number,
              vehicle_type: selectedVehicle.vehicle_type,
              ticket_id: vehicleTicket.id,
              ticket_number: vehicleTicket.ticket_number
            }
          })
        });

        if (!notificationResponse.ok) {
          console.warn('Notification failed but vehicle updated');
        }
      }

      alert('✅ Vehicle marked as repaired! Hub manager will be notified to inspect it.');
      setShowRepairModal(false);
      setSelectedVehicle(null);
      setRepairNotes('');
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error marking vehicle as repaired:', error);
      alert('Failed to mark vehicle as repaired');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'assigned':
        return 'bg-blue-100 text-blue-800';
      case 'in_maintenance':
        return 'bg-red-100 text-red-800';
      case 'repair_completed':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in_maintenance':
        return 'In Maintenance';
      case 'repair_completed':
        return 'Repair Completed - Awaiting Inspection';
      case 'available':
        return 'Available';
      case 'assigned':
        return 'Assigned';
      default:
        return status;
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Vehicle Management</h2>
          <p className="text-sm text-gray-600 mt-1">Mark vehicles as repaired to notify hub manager for inspection</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-xs text-gray-600 uppercase tracking-wider bg-gray-50">
                  <th className="px-6 py-4 font-semibold">Vehicle Number</th>
                  <th className="px-6 py-4 font-semibold">Type</th>
                  <th className="px-6 py-4 font-semibold">Model</th>
                  <th className="px-6 py-4 font-semibold">Year</th>
                  <th className="px-6 py-4 font-semibold">Assigned Rider</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {vehicles.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p>No vehicles assigned to your hub</p>
                    </td>
                  </tr>
                ) : (
                  vehicles.map((vehicle) => (
                    <tr key={vehicle.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-4 font-mono font-bold text-gray-900">{vehicle.vehicle_number}</td>
                      <td className="px-6 py-4 text-gray-700">{vehicle.vehicle_type}</td>
                      <td className="px-6 py-4 text-gray-700">{vehicle.model || '-'}</td>
                      <td className="px-6 py-4 text-gray-700">{vehicle.year || '-'}</td>
                      <td className="px-6 py-4 text-gray-700 font-medium">
                        {vehicle.assigned_rider_id ? (
                          <span className="text-gray-900">{vehicle.assigned_rider_id}</span>
                        ) : (
                          <span className="text-gray-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${getStatusColor(vehicle.status)}`}>
                          {getStatusLabel(vehicle.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {vehicle.status === 'in_maintenance' ? (
                          <button
                            onClick={() => handleEditClick(vehicle)}
                            className="px-4 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-all flex items-center gap-2"
                          >
                            <Pencil size={16} />
                            Mark Repaired
                          </button>
                        ) : vehicle.status === 'repair_completed' ? (
                          <div className="flex items-center gap-2 px-3 py-2 bg-orange-100 text-orange-700 rounded-lg text-xs font-semibold">
                            <AlertCircle size={14} />
                            Pending Inspection
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Mark Repaired Modal */}
      {showRepairModal && selectedVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-amber-600" />
                  Mark Vehicle as Repaired
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Notify hub manager that the vehicle is ready for inspection
                </p>
              </div>
              <button
                onClick={() => {
                  setShowRepairModal(false);
                  setSelectedVehicle(null);
                }}
                className="p-1 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-6">
              {/* Vehicle Info */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Vehicle Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 font-medium">Vehicle Number</p>
                    <p className="text-gray-900 font-mono font-bold mt-1">{selectedVehicle.vehicle_number}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-medium">Type</p>
                    <p className="text-gray-900 font-semibold mt-1">{selectedVehicle.vehicle_type}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-medium">Model</p>
                    <p className="text-gray-900 font-semibold mt-1">{selectedVehicle.model || '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-medium">Assigned Rider</p>
                    <p className="text-gray-900 font-semibold mt-1">{selectedVehicle.assigned_rider_id || 'Unassigned'}</p>
                  </div>
                </div>
              </div>

              {/* Confirmation Message */}
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Confirmation</h4>
                <p className="text-sm text-gray-700">
                  Once you mark this vehicle as repaired:
                </p>
                <ul className="mt-3 space-y-2 text-sm text-gray-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-amber-600" />
                    Hub manager will receive a notification
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-amber-600" />
                    Vehicle will appear in "Vehicle Inspection" tab
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-amber-600" />
                    Hub manager will inspect and confirm availability
                  </li>
                </ul>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={repairNotes}
                  onChange={(e) => setRepairNotes(e.target.value)}
                  placeholder="Any additional information about the repair..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900 resize-none"
                  rows={4}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowRepairModal(false);
                    setSelectedVehicle(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-all"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleMarkRepaired}
                  className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Marking...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      Mark as Repaired
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
