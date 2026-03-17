'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { VehicleList, HubList, StoreList } from '@/components/VehicleHubStoreManagement';
import { AddModal } from '@/components/AddModal';
import WeatherBadge from '@/components/WeatherBadge';
import NotificationBell from '@/components/NotificationBell';

function TechnicianDashboardContent() {
  const router = useRouter();
  const [technician, setTechnician] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [hubs, setHubs] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [serviceTickets, setServiceTickets] = useState<any[]>([]);
  const [partsInventory, setPartsInventory] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState<'vehicle' | 'hub' | 'store'>('vehicle');
  const [formData, setFormData] = useState<any>({});

  // Check if technician is logged in
  useEffect(() => {
    const checkTechnicianAuth = async () => {
      try {
        const storedTech = localStorage.getItem('technician');
        if (!storedTech) {
          router.push('/login');
          return;
        }
        setTechnician(JSON.parse(storedTech));
      } catch (error) {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkTechnicianAuth();
  }, [router]);

  useEffect(() => {
    if (activeTab === 'vehicles') fetchVehicles();
    if (activeTab === 'hubs') fetchHubs();
    if (activeTab === 'stores') fetchStores();
    if (activeTab === 'dashboard') {
      fetchServiceTickets();
      fetchPartsInventory();
    }
  }, [activeTab]);

  const fetchVehicles = async () => {
    const res = await fetch('/api/vehicles');
    const data = await res.json();
    setVehicles(data);
  };

  const fetchHubs = async () => {
    const res = await fetch('/api/hubs');
    const data = await res.json();
    setHubs(data);
  };

  const fetchStores = async () => {
    const res = await fetch('/api/stores');
    const data = await res.json();
    setStores(data);
  };

  const fetchServiceTickets = async () => {
    try {
      const res = await fetch('/api/service-tickets');
      const data = await res.json();
      setServiceTickets(data || []);
    } catch (error) {
      console.error('Error fetching service tickets:', error);
    }
  };

  const fetchPartsInventory = async () => {
    try {
      const res = await fetch('/api/parts-inventory');
      const data = await res.json();
      setPartsInventory(data || []);
    } catch (error) {
      console.error('Error fetching parts inventory:', error);
    }
  };

  const handleAddNew = (type: 'vehicle' | 'hub' | 'store') => {
    setModalType(type);
    setFormData({});
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = `/api/${modalType}s`;
    await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    setShowAddModal(false);
    setFormData({});
    if (modalType === 'vehicle') fetchVehicles();
    if (modalType === 'hub') fetchHubs();
    if (modalType === 'store') fetchStores();
  };

  if (loading) {
    return (
      <div className="mesh-bg min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <i className="ph-fill ph-wrench text-3xl text-amber-600"></i>
          </div>
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!technician) {
    return null;
  }

  return (
    <div className="mesh-bg text-slate-800 antialiased min-h-screen flex flex-col">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-panel">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-amber-600/20">
              <i className="ph-fill ph-wrench text-2xl"></i>
            </div>
            <div>
              <h1 className="font-display font-bold text-xl leading-none text-slate-900">
                SwiftFleet<span className="text-amber-500">Tech</span>
              </h1>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Service Portal</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <div className="hidden md:block">
              <WeatherBadge latitude={12.9352} longitude={77.6245} locationName="Koramangala" />
            </div>
            <NotificationBell />
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-900">{technician?.name || 'Technician'}</p>
                <p className="text-xs text-slate-500">Hub Technician</p>
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem('technician');
                  router.push('/login');
                }}
                className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-600 to-amber-700 border-2 border-white shadow-md hover:from-red-600 hover:to-red-700 transition-all flex items-center justify-center text-white"
                title="Sign Out"
              >
                <i className="ph-bold ph-sign-out text-sm"></i>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow pt-40 pb-12 px-6">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Navigation Tabs */}
          <div className="flex gap-2 border-b border-slate-200">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-3 font-medium text-sm transition-all ${
                activeTab === 'dashboard' 
                  ? 'text-amber-600 border-b-2 border-amber-600' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <i className="ph-bold ph-wrench mr-2"></i>Service Dashboard
            </button>
            <button 
              onClick={() => setActiveTab('vehicles')}
              className={`px-4 py-3 font-medium text-sm transition-all ${
                activeTab === 'vehicles' 
                  ? 'text-amber-600 border-b-2 border-amber-600' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <i className="ph-bold ph-truck mr-2"></i>Vehicles
            </button>
            <button 
              onClick={() => setActiveTab('hubs')}
              className={`px-4 py-3 font-medium text-sm transition-all ${
                activeTab === 'hubs' 
                  ? 'text-amber-600 border-b-2 border-amber-600' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <i className="ph-bold ph-buildings mr-2"></i>Hubs
            </button>
            <button 
              onClick={() => setActiveTab('stores')}
              className={`px-4 py-3 font-medium text-sm transition-all ${
                activeTab === 'stores' 
                  ? 'text-amber-600 border-b-2 border-amber-600' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <i className="ph-bold ph-storefront mr-2"></i>Stores
            </button>
          </div>

          {activeTab === 'dashboard' && (
            <>
              {/* Page Header */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-200/60">
                <div>
                  <h2 className="font-display text-3xl font-bold text-slate-900">Service Dashboard</h2>
                  <p className="text-slate-500 mt-2">Manage vehicle maintenance and service requests</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 flex items-center gap-2 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-sm font-semibold text-slate-700">On Duty</span>
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                      <i className="ph-duotone ph-warning-circle text-2xl text-red-600"></i>
                    </div>
                    <span className="text-xs text-slate-500">Urgent</span>
                  </div>
                  <h3 className="text-3xl font-bold text-slate-900">
                    {Array.isArray(serviceTickets) ? serviceTickets.filter(t => t.priority === 'Critical').length : 0}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">Critical Issues</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                      <i className="ph-duotone ph-gear text-2xl text-amber-600"></i>
                    </div>
                    <span className="text-xs text-slate-500">Active</span>
                  </div>
                  <h3 className="text-3xl font-bold text-slate-900">
                    {Array.isArray(serviceTickets) ? serviceTickets.filter(t => t.status === 'In Progress').length : 0}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">In Progress</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <i className="ph-duotone ph-check-circle text-2xl text-green-600"></i>
                    </div>
                    <span className="text-xs text-slate-500">Today</span>
                  </div>
                  <h3 className="text-3xl font-bold text-slate-900">
                    {Array.isArray(serviceTickets) ? serviceTickets.filter(t => t.status === 'Completed').length : 0}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">Completed</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <i className="ph-duotone ph-wrench text-2xl text-blue-600"></i>
                    </div>
                    <span className="text-xs text-slate-500">Queue</span>
                  </div>
                  <h3 className="text-3xl font-bold text-slate-900">
                    {Array.isArray(serviceTickets) ? serviceTickets.filter(t => t.status === 'Open').length : 0}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">Pending</p>
                </div>
              </div>

              {/* Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Service Tickets */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-display font-semibold text-lg text-slate-900">My Assigned Tickets</h3>
                    <div className="flex gap-2">
                      <button className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium hover:bg-slate-200 transition-all">
                        All
                      </button>
                      <button className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-medium hover:bg-red-100 transition-all">
                        Critical
                      </button>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    {serviceTickets.length > 0 ? (
                      serviceTickets.map((ticket) => {
                        const getPriorityColor = (priority: string) => {
                          switch (priority) {
                            case 'Critical':
                              return { border: 'border-red-200', bg: 'bg-red-50/50', badge: 'bg-red-600 text-white', badgeText: 'CRITICAL' };
                            case 'High':
                              return { border: 'border-orange-200', bg: 'bg-orange-50/30', badge: 'bg-orange-100 text-orange-700', badgeText: 'HIGH' };
                            case 'Medium':
                              return { border: 'border-amber-200', bg: 'bg-amber-50/30', badge: 'bg-amber-100 text-amber-700', badgeText: 'MEDIUM' };
                            default:
                              return { border: 'border-slate-200', bg: 'bg-white', badge: 'bg-slate-100 text-slate-600', badgeText: 'LOW' };
                          }
                        };
                        
                        const colors = getPriorityColor(ticket.priority);
                        const createdAt = new Date(ticket.created_at);
                        const now = new Date();
                        const diffMs = now.getTime() - createdAt.getTime();
                        const diffMins = Math.floor(diffMs / 60000);
                        const diffHours = Math.floor(diffMs / 3600000);
                        const timeAgo = diffHours > 0 ? `${diffHours} hours ago` : `${diffMins} mins ago`;

                        return (
                          <div key={ticket.id} className={`p-5 rounded-xl border ${colors.border} ${colors.bg}`}>
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <span className={`px-2 py-0.5 rounded ${colors.badge} text-xs font-bold`}>
                                  {colors.badgeText}
                                </span>
                                <h4 className="font-semibold text-slate-900 mt-2 text-lg">{ticket.issue_description}</h4>
                                <p className="text-sm text-slate-600">Ticket #{ticket.ticket_number}</p>
                              </div>
                              <span className="text-xs text-slate-400">{timeAgo}</span>
                            </div>
                            <div className="mb-3 p-3 bg-white rounded-lg border border-slate-100">
                              <p className="text-xs text-slate-500 mb-1">Vehicle</p>
                              <p className="text-sm text-slate-900 font-mono font-bold">{ticket.vehicle_number || 'N/A'}</p>
                              <p className="text-xs text-slate-500 mt-1">{ticket.vehicle_type || 'Unknown type'}</p>
                            </div>
                            <div className="flex gap-2">
                              <button className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-all">
                                {ticket.status === 'Open' ? 'Start Repair' : 'Update'}
                              </button>
                              <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all">
                                Details
                              </button>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-slate-500">No service tickets assigned</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Inventory Status */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h3 className="font-display font-semibold text-slate-900 mb-4 flex items-center gap-2">
                      <i className="ph-duotone ph-package text-blue-600 text-lg"></i>
                      Parts Inventory
                    </h3>
                    <div className="space-y-3">
                      {Array.isArray(partsInventory) && partsInventory.slice(0, 3).map((part) => {
                        const getStatusColor = (status: string, quantity: number) => {
                          if (quantity === 0) return 'bg-red-100 text-red-700';
                          if (status === 'Low Stock') return 'bg-amber-100 text-amber-700';
                          return 'bg-green-100 text-green-700';
                        };
                        
                        return (
                          <div key={part.id} className="flex justify-between items-center pb-3 border-b border-slate-100">
                            <div>
                              <p className="text-sm font-medium text-slate-900">{part.part_name}</p>
                              <p className="text-xs text-slate-500">{part.part_code}</p>
                            </div>
                            <span className={`px-2 py-1 rounded ${getStatusColor(part.status, part.quantity_in_stock)} text-xs font-bold`}>
                              {part.quantity_in_stock} units
                            </span>
                          </div>
                        );
                      })}
                      {(!Array.isArray(partsInventory) || partsInventory.length === 0) && (
                        <p className="text-slate-500 text-sm text-center py-4">No parts in inventory</p>
                      )}
                    </div>
                    <button className="w-full mt-4 px-4 py-2 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-100 transition-all">
                      View Full Inventory
                    </button>
                  </div>

                  {/* Tools */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h3 className="font-display font-semibold text-slate-900 mb-4">Quick Tools</h3>
                    <div className="space-y-2">
                      <button className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-100 transition-all flex items-center gap-3">
                        <i className="ph-bold ph-scan text-lg"></i>
                        Scan Vehicle QR
                      </button>
                      <button className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-100 transition-all flex items-center gap-3">
                        <i className="ph-bold ph-file-text text-lg"></i>
                        Service Report
                      </button>
                      <button className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-100 transition-all flex items-center gap-3">
                        <i className="ph-bold ph-shopping-cart text-lg"></i>
                        Request Parts
                      </button>
                    </div>
                  </div>

                  {/* Today's Summary */}
                  <div className="bg-gradient-to-br from-amber-600 to-amber-700 rounded-2xl shadow-lg p-6 text-white">
                    <h3 className="font-display font-semibold mb-4">Today's Summary</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-amber-100">Tickets Closed</span>
                        <span className="text-2xl font-bold">{Array.isArray(serviceTickets) ? serviceTickets.filter(t => t.status === 'Completed').length : 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-amber-100">Hours Worked</span>
                        <span className="text-2xl font-bold">7.5</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-amber-100">Avg. Resolution</span>
                        <span className="text-2xl font-bold">45m</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Vehicles Tab */}
          {activeTab === 'vehicles' && (
            <VehicleList vehicles={vehicles} onAdd={() => handleAddNew('vehicle')} />
          )}

          {/* Hubs Tab */}
          {activeTab === 'hubs' && (
            <HubList hubs={hubs} onAdd={() => handleAddNew('hub')} />
          )}

          {/* Stores Tab */}
          {activeTab === 'stores' && (
            <StoreList stores={stores} onAdd={() => handleAddNew('store')} />
          )}

          {/* Add Modal */}
          <AddModal 
            show={showAddModal}
            onClose={() => setShowAddModal(false)}
            type={modalType}
            onSubmit={handleSubmit}
            formData={formData}
            setFormData={setFormData}
          />

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-slate-500">© 2023 SwiftFleet 3PL Services. All rights reserved.</div>
            <div className="flex gap-6 text-sm font-medium text-slate-600">
              <a href="#" className="hover:text-slate-900 transition-colors">Help Center</a>
              <a href="#" className="hover:text-slate-900 transition-colors">Contact Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function TechnicianDashboardPage() {
  return <TechnicianDashboardContent />;
}
