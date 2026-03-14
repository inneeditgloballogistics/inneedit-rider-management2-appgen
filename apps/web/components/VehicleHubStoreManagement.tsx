'use client';

export function VehicleList({ vehicles, onAdd }: { vehicles: any[], onAdd: () => void }) {
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
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {vehicles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
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
