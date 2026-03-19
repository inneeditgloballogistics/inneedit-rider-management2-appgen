'use client';

import { useState } from 'react';
import { Eye, Pencil, Trash2, CheckCircle } from 'lucide-react';

export function VehicleList({ vehicles, onAdd, onRefresh }: { vehicles: any[], onAdd: () => void, onRefresh?: () => void }) {
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [selectedVehicleNumber, setSelectedVehicleNumber] = useState<string>('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [riders, setRiders] = useState<any[]>([]);
  const [selectedRiderId, setSelectedRiderId] = useState<string>('');
  const [isLoadingRiders, setIsLoadingRiders] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  const openAssignModal = async (vehicleId: number, vehicleNumber: string) => {
    setSelectedVehicleId(vehicleId);
    setSelectedVehicleNumber(vehicleNumber);
    setSelectedRiderId('');
    setShowAssignModal(true);
    
    // Fetch available riders
    setIsLoadingRiders(true);
    try {
      const response = await fetch('/api/riders');
      const data = await response.json();
      console.log('Fetched riders:', data.riders);
      // Filter only unassigned riders (those without a vehicle)
      const unassignedRiders = data.riders.filter((rider: any) => !rider.assigned_vehicle_id);
      console.log('Unassigned riders:', unassignedRiders);
      setRiders(unassignedRiders);
    } catch (error) {
      console.error('Error fetching riders:', error);
      alert('Failed to load riders');
    }
    setIsLoadingRiders(false);
  };

  const handleAssignRider = async () => {
    if (!selectedVehicleId || !selectedRiderId) {
      alert('Please select a rider');
      return;
    }

    setIsAssigning(true);
    try {
      // Get the selected rider's details
      const rider = riders.find((r: any) => r.id === parseInt(selectedRiderId));
      if (!rider) {
        alert('Rider not found');
        return;
      }

      // Update the vehicle with the rider assignment
      const response = await fetch('/api/vehicles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedVehicleId,
          assigned_rider_id: rider.cee_id,
          status: 'assigned',
          vehicle_number: vehicles.find(v => v.id === selectedVehicleId)?.vehicle_number,
          vehicle_type: vehicles.find(v => v.id === selectedVehicleId)?.vehicle_type,
          model: vehicles.find(v => v.id === selectedVehicleId)?.model,
          year: vehicles.find(v => v.id === selectedVehicleId)?.year,
          hub_id: vehicles.find(v => v.id === selectedVehicleId)?.hub_id
        })
      });

      if (!response.ok) {
        const error = await response.json();
        alert('Error: ' + (error.error || 'Failed to assign vehicle'));
        return;
      }

      // Update the rider's assigned_vehicle_id
      const updateRiderResponse = await fetch('/api/riders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: rider.id,
          assigned_vehicle_id: selectedVehicleId
        })
      });

      if (!updateRiderResponse.ok) {
        console.error('Failed to update rider vehicle assignment');
      }

      alert(`Vehicle assigned successfully to ${rider.full_name}`);
      setShowAssignModal(false);
      setSelectedVehicleId(null);
      setSelectedRiderId('');
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error assigning vehicle:', error);
      alert('Error: ' + (error instanceof Error ? error.message : 'Failed to assign vehicle'));
    }
    setIsAssigning(false);
  };

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-200/60">
        <div>
          <h2 className="font-display text-3xl font-bold text-slate-900">Vehicle Management</h2>
          <p className="text-slate-500 mt-2">Manage fleet vehicles and assignments</p>
        </div>
        <button onClick={onAdd} className="px-4 py-2 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600 transition-all flex items-center gap-2">
          <i className="ph-bold ph-plus"></i> Add Vehicle
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs text-slate-400 uppercase tracking-wider bg-slate-50/50">
                <th className="px-6 py-4 font-medium">Vehicle Number</th>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium">Model</th>
                <th className="px-6 py-4 font-medium">Year</th>
                <th className="px-6 py-4 font-medium">Hub</th>
                <th className="px-6 py-4 font-medium">Assigned Rider</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {vehicles.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                    No vehicles found. Click &quot;Add Vehicle&quot; to get started.
                  </td>
                </tr>
              ) : (
                vehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="group hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">{vehicle.vehicle_number}</td>
                    <td className="px-6 py-4 text-slate-600">{vehicle.vehicle_type}</td>
                    <td className="px-6 py-4 text-slate-600">{vehicle.model || '-'}</td>
                    <td className="px-6 py-4 text-slate-600">{vehicle.year || '-'}</td>
                    <td className="px-6 py-4 text-slate-600">Hub #{vehicle.hub_id || '-'}</td>
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      {vehicle.assigned_rider_id ? (
                        <span className="text-slate-900">{vehicle.assigned_rider_id}</span>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        vehicle.status === 'available' ? 'bg-green-100 text-green-800' :
                        vehicle.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {vehicle.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex gap-2 items-center">
                      {vehicle.status === 'available' && !vehicle.assigned_rider_id && (
                        <button
                          onClick={() => openAssignModal(vehicle.id, vehicle.vehicle_number)}
                          className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-all"
                          title="Assign Rider"
                        >
                          <CheckCircle size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => {}}
                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-all"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => {}}
                        className="p-2 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 transition-all"
                        title="Edit Vehicle"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => {}}
                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all"
                        title="Delete Vehicle"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Rider Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">Assign Vehicle to Rider</h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-slate-500 hover:text-slate-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Vehicle: <span className="font-bold text-slate-900">{selectedVehicleNumber}</span>
                </label>
              </div>

              <div>
                <label htmlFor="rider-select" className="block text-sm font-medium text-slate-700 mb-2">
                  Select Rider
                </label>
                <select
                  id="rider-select"
                  value={selectedRiderId}
                  onChange={(e) => setSelectedRiderId(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900"
                  disabled={isLoadingRiders}
                >
                  <option value="">{isLoadingRiders ? 'Loading riders...' : 'Choose a rider'}</option>
                  {riders.map((rider) => (
                    <option key={rider.id} value={rider.id}>
                      {rider.full_name} ({rider.cee_id})
                    </option>
                  ))}
                </select>
                {riders.length === 0 && !isLoadingRiders && (
                  <p className="text-sm text-slate-500 mt-2">No unassigned riders available</p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition-all"
                  disabled={isAssigning}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignRider}
                  className="flex-1 px-4 py-2 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600 transition-all disabled:opacity-50"
                  disabled={!selectedRiderId || isAssigning}
                >
                  {isAssigning ? 'Assigning...' : 'Assign'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function HubList({ hubs, onAdd }: { hubs: any[], onAdd: () => void }) {
  return (
    <>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-200/60">
        <div>
          <h2 className="font-display text-3xl font-bold text-slate-900">Hub Management</h2>
          <p className="text-slate-500 mt-2">Manage operational hubs</p>
        </div>
        <button onClick={onAdd} className="px-4 py-2 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600 transition-all flex items-center gap-2">
          <i className="ph-bold ph-plus"></i> Add Hub
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs text-slate-400 uppercase tracking-wider bg-slate-50/50">
                <th className="px-6 py-4 font-medium">Hub Name</th>
                <th className="px-6 py-4 font-medium">Code</th>
                <th className="px-6 py-4 font-medium">Location</th>
                <th className="px-6 py-4 font-medium">Manager</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {hubs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No hubs found.
                  </td>
                </tr>
              ) : (
                hubs.map((hub) => (
                  <tr key={hub.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{hub.hub_name}</td>
                    <td className="px-6 py-4 font-mono text-slate-600">{hub.hub_code}</td>
                    <td className="px-6 py-4 text-slate-600">{hub.location}</td>
                    <td className="px-6 py-4 text-slate-600">{hub.manager_name || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        hub.status === 'active' ? 'bg-green-100 text-green-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {hub.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export function StoreList({ stores, onAdd }: { stores: any[], onAdd: () => void }) {
  return (
    <>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-200/60">
        <div>
          <h2 className="font-display text-3xl font-bold text-slate-900">Store Management</h2>
          <p className="text-slate-500 mt-2">Manage partner stores</p>
        </div>
        <button onClick={onAdd} className="px-4 py-2 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600 transition-all flex items-center gap-2">
          <i className="ph-bold ph-plus"></i> Add Store
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs text-slate-400 uppercase tracking-wider bg-slate-50/50">
                <th className="px-6 py-4 font-medium">Store Name</th>
                <th className="px-6 py-4 font-medium">Code</th>
                <th className="px-6 py-4 font-medium">Location</th>
                <th className="px-6 py-4 font-medium">Contact</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {stores.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No stores found.
                  </td>
                </tr>
              ) : (
                stores.map((store) => (
                  <tr key={store.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{store.store_name}</td>
                    <td className="px-6 py-4 font-mono text-slate-600">{store.store_code}</td>
                    <td className="px-6 py-4 text-slate-600">{store.location}</td>
                    <td className="px-6 py-4 text-slate-600">{store.contact_person || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        store.status === 'active' ? 'bg-green-100 text-green-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {store.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
