'use client';

export function AddModal({ 
  show, 
  onClose, 
  type, 
  onSubmit, 
  formData, 
  setFormData 
}: { 
  show: boolean; 
  onClose: () => void; 
  type: 'vehicle' | 'hub' | 'store'; 
  onSubmit: (e: React.FormEvent) => void;
  formData: any;
  setFormData: (data: any) => void;
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-2xl font-bold text-slate-900">
            Add New {type === 'vehicle' ? 'Vehicle' : type === 'hub' ? 'Hub' : 'Store'}
          </h3>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          {type === 'vehicle' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Vehicle Number*</label>
                <input 
                  type="text" 
                  required 
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none" 
                  onChange={(e) => setFormData({...formData, vehicle_number: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Vehicle Type*</label>
                <select 
                  required 
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none" 
                  onChange={(e) => setFormData({...formData, vehicle_type: e.target.value})}
                >
                  <option value="">Select type</option>
                  <option value="Electric Scooter">Electric Scooter</option>
                  <option value="Petrol Scooter">Petrol Scooter</option>
                  <option value="Motorcycle">Motorcycle</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Model</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none" 
                    onChange={(e) => setFormData({...formData, model: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Year</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none" 
                    onChange={(e) => setFormData({...formData, year: e.target.value})} 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                <select 
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none" 
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="available">Available</option>
                  <option value="assigned">Assigned</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            </>
          )}

          {type === 'hub' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Hub Name*</label>
                <input 
                  type="text" 
                  required 
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none" 
                  onChange={(e) => setFormData({...formData, hub_name: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Hub Code*</label>
                <input 
                  type="text" 
                  required 
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none" 
                  onChange={(e) => setFormData({...formData, hub_code: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Location*</label>
                <input 
                  type="text" 
                  required 
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none" 
                  onChange={(e) => setFormData({...formData, location: e.target.value})} 
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">City</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none" 
                    onChange={(e) => setFormData({...formData, city: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">State</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none" 
                    onChange={(e) => setFormData({...formData, state: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Pincode</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none" 
                    onChange={(e) => setFormData({...formData, pincode: e.target.value})} 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Manager Name</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none" 
                    onChange={(e) => setFormData({...formData, manager_name: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Manager Phone</label>
                  <input 
                    type="tel" 
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none" 
                    onChange={(e) => setFormData({...formData, manager_phone: e.target.value})} 
                  />
                </div>
              </div>
            </>
          )}

          {type === 'store' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Store Name*</label>
                <input 
                  type="text" 
                  required 
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" 
                  onChange={(e) => setFormData({...formData, store_name: e.target.value})} 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Store Code*</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" 
                    onChange={(e) => setFormData({...formData, store_code: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Client*</label>
                  <select 
                    required 
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" 
                    onChange={(e) => setFormData({...formData, client: e.target.value})}
                  >
                    <option value="">Select client</option>
                    <option value="BigBasket">BigBasket</option>
                    <option value="Zepto">Zepto</option>
                    <option value="Blinkit">Blinkit</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Location*</label>
                <input 
                  type="text" 
                  required 
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" 
                  onChange={(e) => setFormData({...formData, location: e.target.value})} 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Latitude</label>
                  <input 
                    type="number" 
                    step="0.000001"
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" 
                    onChange={(e) => setFormData({...formData, latitude: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Longitude</label>
                  <input 
                    type="number" 
                    step="0.000001"
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" 
                    onChange={(e) => setFormData({...formData, longitude: e.target.value})} 
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">City</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" 
                    onChange={(e) => setFormData({...formData, city: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">State</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" 
                    onChange={(e) => setFormData({...formData, state: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Pincode</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" 
                    onChange={(e) => setFormData({...formData, pincode: e.target.value})} 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Contact Person</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" 
                    onChange={(e) => setFormData({...formData, contact_person: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Contact Phone</label>
                  <input 
                    type="tel" 
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" 
                    onChange={(e) => setFormData({...formData, contact_phone: e.target.value})} 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Store Manager Name</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" 
                    onChange={(e) => setFormData({...formData, store_manager_name: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Store Manager Phone</label>
                  <input 
                    type="tel" 
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" 
                    onChange={(e) => setFormData({...formData, store_manager_phone: e.target.value})} 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                <select 
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" 
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </>
          )}

          <div className="flex gap-3 pt-4">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 px-4 py-3 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="flex-1 px-4 py-3 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-all"
            >
              Add {type === 'vehicle' ? 'Vehicle' : type === 'hub' ? 'Hub' : 'Store'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
