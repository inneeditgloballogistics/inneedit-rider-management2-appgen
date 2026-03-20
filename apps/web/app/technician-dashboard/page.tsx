'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { HubList, StoreList } from '@/components/VehicleHubStoreManagement';
import { AddModal } from '@/components/AddModal';
import WeatherBadge from '@/components/WeatherBadge';

import TechnicianTickets from '@/components/TechnicianTickets';
import TechnicianVehicleManagement from '@/components/TechnicianVehicleManagement';
import VehicleSwapHistorySearch from '@/components/VehicleSwapHistorySearch';

function TechnicianDashboardContent() {
  const router = useRouter();
  const [technician, setTechnician] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tickets');
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [hubs, setHubs] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [serviceTickets, setServiceTickets] = useState<any[]>([]);
  const [partsInventory, setPartsInventory] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState<'vehicle' | 'hub' | 'store'>('vehicle');
  const [formData, setFormData] = useState<any>({});

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
      <header className="fixed top-0 left-0 right-0 z-50 glass-panel">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
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

          <div className="flex items-center gap-4">
            <div className="hidden md:block">
              <WeatherBadge latitude={12.9352} longitude={77.6245} locationName="Koramangala" />
            </div>

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

      <main className="flex-grow pt-40 pb-12 px-6">
        <div className="max-w-7xl mx-auto space-y-8">
          
          <div className="flex gap-2 border-b border-slate-200">
            <button 
              onClick={() => setActiveTab('tickets')}
              className={`px-4 py-3 font-medium text-sm transition-all ${
                activeTab === 'tickets' 
                  ? 'text-amber-600 border-b-2 border-amber-600' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <i className="ph-bold ph-wrench mr-2"></i>My Tickets
            </button>
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
            <button 
              onClick={() => setActiveTab('swap-history')}
              className={`px-4 py-3 font-medium text-sm transition-all ${
                activeTab === 'swap-history' 
                  ? 'text-amber-600 border-b-2 border-amber-600' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <i className="ph-bold ph-truck mr-2"></i>Swap History
            </button>
          </div>

          {activeTab === 'tickets' && technician && (
            <TechnicianTickets technicianId={technician.user_id} hubId={technician.hubId} />
          )}

          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-slate-900">Service Tickets</h3>
                  <span className="px-3 py-1 bg-amber-100 text-amber-700 text-sm font-semibold rounded-full">{serviceTickets.length} Total</span>
                </div>
                {serviceTickets.length === 0 ? (
                  <div className="text-center py-12">
                    <i className="ph-duotone ph-ticket text-5xl text-slate-300 mb-4"></i>
                    <p className="text-slate-500">No service tickets yet</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {serviceTickets.map((ticket) => (
                      <div key={ticket.id} className="p-4 bg-slate-50 rounded-lg border border-slate-100 hover:border-amber-300 transition-colors">
                        <p className="font-semibold text-slate-900 text-sm">{ticket.ticket_number}</p>
                        <p className="text-xs text-slate-600 mt-1">{ticket.issue_description}</p>
                        <div className="flex gap-2 mt-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            ticket.priority === 'high' ? 'bg-red-100 text-red-700' :
                            ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>{ticket.priority?.toUpperCase()}</span>
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            ticket.status === 'completed' ? 'bg-green-100 text-green-700' :
                            ticket.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                            'bg-slate-200 text-slate-700'
                          }`}>{ticket.status?.replace('_', ' ').toUpperCase()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-slate-900">Inventory</h3>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-semibold rounded-full">{partsInventory.length} Parts</span>
                </div>
                {partsInventory.length === 0 ? (
                  <div className="text-center py-12">
                    <i className="ph-duotone ph-package text-5xl text-slate-300 mb-4"></i>
                    <p className="text-slate-500">No parts in inventory</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {partsInventory.map((part) => (
                      <div key={part.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <p className="font-semibold text-slate-900 text-sm">{part.part_name}</p>
                          <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded">₹{part.unit_cost}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-600">
                          <span>Stock: <strong>{part.quantity_in_stock}</strong></span>
                          <span className={part.quantity_in_stock < part.minimum_stock_level ? 'text-red-600 font-semibold' : 'text-green-600'}>{part.quantity_in_stock < part.minimum_stock_level ? 'Low Stock' : 'In Stock'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'vehicles' && (
            <TechnicianVehicleManagement 
              vehicles={vehicles} 
              onRefresh={fetchVehicles}
              technicianId={technician?.user_id || ''}
            />
          )}

          {activeTab === 'hubs' && (
            <HubList hubs={hubs} onAdd={() => handleAddNew('hub')} />
          )}

          {activeTab === 'stores' && (
            <StoreList stores={stores} onAdd={() => handleAddNew('store')} />
          )}

          {activeTab === 'swap-history' && technician && (
            <>
              <div className="mb-6">
                <h2 className="font-display text-3xl font-bold text-slate-900 mb-2">Vehicle Swap History</h2>
                <p className="text-slate-600">Search and view swap history for vehicles in your hub</p>
              </div>
              <VehicleSwapHistorySearch role="technician" userHubId={technician.hubId} />
            </>
          )}

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
