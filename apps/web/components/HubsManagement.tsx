'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import LocationSearch from './LocationSearch';

const HubMapView = dynamic(() => import('./HubMapView'), {
  ssr: false,
  loading: () => (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
        <i className="ph-duotone ph-map-trifold text-3xl text-slate-400"></i>
      </div>
      <p className="text-slate-600">Loading map component...</p>
    </div>
  ),
});

export default function HubsManagement() {
  const [hubs, setHubs] = useState<any[]>([]);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [viewItem, setViewItem] = useState<any>(null);
  const [editItem, setEditItem] = useState<any>(null);
  const [activeView, setActiveView] = useState<'list' | 'map'>('list');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchHubs();
  }, []);

  const fetchHubs = async () => {
    try {
      const res = await fetch('/api/hubs');
      const data = await res.json();
      setHubs(data);
    } catch (error) {
      console.error('Error fetching hubs:', error);
    }
  };

  const handleView = (item: any) => {
    setViewItem(item);
    setShowViewModal(true);
  };

  const handleEdit = (item: any) => {
    setEditItem({...item});
    setShowEditModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this hub?')) return;
    
    try {
      const res = await fetch(`/api/hubs?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchHubs();
        alert('Hub deleted successfully!');
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to delete hub');
      }
    } catch (error) {
      console.error('Error deleting hub:', error);
      alert('Error deleting hub');
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/hubs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editItem)
      });
      
      if (res.ok) {
        setShowEditModal(false);
        setEditItem(null);
        fetchHubs();
        alert('Hub updated successfully!');
      } else {
        alert('Failed to update hub');
      }
    } catch (error) {
      console.error('Error updating hub:', error);
      alert('Error updating hub');
    }
  };

  const filteredHubs = hubs.filter(hub =>
    hub.hub_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hub.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hub.hub_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="font-display text-3xl font-bold text-slate-900">Hub Management ({hubs.length})</h2>
        </div>

        {/* View Toggle */}
        <div className="flex gap-2 border-b border-slate-200">
          <button
            onClick={() => setActiveView('list')}
            className={`px-4 py-3 font-medium text-sm border-b-2 transition-all ${
              activeView === 'list'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <i className="ph-bold ph-list inline mr-2"></i>List View
          </button>
          <button
            onClick={() => setActiveView('map')}
            className={`px-4 py-3 font-medium text-sm border-b-2 transition-all ${
              activeView === 'map'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <i className="ph-bold ph-map-trifold inline mr-2"></i>Map View
          </button>
        </div>

        {/* List View */}
        {activeView === 'list' && (
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <i className="ph-bold ph-magnifying-glass absolute left-3 top-3 text-slate-400"></i>
              <input
                type="text"
                placeholder="Search by hub name, code, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
              />
            </div>

            {/* Hubs Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Hub Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Code</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Location</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Hub In-charge</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Phone</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Status</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHubs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                        No hubs found
                      </td>
                    </tr>
                  ) : (
                    filteredHubs.map((hub) => (
                      <tr key={hub.id} className="border-b border-slate-200 hover:bg-slate-50">
                        <td className="px-6 py-4 text-sm text-slate-900 font-medium">{hub.hub_name}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{hub.hub_code}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{hub.location}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{hub.manager_name}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{hub.manager_phone}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            hub.status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {hub.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right flex gap-2 justify-end">
                          <button
                            onClick={() => handleView(hub)}
                            className="px-3 py-1 text-blue-600 text-sm font-medium border border-blue-200 rounded hover:bg-blue-50"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleEdit(hub)}
                            className="px-3 py-1 text-amber-600 text-sm font-medium border border-amber-200 rounded hover:bg-amber-50"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(hub.id)}
                            className="px-3 py-1 text-red-600 text-sm font-medium border border-red-200 rounded hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Map View */}
        {activeView === 'map' && (
          <HubMapView />
        )}
      </div>



      {/* View Hub Modal */}
      {showViewModal && viewItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">Hub Details</h3>
              <button onClick={() => setShowViewModal(false)} className="p-1 hover:bg-slate-100 rounded">
                <i className="ph-bold ph-x text-xl"></i>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div><strong>Hub Name:</strong> {viewItem.hub_name}</div>
              <div><strong>Hub Code:</strong> {viewItem.hub_code}</div>
              <div><strong>Location:</strong> {viewItem.location}</div>
              <div><strong>City:</strong> {viewItem.city}</div>
              <div><strong>State:</strong> {viewItem.state}</div>
              <div><strong>Pincode:</strong> {viewItem.pincode}</div>
              <div><strong>Hub In-charge Name:</strong> {viewItem.manager_name}</div>
              <div><strong>Hub In-charge Phone:</strong> {viewItem.manager_phone}</div>
              <div><strong>Status:</strong> {viewItem.status}</div>
              {viewItem.latitude && viewItem.longitude && (
                <div><strong>Coordinates:</strong> Lat: {viewItem.latitude.toFixed(4)}, Lng: {viewItem.longitude.toFixed(4)}</div>
              )}
            </div>
            <div className="p-6 border-t border-slate-200 flex gap-3 justify-end">
              <button onClick={() => setShowViewModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Hub Modal */}
      {showEditModal && editItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-xl font-bold text-slate-900">Edit Hub</h3>
              <button onClick={() => setShowEditModal(false)} className="p-1 hover:bg-slate-100 rounded">
                <i className="ph-bold ph-x text-xl"></i>
              </button>
            </div>
            <form onSubmit={handleUpdateSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Search Location</label>
                <LocationSearch
                  value={editItem.location || ''}
                  onChange={(location, lat, lng, address) => {
                    // Only update if lat/lng are provided (i.e., place was selected from Google)
                    if (lat !== undefined && lng !== undefined) {
                      const parts = (address || location).split(',').map((p: string) => p.trim());
                      let city = '', state = '', pincode = '';
                      
                      if (parts.length >= 2) {
                        city = parts[parts.length - 3] || '';
                        state = parts[parts.length - 2] || '';
                        const lastPart = parts[parts.length - 1];
                        pincode = lastPart?.match(/\d{6}/) ? lastPart : '';
                      }
                      
                      setEditItem({
                        ...editItem,
                        location: address || location,
                        latitude: lat,
                        longitude: lng,
                        city: city || editItem.city,
                        state: state || editItem.state,
                        pincode: pincode || editItem.pincode
                      });
                    } else {
                      // Just update the search text if still typing
                      setEditItem({
                        ...editItem,
                        location
                      });
                    }
                  }}
                  placeholder="Update location"
                />
              </div>
              
              {editItem.latitude && editItem.longitude && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                  <strong>Location:</strong> Lat: {(typeof editItem.latitude === 'number' ? editItem.latitude : parseFloat(editItem.latitude)).toFixed(4)}, Lng: {(typeof editItem.longitude === 'number' ? editItem.longitude : parseFloat(editItem.longitude)).toFixed(4)}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Hub Name</label>
                <input
                  type="text"
                  value={editItem.hub_name || ''}
                  onChange={(e) => setEditItem({...editItem, hub_name: e.target.value})}
                  placeholder="Hub name"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Hub Code</label>
                  <input
                    type="text"
                    value={editItem.hub_code || ''}
                    onChange={(e) => setEditItem({...editItem, hub_code: e.target.value})}
                    placeholder="Hub code"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
                  />
                </div>
                <div></div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">City</label>
                  <input
                    type="text"
                    value={editItem.city || ''}
                    onChange={(e) => setEditItem({...editItem, city: e.target.value})}
                    placeholder="City"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">State</label>
                  <input
                    type="text"
                    value={editItem.state || ''}
                    onChange={(e) => setEditItem({...editItem, state: e.target.value})}
                    placeholder="State"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Pincode</label>
                <input
                  type="text"
                  value={editItem.pincode || ''}
                  onChange={(e) => setEditItem({...editItem, pincode: e.target.value})}
                  placeholder="Pincode"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Hub In-charge Name</label>
                <input
                  type="text"
                  value={editItem.manager_name || ''}
                  onChange={(e) => setEditItem({...editItem, manager_name: e.target.value})}
                  placeholder="Hub in-charge name"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Hub In-charge Phone</label>
                <input
                  type="tel"
                  value={editItem.manager_phone || ''}
                  onChange={(e) => setEditItem({...editItem, manager_phone: e.target.value})}
                  placeholder="Phone number"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Status</label>
                <select
                  value={editItem.status || 'active'}
                  onChange={(e) => setEditItem({...editItem, status: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              
              <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
