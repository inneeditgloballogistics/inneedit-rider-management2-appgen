'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { LogOut, Package, Warehouse, AlertCircle, Users, Search, Wrench, RefreshCw, Truck } from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';
import VehicleHandoverModal from '@/components/VehicleHandoverModal';
import HubManagerTickets from '@/components/HubManagerTickets';
import VehicleSwapModal from '@/components/VehicleSwapModal';
import SwapRequestsManager from '@/components/SwapRequestsManager';
import PostSwapHandoverModal from '@/components/PostSwapHandoverModal';
import PartsInventoryManagement from '@/components/PartsInventoryManagement';

function HubManagerDashboardContent() {
  const router = useRouter();
  const [managerData, setManagerData] = useState<any>(null);
  const [hubData, setHubData] = useState<any>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [newRiders, setNewRiders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [handoverModalOpen, setHandoverModalOpen] = useState(false);
  const [selectedRider, setSelectedRider] = useState<any>(null);
  const [vehicleSwapOpen, setVehicleSwapOpen] = useState(false);
  const [selectedVehicleForSwap, setSelectedVehicleForSwap] = useState<any>(null);
  const [selectedRiderForSwap, setSelectedRiderForSwap] = useState<any>(null);
  const [approvedSwaps, setApprovedSwaps] = useState<any[]>([]);
  const [selectedSwapForHandover, setSelectedSwapForHandover] = useState<any>(null);

  // Check if hub manager is logged in and read tab from URL
  useEffect(() => {
    const checkAuth = () => {
      try {
        const storedManager = localStorage.getItem('hubManager');
        if (!storedManager) {
          router.push('/login');
          return;
        }
        setManagerData(JSON.parse(storedManager));
        
        // Check if there's a tab parameter in the URL
        const searchParams = new URLSearchParams(window.location.search);
        const tabParam = searchParams.get('tab');
        if (tabParam) {
          setActiveTab(tabParam);
        }
      } catch (error) {
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  // Fetch hub manager data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get hub manager from localStorage
        const storedManager = localStorage.getItem('hubManager');
        if (storedManager) {
          const managerInfo = JSON.parse(storedManager);
          setManagerData(managerInfo);

          // Fetch hub details from API
          const hubResponse = await fetch(`/api/hubs`);
          if (hubResponse.ok) {
            const hubs = await hubResponse.json();
            // Use hubId or hub_id depending on what was stored
            const hubId = managerInfo.hubId || managerInfo.hub_id;
            const hubInfo = hubs.find((h: any) => h.id === hubId);
            setHubData(hubInfo);

            // Get vehicles at this hub
            const vehiclesResponse = await fetch(`/api/vehicles?hubId=${hubId}`);
            if (vehiclesResponse.ok) {
              const vehiclesData = await vehiclesResponse.json();
              setVehicles(vehiclesData);
            }

            // Get new riders at this hub
            const ridersResponse = await fetch(`/api/vehicle-handover?action=new-riders&hubId=${hubId}`);
            if (ridersResponse.ok) {
              const ridersData = await ridersResponse.json();
              setNewRiders(ridersData);
            }

            // Get approved swaps awaiting handover
            const swapsResponse = await fetch(`/api/swap-requests?action=hub-manager&hubId=${hubId}&status=approved`);
            if (swapsResponse.ok) {
              const swapsData = await swapsResponse.json();
              setApprovedSwaps(swapsData);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleLogout = async () => {
    try {
      localStorage.removeItem('hubManager');
      await fetch('/api/hub-managers/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    }
    router.push('/login');
  };

  const handleOpenHandover = (rider: any) => {
    setSelectedRider(rider);
    setHandoverModalOpen(true);
  };

  const handleHandoverComplete = () => {
    // Refresh riders list
    if (managerData && (managerData.hubId || managerData.hub_id)) {
      const hubId = managerData.hubId || managerData.hub_id;
      fetch(`/api/vehicle-handover?action=new-riders&hubId=${hubId}`)
        .then(res => res.json())
        .then(data => setNewRiders(data));
    }
  };

  const handleOpenVehicleSwap = (vehicle: any, rider: any) => {
    setSelectedVehicleForSwap(vehicle);
    setSelectedRiderForSwap(rider);
    setVehicleSwapOpen(true);
  };

  const handleSwapComplete = () => {
    // Refresh vehicles list and approved swaps
    if (managerData && (managerData.hubId || managerData.hub_id)) {
      const hubId = managerData.hubId || managerData.hub_id;
      fetch(`/api/vehicles?hubId=${hubId}`)
        .then(res => res.json())
        .then(data => setVehicles(data));
      
      // Fetch approved swaps awaiting handover
      fetch(`/api/swap-requests?action=hub-manager&hubId=${hubId}&status=approved`)
        .then(res => res.json())
        .then(data => setApprovedSwaps(data));
    }
  };

  const handlePostSwapHandoverComplete = () => {
    // Refresh vehicles and approved swaps
    handleSwapComplete();
    setSelectedSwapForHandover(null);
  };

  const filteredRiders = newRiders.filter(rider =>
    rider.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rider.cee_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const hubId = managerData?.hubId || managerData?.hub_id;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-sm font-medium text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mesh-bg min-h-screen flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="h-10">
              <img 
                src="https://app-cdn.appgen.com/c8d1da7a-8da9-4a1f-8aaa-2cb65f828731/assets/uploaded_1772434426357_uwdii.png" 
                alt="inneedit" 
                className="h-full w-auto" 
              />
            </div>
            <div>
              <h1 className="font-display font-bold text-base leading-none text-slate-900">
                inneedit Global Logistics
              </h1>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Hub Manager Dashboard
              </span>
            </div>
          </div>

          {/* Hub Info */}
          {hubData && (
            <div className="hidden md:block">
              <h2 className="text-sm font-semibold text-slate-900">{hubData.hub_name}</h2>
              <p className="text-xs text-slate-500">{hubData.city}, {hubData.state}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4">
            <NotificationBell />
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-900">{managerData?.name || 'Hub Manager'}</p>
                <p className="text-xs text-slate-500">{hubData?.hub_code || 'HUB'}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow pt-28 pb-12 px-6">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="flex border-b border-slate-200">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex-1 px-6 py-4 font-medium text-center transition ${
                  activeTab === 'overview'
                    ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('riders')}
                className={`flex-1 px-6 py-4 font-medium text-center transition ${
                  activeTab === 'riders'
                    ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-4 h-4 inline mr-2" />
                New Riders ({newRiders.length})
              </button>
              <button
                onClick={() => setActiveTab('tickets')}
                className={`flex-1 px-6 py-4 font-medium text-center transition ${
                  activeTab === 'tickets'
                    ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Wrench className="w-4 h-4 inline mr-2" />
                Support Tickets
              </button>
              <button
                onClick={() => setActiveTab('swaps')}
                className={`flex-1 px-6 py-4 font-medium text-center transition relative ${
                  activeTab === 'swaps'
                    ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Truck className="w-4 h-4 inline mr-2" />
                Swap Requests
                {approvedSwaps.length > 0 && (
                  <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                    {approvedSwaps.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('inventory')}
                className={`flex-1 px-6 py-4 font-medium text-center transition ${
                  activeTab === 'inventory'
                    ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Package className="w-4 h-4 inline mr-2" />
                Parts Inventory
              </button>
            </div>
          </div>
          
          {activeTab === 'overview' && (
            <>
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600 font-medium">Total Vehicles</p>
                      <p className="text-3xl font-bold text-slate-900 mt-2">
                        {vehicles.length}
                      </p>
                    </div>
                    <Package className="w-12 h-12 text-blue-100" />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600 font-medium">Available Vehicles</p>
                      <p className="text-3xl font-bold text-slate-900 mt-2">
                        {vehicles.filter((v: any) => v.status === 'available').length}
                      </p>
                    </div>
                    <Warehouse className="w-12 h-12 text-green-100" />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600 font-medium">In Maintenance</p>
                      <p className="text-3xl font-bold text-slate-900 mt-2">
                        {vehicles.filter((v: any) => v.status === 'in_maintenance').length}
                      </p>
                    </div>
                    <Wrench className="w-12 h-12 text-amber-100" />
                  </div>
                </div>
              </div>

              {/* Hub Information */}
              {hubData && (
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8">
                  <h2 className="text-xl font-bold text-slate-900 mb-6">Hub Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-sm font-medium text-slate-600 mb-4">Basic Details</h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-slate-500">Hub Name</p>
                          <p className="text-sm font-medium text-slate-900">{hubData.hub_name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Hub Code</p>
                          <p className="text-sm font-medium text-slate-900">{hubData.hub_code}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Location</p>
                          <p className="text-sm font-medium text-slate-900">{hubData.location}, {hubData.city}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">State</p>
                          <p className="text-sm font-medium text-slate-900">{hubData.state}</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-slate-600 mb-4">Manager Details</h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-slate-500">Manager Name</p>
                          <p className="text-sm font-medium text-slate-900">{managerData?.name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Manager Email</p>
                          <p className="text-sm font-medium text-slate-900">{managerData?.email}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Manager Phone</p>
                          <p className="text-sm font-medium text-slate-900">{hubData.manager_phone || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Pincode</p>
                          <p className="text-sm font-medium text-slate-900">{hubData.pincode}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Vehicles List */}
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-200">
                  <h2 className="text-xl font-bold text-slate-900">Hub Vehicles</h2>
                  <p className="text-sm text-slate-600 mt-1">{vehicles.length} vehicles at this hub</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-8 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Vehicle Number</th>
                        <th className="px-8 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Type</th>
                        <th className="px-8 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Model</th>
                        <th className="px-8 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                        <th className="px-8 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Assigned To</th>
                        <th className="px-8 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vehicles.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-8 py-8 text-center">
                            <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500">No vehicles at this hub yet</p>
                          </td>
                        </tr>
                      ) : (
                        vehicles.map((vehicle: any) => (
                          <tr key={vehicle.id} className="border-b border-slate-200 hover:bg-slate-50 transition">
                            <td className="px-8 py-4">
                              <p className="font-medium text-slate-900">{vehicle.vehicle_number}</p>
                            </td>
                            <td className="px-8 py-4">
                              <p className="text-sm text-slate-600">{vehicle.vehicle_type}</p>
                            </td>
                            <td className="px-8 py-4">
                              <p className="text-sm text-slate-600">{vehicle.model}</p>
                            </td>
                            <td className="px-8 py-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                vehicle.status === 'available' 
                                  ? 'bg-green-100 text-green-700'
                                  : vehicle.status === 'assigned'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}>
                                {vehicle.status === 'in_maintenance' ? 'In Maintenance' : vehicle.status}
                              </span>
                            </td>
                            <td className="px-8 py-4">
                              <p className="text-sm text-slate-600">{vehicle.assigned_rider_id || 'Unassigned'}</p>
                            </td>
                            <td className="px-8 py-4">
                              {vehicle.status === 'assigned' && (
                                <button
                                  onClick={() => handleOpenVehicleSwap(vehicle, { cee_id: vehicle.assigned_rider_id, full_name: 'Rider' })}
                                  className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition font-semibold"
                                  title="Swap this vehicle with an available one"
                                >
                                  Swap
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeTab === 'riders' && (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
              {/* Search Bar */}
              <div className="px-8 py-6 border-b border-slate-200">
                <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-lg">
                  <Search size={20} className="text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search by name or CEE ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-slate-900"
                  />
                </div>
                <p className="text-sm text-slate-600 mt-3">
                  {filteredRiders.length} rider{filteredRiders.length !== 1 ? 's' : ''} ready for handover
                </p>
              </div>

              {/* Riders List */}
              {filteredRiders.length === 0 ? (
                <div className="px-8 py-12 text-center">
                  <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">
                    {newRiders.length === 0
                      ? 'No new riders at this hub yet'
                      : 'No riders match your search'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {filteredRiders.map((rider: any) => (
                    <div
                      key={rider.id}
                      className="px-8 py-6 hover:bg-slate-50 transition flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900">{rider.full_name}</h3>
                        <div className="grid grid-cols-2 gap-4 mt-2 text-sm text-slate-600">
                          <div>
                            <p className="text-xs text-slate-500">CEE ID</p>
                            <p className="font-medium text-slate-900">{rider.cee_id}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Phone</p>
                            <p className="font-medium text-slate-900">{rider.phone}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Vehicle</p>
                            <p className="font-medium text-slate-900">{rider.vehicle_number}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Status</p>
                            <p className="font-medium text-amber-600">Awaiting Handover</p>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleOpenHandover(rider)}
                        className="ml-6 px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition whitespace-nowrap"
                      >
                        Start Handover
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'tickets' && hubId && (
            <HubManagerTickets hubId={hubId} hubManagerId={managerData?.id} />
          )}

          {activeTab === 'swaps' && hubId && (
            <>
              <SwapRequestsManager hubId={hubId} />

              {/* Approved Swaps - Awaiting Handover */}
              {approvedSwaps.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mt-8">
                  <div className="px-8 py-6 border-b border-slate-200 bg-gradient-to-r from-green-50 to-green-100">
                    <h2 className="text-xl font-bold text-green-900">✓ Approved Swaps - Awaiting Handover</h2>
                    <p className="text-sm text-green-800 mt-1">New vehicle is ready. Complete the handover with rider to finalize the swap.</p>
                  </div>
                  <div className="divide-y divide-slate-200">
                    {approvedSwaps.map((swap: any) => (
                      <div key={swap.id} className="p-6 hover:bg-green-50 transition">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-900 text-lg">
                              {swap.rider_name} ({swap.rider_cee_id})
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">Ticket #{swap.ticket_number}</p>
                          </div>
                          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                            APPROVED ✓
                          </span>
                        </div>

                        {/* Swap Details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg mb-4">
                          <div>
                            <p className="text-xs text-slate-600 font-medium">Old Vehicle</p>
                            <p className="text-sm font-mono font-semibold text-slate-900">{swap.current_vehicle_number}</p>
                            <p className="text-xs text-slate-600 mt-1">{swap.current_vehicle_type}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-600 font-medium">Status</p>
                            <p className="text-sm font-semibold text-amber-600 mt-1">In Maintenance (pending pickup)</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-600 font-medium">New Vehicle</p>
                            <p className="text-sm font-mono font-semibold text-slate-900">{swap.replacement_vehicle_number}</p>
                            <p className="text-xs text-slate-600 mt-1">{swap.replacement_vehicle_type}</p>
                          </div>
                        </div>

                        {/* Action Button */}
                        <button
                          onClick={() => setSelectedSwapForHandover(swap)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition flex items-center gap-2"
                        >
                          <Truck size={16} />
                          Complete Handover
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'inventory' && hubId && (
            <PartsInventoryManagement hubId={hubId} />
          )}
        </div>
      </main>

      {/* Handover Modal */}
      <VehicleHandoverModal
        isOpen={handoverModalOpen}
        onClose={() => {
          setHandoverModalOpen(false);
          setSelectedRider(null);
        }}
        rider={selectedRider}
        hubManagerId={managerData?.id}
        onHandoverComplete={handleHandoverComplete}
      />

      {/* Vehicle Swap Modal */}
      {selectedVehicleForSwap && selectedRiderForSwap && (
        <VehicleSwapModal
          isOpen={vehicleSwapOpen}
          onClose={() => {
            setVehicleSwapOpen(false);
            setSelectedVehicleForSwap(null);
            setSelectedRiderForSwap(null);
          }}
          oldVehicle={selectedVehicleForSwap}
          riderCeeId={selectedRiderForSwap.cee_id}
          riderName={selectedRiderForSwap.full_name}
          hubId={hubId}
          onSwapComplete={handleSwapComplete}
        />
      )}

      {/* Post-Swap Vehicle Handover Modal */}
      {selectedSwapForHandover && (
        <PostSwapHandoverModal
          isOpen={!!selectedSwapForHandover}
          onClose={() => setSelectedSwapForHandover(null)}
          swap={selectedSwapForHandover}
          hubManagerId={managerData?.id}
          onHandoverComplete={handlePostSwapHandoverComplete}
        />
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-slate-500">
              © 2024 inneedit Global Logistics Private Limited. All rights reserved.
            </div>
            <div className="flex gap-6 text-sm font-medium text-slate-600">
              <a href="#" className="hover:text-slate-900 transition-colors">Help Center</a>
              <a href="#" className="hover:text-slate-900 transition-colors">Contact Support</a>
              <a href="#" className="hover:text-slate-900 transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function HubManagerDashboardPage() {
  return <HubManagerDashboardContent />;
}