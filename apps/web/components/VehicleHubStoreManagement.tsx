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
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {vehicles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
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

export function HubList({ hubs, onAdd }: { hubs: any[], onAdd: () => void }) {
  return (
    <>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-200/60">
        <div>
          <h2 className="font-display text-3xl font-bold text-slate-900">Hub Management</h2>
          <p className="text-slate-500 mt-2">Manage operational hubs and locations</p>
        </div>
        <button onClick={onAdd} className="px-4 py-2 bg-secondary-600 text-white rounded-lg font-medium hover:bg-secondary-700 transition-all flex items-center gap-2">
          <i className="ph-bold ph-plus"></i> Add Hub
        </button>
      </div>

      {hubs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
          <i className="ph-duotone ph-buildings text-6xl text-slate-300 mb-4"></i>
          <p className="text-slate-500">No hubs found. Click &quot;Add Hub&quot; to create your first hub.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hubs.map((hub) => (
            <div key={hub.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-3">
                <div className="w-12 h-12 bg-secondary-100 rounded-xl flex items-center justify-center">
                  <i className="ph-duotone ph-buildings text-2xl text-secondary-600"></i>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                  hub.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {hub.status}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">{hub.hub_name}</h3>
              <p className="text-sm text-slate-500 mb-3">{hub.hub_code}</p>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <i className="ph ph-map-pin text-slate-400 mt-0.5"></i>
                  <span className="text-slate-600">{hub.location}, {hub.city}</span>
                </div>
                {hub.manager_name && (
                  <div className="flex items-start gap-2">
                    <i className="ph ph-user text-slate-400 mt-0.5"></i>
                    <span className="text-slate-600">{hub.manager_name}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export function StoreList({ stores, onAdd }: { stores: any[], onAdd: () => void }) {
  return (
    <>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-200/60">
        <div>
          <h2 className="font-display text-3xl font-bold text-slate-900">Store Management</h2>
          <p className="text-slate-500 mt-2">Manage client stores and delivery locations</p>
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
                <th className="px-6 py-4 font-medium">Client</th>
                <th className="px-6 py-4 font-medium">Location</th>
                <th className="px-6 py-4 font-medium">Contact</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {stores.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No stores found. Click &quot;Add Store&quot; to get started.
                  </td>
                </tr>
              ) : (
                stores.map((store) => (
                  <tr key={store.id} className="group hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900">{store.store_name}</td>
                    <td className="px-6 py-4 font-mono text-slate-600">{store.store_code}</td>
                    <td className="px-6 py-4 text-slate-600">{store.client}</td>
                    <td className="px-6 py-4 text-slate-600">{store.city}, {store.state}</td>
                    <td className="px-6 py-4 text-slate-600">{store.contact_person || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        store.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'
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
