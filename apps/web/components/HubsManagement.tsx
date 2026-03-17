'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import LocationSearch from './LocationSearch';
import WeatherCard from './WeatherCard';
import BulkUploadModal from './BulkUploadModal';

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
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [viewItem, setViewItem] = useState<any>(null);
  const [editItem, setEditItem] = useState<any>(null);
  const [newHub, setNewHub] = useState<any>({
    hub_name: '',
    hub_code: '',
    location: '',
    latitude: undefined,
    longitude: undefined,
    city: '',
    state: '',
    pincode: '',
    manager_name: '',
    manager_email: '',
    manager_phone: '',
    status: 'active'
  });
  const [activeView, setActiveView] = useState<'list' | 'map'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [credentialsHub, setCredentialsHub] = useState<any>(null);
  const [credentialEmail, setCredentialEmail] = useState('');
  const [credentialPassword, setCredentialPassword] = useState('');
  const [credentialsLoading, setCredentialsLoading] = useState(false);
  const [credentialsMessage, setCredentialsMessage] = useState('');
  const [credentialsError, setCredentialsError] = useState('');
  const [showGeneratedPassword, setShowGeneratedPassword] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState<any>(null);

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

  const generateHubCode = async (): Promise<string> => {
    try {
      // Get the highest existing hub code number
      const maxCode = hubs.reduce((max, hub) => {
        const match = hub.hub_code?.match(/HUB-(\d+)/);
        return match ? Math.max(max, parseInt(match[1])) : max;
      }, 0);
      
      const nextNumber = maxCode + 1;
      return `HUB-${String(nextNumber).padStart(3, '0')}`; // HUB-001, HUB-002, etc.
    } catch (error) {
      console.error('Error generating hub code:', error);
      return `HUB-${String(hubs.length + 1).padStart(3, '0')}`; // Fallback to count + 1
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newHub.hub_name || !newHub.location) {
      alert('Please fill in required fields');
      return;
    }

    // Auto-generate code if not provided
    const hubCode = newHub.hub_code.trim() || await generateHubCode();
    
    try {
      const res = await fetch('/api/hubs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({...newHub, hub_code: hubCode})
      });
      
      if (res.ok) {
        setShowAddModal(false);
        setNewHub({
          hub_name: '',
          hub_code: '',
          location: '',
          latitude: undefined,
          longitude: undefined,
          city: '',
          state: '',
          pincode: '',
          manager_name: '',
          manager_email: '',
          manager_phone: '',
          status: 'active'
        });
        fetchHubs();
        alert('Hub added successfully!');
      } else {
        alert('Failed to add hub');
      }
    } catch (error) {
      console.error('Error adding hub:', error);
      alert('Error adding hub');
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBulkUploadModal(true)}
              className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 font-medium flex items-center gap-2"
            >
              <i className="ph-bold ph-upload text-lg"></i>Bulk Upload
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium flex items-center gap-2"
            >
              <i className="ph-bold ph-plus text-lg"></i>Add Hub
            </button>
          </div>
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
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Manager Email</th>
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
                        <td className="px-6 py-4 text-sm text-slate-600">{hub.manager_email || '-'}</td>
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
                            onClick={() => {
                              setCredentialsHub(hub);
                              setCredentialEmail(hub.manager_email || '');
                              setCredentialPassword('');
                              setCredentialsMessage('');
                              setCredentialsError('');
                              setShowGeneratedPassword(false);
                              setGeneratedCredentials(null);
                              setShowCredentialsModal(true);
                            }}
                            className="px-3 py-1 text-green-600 text-sm font-medium border border-green-200 rounded hover:bg-green-50"
                          >
                            Credentials
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
              <div><strong>Hub In-charge Email:</strong> {viewItem.manager_email || '-'}</div>
              <div><strong>Hub In-charge Phone:</strong> {viewItem.manager_phone}</div>
              <div><strong>Status:</strong> {viewItem.status}</div>
              {viewItem.latitude && viewItem.longitude && (
                <div><strong>Coordinates:</strong> Lat: {Number(viewItem.latitude).toFixed(4)}, Lng: {Number(viewItem.longitude).toFixed(4)}</div>
              )}
              {viewItem.latitude && viewItem.longitude && (
                <div className="pt-4 border-t border-slate-200">
                  <p className="text-sm font-semibold text-slate-900 mb-2">Current Weather</p>
                  <WeatherCard 
                    latitude={Number(viewItem.latitude)} 
                    longitude={Number(viewItem.longitude)}
                    locationName={viewItem.hub_name}
                    showDetails={true}
                  />
                </div>
              )}
            </div>
            <div className="p-6 border-t border-slate-200 flex gap-3 justify-end">
              <button onClick={() => setShowViewModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Hub Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[95vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-gradient-to-r from-brand-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center">
                  <i className="ph-bold ph-plus text-brand-600 text-lg"></i>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Add New Hub</h3>
                  <p className="text-xs text-slate-500">Create a new hub location with complete details</p>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-slate-200 rounded-lg transition-colors">
                <i className="ph-bold ph-x text-xl text-slate-600"></i>
              </button>
            </div>
            
            {/* Form Content */}
            <form onSubmit={handleAddSubmit} className="overflow-y-auto flex-1 p-6 space-y-6">
              {/* Location Section */}
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="ph-bold ph-map-pin text-brand-600"></i>
                  </div>
                  <h4 className="font-semibold text-slate-900">Location Details</h4>
                </div>
                <div className="space-y-4">
                  <LocationSearch
                    value={newHub.location || ''}
                    onChange={(location, lat, lng, address) => {
                      if (lat !== undefined && lng !== undefined) {
                        const parts = (address || location).split(',').map((p: string) => p.trim());
                        let city = '', state = '', pincode = '';
                        
                        if (parts.length >= 2) {
                          city = parts[parts.length - 3] || '';
                          state = parts[parts.length - 2] || '';
                          const lastPart = parts[parts.length - 1];
                          pincode = lastPart?.match(/\\d{6}/) ? lastPart : '';
                        }
                        
                        setNewHub({
                          ...newHub,
                          location: address || location,
                          latitude: lat,
                          longitude: lng,
                          city: city || newHub.city,
                          state: state || newHub.state,
                          pincode: pincode || newHub.pincode
                        });
                      } else {
                        setNewHub({
                          ...newHub,
                          location
                        });
                      }
                    }}
                    placeholder="Search and select hub location"
                  />
                  
                  {/* Location Info Grid */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">City</label>
                      <input
                        type="text"
                        value={newHub.city || ''}
                        onChange={(e) => setNewHub({...newHub, city: e.target.value})}
                        placeholder="Auto-filled from location"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 text-sm bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">State</label>
                      <input
                        type="text"
                        value={newHub.state || ''}
                        onChange={(e) => setNewHub({...newHub, state: e.target.value})}
                        placeholder="Auto-filled from location"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 text-sm bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Postal Code</label>
                      <input
                        type="text"
                        value={newHub.pincode || ''}
                        onChange={(e) => setNewHub({...newHub, pincode: e.target.value})}
                        placeholder="Auto-filled from location"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 text-sm bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Hub Info Section */}
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="ph-bold ph-building text-brand-600"></i>
                  </div>
                  <h4 className="font-semibold text-slate-900">Hub Information</h4>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-1.5">Hub Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={newHub.hub_name || ''}
                      onChange={(e) => setNewHub({...newHub, hub_name: e.target.value})}
                      placeholder="e.g., Downtown Hub, North Center"
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-1.5">Hub Code</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newHub.hub_code || ''}
                        onChange={(e) => setNewHub({...newHub, hub_code: e.target.value})}
                        placeholder="Auto-generated (e.g., HUB-001)"
                        className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 text-sm"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          const code = await generateHubCode();
                          setNewHub({...newHub, hub_code: code});
                        }}
                        className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 whitespace-nowrap"
                        title="Generate a new code"
                      >
                        <i className="ph-bold ph-shuffle"></i>Generate
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-1.5">Leave empty to auto-generate</p>
                  </div>
                </div>
              </div>
              
              {/* Manager Section */}
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="ph-bold ph-user text-brand-600"></i>
                  </div>
                  <h4 className="font-semibold text-slate-900">Hub In-charge</h4>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-1.5">Name</label>
                    <input
                      type="text"
                      value={newHub.manager_name || ''}
                      onChange={(e) => setNewHub({...newHub, manager_name: e.target.value})}
                      placeholder="Hub manager's full name"
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-1.5">Email Address <span className="text-red-500">*</span></label>
                    <input
                      type="email"
                      value={newHub.manager_email || ''}
                      onChange={(e) => setNewHub({...newHub, manager_email: e.target.value})}
                      placeholder="manager@inneedit.com (for login)"
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 text-sm"
                    />
                    <p className="text-xs text-slate-500 mt-1.5">This email will be used for hub manager login</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-1.5">Phone Number</label>
                    <input
                      type="tel"
                      value={newHub.manager_phone || ''}
                      onChange={(e) => setNewHub({...newHub, manager_phone: e.target.value})}
                      placeholder="10-digit phone number"
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 text-sm"
                    />
                  </div>
                </div>
              </div>
            </form>
            
            {/* Footer */}
            <div className="p-6 border-t border-slate-200 bg-slate-50 flex gap-3 justify-end">
              <button 
                type="button" 
                onClick={() => setShowAddModal(false)} 
                className="px-6 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors flex items-center gap-2"
              >
                <i className="ph-bold ph-x"></i>Cancel
              </button>
              <button 
                type="submit" 
                onClick={handleAddSubmit}
                className="px-6 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium transition-colors flex items-center gap-2"
              >
                <i className="ph-bold ph-plus"></i>Add Hub
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Hub Modal */}
      {showEditModal && editItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[95vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-gradient-to-r from-amber-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <i className="ph-bold ph-pencil text-amber-600 text-lg"></i>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Edit Hub</h3>
                  <p className="text-xs text-slate-500">Update hub location and manager details</p>
                </div>
              </div>
              <button onClick={() => setShowEditModal(false)} className="p-1 hover:bg-slate-200 rounded-lg transition-colors">
                <i className="ph-bold ph-x text-xl text-slate-600"></i>
              </button>
            </div>
            
            {/* Form Content */}
            <form onSubmit={handleUpdateSubmit} className="overflow-y-auto flex-1 p-6 space-y-6">
              {/* Location Section */}
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="ph-bold ph-map-pin text-amber-600"></i>
                  </div>
                  <h4 className="font-semibold text-slate-900">Location Details</h4>
                </div>
                <div className="space-y-4">
                  <LocationSearch
                    value={editItem.location || ''}
                    onChange={(location, lat, lng, address) => {
                      if (lat !== undefined && lng !== undefined) {
                        const parts = (address || location).split(',').map((p: string) => p.trim());
                        let city = '', state = '', pincode = '';
                        
                        if (parts.length >= 2) {
                          city = parts[parts.length - 3] || '';
                          state = parts[parts.length - 2] || '';
                          const lastPart = parts[parts.length - 1];
                          pincode = lastPart?.match(/\\d{6}/) ? lastPart : '';
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
                        setEditItem({
                          ...editItem,
                          location
                        });
                      }
                    }}
                    placeholder="Update hub location"
                  />
                  
                  {/* Location Info Grid */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">City</label>
                      <input
                        type="text"
                        value={editItem.city || ''}
                        onChange={(e) => setEditItem({...editItem, city: e.target.value})}
                        placeholder="Auto-filled from location"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 text-sm bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">State</label>
                      <input
                        type="text"
                        value={editItem.state || ''}
                        onChange={(e) => setEditItem({...editItem, state: e.target.value})}
                        placeholder="Auto-filled from location"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 text-sm bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Postal Code</label>
                      <input
                        type="text"
                        value={editItem.pincode || ''}
                        onChange={(e) => setEditItem({...editItem, pincode: e.target.value})}
                        placeholder="Auto-filled from location"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 text-sm bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Hub Info Section */}
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="ph-bold ph-building text-amber-600"></i>
                  </div>
                  <h4 className="font-semibold text-slate-900">Hub Information</h4>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-1.5">Hub Name</label>
                    <input
                      type="text"
                      value={editItem.hub_name || ''}
                      onChange={(e) => setEditItem({...editItem, hub_name: e.target.value})}
                      placeholder="e.g., Downtown Hub, North Center"
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-1.5">Hub Code</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editItem.hub_code || ''}
                        onChange={(e) => setEditItem({...editItem, hub_code: e.target.value})}
                        placeholder="e.g., HUB-001"
                        className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 text-sm"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          const code = await generateHubCode();
                          setEditItem({...editItem, hub_code: code});
                        }}
                        className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 whitespace-nowrap"
                        title="Generate a new code"
                      >
                        <i className="ph-bold ph-shuffle"></i>Generate
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Manager Section */}
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="ph-bold ph-user text-amber-600"></i>
                  </div>
                  <h4 className="font-semibold text-slate-900">Hub In-charge</h4>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-1.5">Name</label>
                    <input
                      type="text"
                      value={editItem.manager_name || ''}
                      onChange={(e) => setEditItem({...editItem, manager_name: e.target.value})}
                      placeholder="Hub manager's full name"
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-1.5">Email Address</label>
                    <input
                      type="email"
                      value={editItem.manager_email || ''}
                      onChange={(e) => setEditItem({...editItem, manager_email: e.target.value})}
                      placeholder="manager@inneedit.com"
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 text-sm"
                    />
                    <p className="text-xs text-slate-500 mt-1.5">Used for hub manager login</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-1.5">Phone Number</label>
                    <input
                      type="tel"
                      value={editItem.manager_phone || ''}
                      onChange={(e) => setEditItem({...editItem, manager_phone: e.target.value})}
                      placeholder="10-digit phone number"
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 text-sm"
                    />
                  </div>
                </div>
              </div>
              
              {/* Status Section */}
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="ph-bold ph-toggle-right text-amber-600"></i>
                  </div>
                  <h4 className="font-semibold text-slate-900">Status</h4>
                </div>
                <select
                  value={editItem.status || 'active'}
                  onChange={(e) => setEditItem({...editItem, status: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 text-sm"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </form>
            
            {/* Footer */}
            <div className="p-6 border-t border-slate-200 bg-slate-50 flex gap-3 justify-end">
              <button 
                type="button" 
                onClick={() => setShowEditModal(false)} 
                className="px-6 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors flex items-center gap-2"
              >
                <i className="ph-bold ph-x"></i>Cancel
              </button>
              <button 
                type="submit" 
                onClick={handleUpdateSubmit}
                className="px-6 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium transition-colors flex items-center gap-2"
              >
                <i className="ph-bold ph-check"></i>Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      <BulkUploadModal
        isOpen={showBulkUploadModal}
        onClose={() => setShowBulkUploadModal(false)}
        type="hubs"
        onSuccess={fetchHubs}
      />

      {/* Hub Manager Credentials Modal */}
      {showCredentialsModal && credentialsHub && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-green-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <i className="ph-bold ph-key text-green-600 text-lg"></i>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Generate Login Credentials</h3>
                  <p className="text-xs text-slate-500">{credentialsHub.hub_name}</p>
                </div>
              </div>
              <button onClick={() => setShowCredentialsModal(false)} className="p-1 hover:bg-slate-200 rounded-lg transition-colors">
                <i className="ph-bold ph-x text-xl text-slate-600"></i>
              </button>
            </div>
            
            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Error Message */}
              {credentialsError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-3">
                  <i className="ph-bold ph-warning-circle text-lg flex-shrink-0 mt-0.5"></i>
                  <div>
                    <p className="font-semibold">Error</p>
                    <p>{credentialsError}</p>
                  </div>
                </div>
              )}

              {/* Success Message */}
              {generatedCredentials && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start gap-3 mb-4">
                    <i className="ph-bold ph-check-circle text-lg text-green-600 mt-0.5"></i>
                    <div>
                      <p className="font-semibold text-green-900">Credentials Created Successfully!</p>
                      <p className="text-sm text-green-700 mt-1">Share these credentials with the hub manager</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3 bg-white rounded-lg p-4 border border-green-100">
                    <div>
                      <p className="text-xs font-semibold text-slate-600 mb-1">Email Address</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 px-3 py-2 bg-slate-100 rounded text-sm font-mono text-slate-900 break-all">
                          {generatedCredentials.email}
                        </code>
                        <button
                          onClick={() => navigator.clipboard.writeText(generatedCredentials.email)}
                          className="p-2 hover:bg-slate-200 rounded transition-colors"
                        >
                          <i className="ph-bold ph-copy text-slate-600"></i>
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-xs font-semibold text-slate-600 mb-1">Password</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 px-3 py-2 bg-slate-100 rounded text-sm font-mono text-slate-900 break-all">
                          {showGeneratedPassword ? generatedCredentials.password : '••••••••'}
                        </code>
                        <button
                          onClick={() => setShowGeneratedPassword(!showGeneratedPassword)}
                          className="p-2 hover:bg-slate-200 rounded transition-colors"
                        >
                          <i className={`ph-bold ${showGeneratedPassword ? 'ph-eye-slash' : 'ph-eye'} text-slate-600`}></i>
                        </button>
                        <button
                          onClick={() => navigator.clipboard.writeText(generatedCredentials.password)}
                          className="p-2 hover:bg-slate-200 rounded transition-colors"
                        >
                          <i className="ph-bold ph-copy text-slate-600"></i>
                        </button>
                      </div>
                    </div>
                    
                    <div className="pt-3 border-t border-green-100">
                      <p className="text-xs font-semibold text-slate-600 mb-2">Login Instructions</p>
                      <ol className="text-xs text-slate-700 space-y-1 list-decimal list-inside">
                        <li>Go to <span className="font-mono bg-slate-100 px-1 rounded">inneedit.app/login</span></li>
                        <li>Select <strong>"Hub Manager"</strong> tab</li>
                        <li>Enter the email and password above</li>
                        <li>Click "Sign In"</li>
                      </ol>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs">
                    <p className="font-semibold mb-1">⚠️ Important</p>
                    <ul className="list-disc list-inside space-y-0.5">
                      <li>Share these credentials securely with the hub manager</li>
                      <li>The manager should change the password after first login</li>
                      <li>Do not share publicly or via email</li>
                  </ul>
                  </div>
                </div>
              )}

              {/* Form (shown when not yet submitted) */}
              {!generatedCredentials && (
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  setCredentialsLoading(true);
                  setCredentialsError('');
                  setCredentialsMessage('');

                  try {
                    const res = await fetch('/api/admin/hub-manager-credentials', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        hub_id: credentialsHub.id,
                        email: credentialEmail,
                        password: credentialPassword,
                        manager_name: credentialsHub.manager_name
                      })
                    });

                    if (!res.ok) {
                      const error = await res.json();
                      throw new Error(error.error || 'Failed to create credentials');
                    }

                    const data = await res.json();
                    setGeneratedCredentials({
                      email: credentialEmail,
                      password: credentialPassword
                    });
                    setShowGeneratedPassword(false);
                  } catch (error: any) {
                    setCredentialsError(error.message);
                  } finally {
                    setCredentialsLoading(false);
                  }
                }} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">Manager Email</label>
                    <input
                      type="email"
                      value={credentialEmail}
                      onChange={(e) => setCredentialEmail(e.target.value)}
                      placeholder="manager@inneedit.com"
                      required
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 text-sm"
                    />
                    <p className="text-xs text-slate-500 mt-1.5">This will be the login email for the hub manager</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-semibold text-slate-900">Password</label>
                      <button
                        type="button"
                        onClick={() => {
                          const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
                          let pass = '';
                          for (let i = 0; i < 12; i++) {
                            pass += chars.charAt(Math.floor(Math.random() * chars.length));
                          }
                          setCredentialPassword(pass);
                        }}
                        className="text-xs px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                      >
                        <i className="ph-bold ph-shuffle inline mr-1"></i>Auto-Generate
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showGeneratedPassword ? 'text' : 'password'}
                        value={credentialPassword}
                        onChange={(e) => setCredentialPassword(e.target.value)}
                        placeholder="Enter or generate a password"
                        required
                        minLength={8}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 text-sm pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowGeneratedPassword(!showGeneratedPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700"
                      >
                        <i className={`ph-bold ${showGeneratedPassword ? 'ph-eye-slash' : 'ph-eye'}`}></i>
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-1.5">Minimum 8 characters. Use auto-generate for a strong password.</p>
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-800">
                      <i className="ph-bold ph-info inline mr-1"></i>
                      Once created, the hub manager can log in using these credentials at <span className="font-mono bg-blue-100 px-1 rounded">inneedit.app/login</span>
                    </p>
                  </div>
                </form>
              )}
            </div>
            
            {/* Footer */}
            <div className="p-6 border-t border-slate-200 bg-slate-50 flex gap-3 justify-end">
              {generatedCredentials ? (
                <>
                  <button 
                    type="button" 
                    onClick={() => setShowCredentialsModal(false)} 
                    className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors flex items-center gap-2"
                  >
                    <i className="ph-bold ph-check"></i>Done
                  </button>
                </>
              ) : (
                <>
                  <button 
                    type="button" 
                    onClick={() => setShowCredentialsModal(false)} 
                    className="px-6 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors flex items-center gap-2"
                  >
                    <i className="ph-bold ph-x"></i>Cancel
                  </button>
                  <button 
                    type="button" 
                    disabled={credentialsLoading}
                    onClick={async () => {
                      setCredentialsLoading(true);
                      setCredentialsError('');
                      setCredentialsMessage('');

                      try {
                        if (!credentialEmail || !credentialPassword) {
                          throw new Error('Email and password are required');
                        }

                        const res = await fetch('/api/admin/hub-manager-credentials', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            hub_id: credentialsHub.id,
                            email: credentialEmail,
                            password: credentialPassword,
                            manager_name: credentialsHub.manager_name
                          })
                        });

                        if (!res.ok) {
                          const error = await res.json();
                          throw new Error(error.error || 'Failed to create credentials');
                        }

                        const data = await res.json();
                        setGeneratedCredentials({
                          email: credentialEmail,
                          password: credentialPassword
                        });
                        setShowGeneratedPassword(false);
                      } catch (error: any) {
                        setCredentialsError(error.message);
                        console.error('Credentials creation error:', error);
                      } finally {
                        setCredentialsLoading(false);
                      }
                    }}
                    className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {credentialsLoading ? (
                      <>
                        <i className="ph ph-circle-notch animate-spin"></i>Creating...
                      </>
                    ) : (
                      <>
                        <i className="ph-bold ph-key"></i>Create Credentials
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
