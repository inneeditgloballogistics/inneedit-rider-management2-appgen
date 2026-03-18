'use client';

import { useState, useEffect } from 'react';
import { Package, Warehouse, Wrench, AlertCircle } from 'lucide-react';

interface VehicleStatus {
  available: number;
  assigned: number;
  in_maintenance: number;
  total: number;
}

interface Hub {
  id: number;
  hub_name: string;
  hub_code: string;
  city: string;
  state: string;
}

interface HubVehicleStatus extends Hub {
  status: VehicleStatus;
}

export default function VehicleStatusDashboard() {
  const [hubsData, setHubsData] = useState<HubVehicleStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [overallStats, setOverallStats] = useState<VehicleStatus>({
    available: 0,
    assigned: 0,
    in_maintenance: 0,
    total: 0
  });

  useEffect(() => {
    fetchVehicleStatus();
  }, []);

  const fetchVehicleStatus = async () => {
    try {
      setLoading(true);

      // Fetch all hubs
      const hubsResponse = await fetch('/api/hubs');
      const hubs = await hubsResponse.json();

      // Fetch vehicle status for each hub
      const hubStatusData: HubVehicleStatus[] = [];
      let totalAvailable = 0;
      let totalAssigned = 0;
      let totalMaintenance = 0;
      let totalCount = 0;

      for (const hub of hubs) {
        try {
          const statusResponse = await fetch(
            `/api/vehicle-swap?action=status-breakdown&hubId=${hub.id}`
          );
          if (statusResponse.ok) {
            const status = await statusResponse.json();
            hubStatusData.push({
              ...hub,
              status
            });

            totalAvailable += status.available;
            totalAssigned += status.assigned;
            totalMaintenance += status.in_maintenance;
            totalCount += status.total;
          }
        } catch (err) {
          console.error(`Error fetching status for hub ${hub.id}:`, err);
        }
      }

      setHubsData(hubStatusData);
      setOverallStats({
        available: totalAvailable,
        assigned: totalAssigned,
        in_maintenance: totalMaintenance,
        total: totalCount
      });
    } catch (error) {
      console.error('Error fetching vehicle status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse"></div>
        <p className="text-slate-500 font-medium">Loading vehicle status...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Stats */}
      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-4">Fleet Status Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Total Vehicles</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{overallStats.total}</p>
              </div>
              <Package className="w-12 h-12 text-blue-100" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Available</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{overallStats.available}</p>
              </div>
              <Warehouse className="w-12 h-12 text-green-100" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Assigned</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{overallStats.assigned}</p>
              </div>
              <Package className="w-12 h-12 text-blue-100" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">In Maintenance</p>
                <p className="text-3xl font-bold text-amber-600 mt-2">{overallStats.in_maintenance}</p>
              </div>
              <Wrench className="w-12 h-12 text-amber-100" />
            </div>
          </div>
        </div>
      </div>

      {/* Hub Breakdown */}
      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-4">Vehicle Status by Hub</h3>
        {hubsData.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 text-center">
            <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No hub data available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hubsData.map((hub) => (
              <div
                key={hub.id}
                className="bg-white rounded-lg shadow-sm border border-slate-200 p-6"
              >
                <div className="mb-6">
                  <h4 className="text-lg font-bold text-slate-900">{hub.hub_name}</h4>
                  <p className="text-sm text-slate-600">
                    {hub.hub_code} • {hub.city}, {hub.state}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-slate-700">Total</span>
                    </div>
                    <span className="text-sm font-bold text-slate-900">{hub.status.total}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Warehouse className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-slate-700">Available</span>
                    </div>
                    <span className="text-sm font-bold text-green-600">{hub.status.available}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-slate-700">Assigned</span>
                    </div>
                    <span className="text-sm font-bold text-blue-600">{hub.status.assigned}</span>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-200 pt-3 mt-3">
                    <div className="flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-amber-600" />
                      <span className="text-sm font-medium text-slate-700">In Maintenance</span>
                    </div>
                    <span className="text-sm font-bold text-amber-600">{hub.status.in_maintenance}</span>
                  </div>
                </div>

                {/* Progress Bars */}
                <div className="mt-6 space-y-2">
                  <div className="text-xs text-slate-600 font-medium mb-2">Status Distribution</div>
                  <div className="flex gap-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    {hub.status.total > 0 && (
                      <>
                        <div
                          className="bg-green-500 h-full"
                          style={{
                            width: `${(hub.status.available / hub.status.total) * 100}%`
                          }}
                        />
                        <div
                          className="bg-blue-500 h-full"
                          style={{
                            width: `${(hub.status.assigned / hub.status.total) * 100}%`
                          }}
                        />
                        <div
                          className="bg-amber-500 h-full"
                          style={{
                            width: `${(hub.status.in_maintenance / hub.status.total) * 100}%`
                          }}
                        />
                      </>
                    )}
                  </div>
                  <div className="flex justify-between text-xs text-slate-600 mt-2">
                    <span>Available: {hub.status.total > 0 ? Math.round((hub.status.available / hub.status.total) * 100) : 0}%</span>
                    <span>Assigned: {hub.status.total > 0 ? Math.round((hub.status.assigned / hub.status.total) * 100) : 0}%</span>
                    <span>Maintenance: {hub.status.total > 0 ? Math.round((hub.status.in_maintenance / hub.status.total) * 100) : 0}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
