'use client';

import { useEffect, useState } from 'react';

interface Hub {
  id: number;
  hub_name: string;
  latitude: number;
  longitude: number;
  city: string;
  hub_code: string;
}

interface Store {
  id: number;
  store_name: string;
  latitude: number;
  longitude: number;
  city: string;
  client: string;
}

export default function DashboardMapView() {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const [hubsRes, storesRes] = await Promise.all([
        fetch('/api/hubs'),
        fetch('/api/stores'),
      ]);

      const hubsData = await hubsRes.json();
      const storesData = await storesRes.json();

      // Filter to only include items with valid coordinates
      const validHubs = hubsData.filter((h: Hub) => h.latitude && h.longitude);
      const validStores = storesData.filter((s: Store) => s.latitude && s.longitude);

      setHubs(validHubs);
      setStores(validStores);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching locations:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && (window as any).google) {
      initMap();
    }
  }, [loading, hubs, stores]);

  const initMap = () => {
    const mapElement = document.getElementById('dashboard-map');
    if (!mapElement) return;

    // Default center (India)
    let center = { lat: 20.5937, lng: 78.9629 };
    let zoom = 5;

    // If we have locations, calculate bounds
    const allLocations = [
      ...hubs.map(h => ({ lat: parseFloat(h.latitude as any), lng: parseFloat(h.longitude as any) })),
      ...stores.map(s => ({ lat: parseFloat(s.latitude as any), lng: parseFloat(s.longitude as any) }))
    ];

    if (allLocations.length > 0) {
      // Use first location as center for single location
      if (allLocations.length === 1) {
        center = allLocations[0];
        zoom = 12;
      }
    }

    const mapInstance = new google.maps.Map(mapElement, {
      center,
      zoom,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ],
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
    });

    setMap(mapInstance);

    // Add hub markers with 3D pin icons
    hubs.forEach((hub) => {
      const marker = new google.maps.Marker({
        position: { lat: parseFloat(hub.latitude as any), lng: parseFloat(hub.longitude as any) },
        map: mapInstance,
        title: hub.hub_name,
        icon: {
          path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
          fillColor: '#9333ea',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          scale: 1.8,
          anchor: new google.maps.Point(12, 22),
        },
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; max-width: 200px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <div style="width: 32px; height: 32px; background: #f3e8ff; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 20px;">🏢</span>
              </div>
              <div>
                <h3 style="margin: 0; font-size: 14px; font-weight: 600; color: #1e293b;">${hub.hub_name}</h3>
                <p style="margin: 0; font-size: 11px; color: #64748b; font-family: monospace;">${hub.hub_code}</p>
              </div>
            </div>
            <div style="font-size: 12px; color: #475569; display: flex; align-items: center; gap: 4px;">
              <span>📍</span>
              <span>${hub.city}</span>
            </div>
          </div>
        `,
      });

      marker.addListener('click', () => {
        infoWindow.open(mapInstance, marker);
      });
    });

    // Add store markers with 3D pin icons
    stores.forEach((store) => {
      const marker = new google.maps.Marker({
        position: { lat: parseFloat(store.latitude as any), lng: parseFloat(store.longitude as any) },
        map: mapInstance,
        title: store.store_name,
        icon: {
          path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
          fillColor: '#10b981',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          scale: 1.8,
          anchor: new google.maps.Point(12, 22),
        },
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; max-width: 200px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <div style="width: 32px; height: 32px; background: #d1fae5; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 20px;">🏪</span>
              </div>
              <div>
                <h3 style="margin: 0; font-size: 14px; font-weight: 600; color: #1e293b;">${store.store_name}</h3>
                <p style="margin: 0; font-size: 11px; color: #64748b;">${store.client}</p>
              </div>
            </div>
            <div style="font-size: 12px; color: #475569; display: flex; align-items: center; gap: 4px;">
              <span>📍</span>
              <span>${store.city}</span>
            </div>
          </div>
        `,
      });

      marker.addListener('click', () => {
        infoWindow.open(mapInstance, marker);
      });
    });

    // Auto-fit bounds if we have multiple locations
    if (allLocations.length > 1) {
      const bounds = new google.maps.LatLngBounds();
      allLocations.forEach((loc) => bounds.extend(loc));
      mapInstance.fitBounds(bounds);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
          <i className="ph-duotone ph-map-trifold text-3xl text-slate-400"></i>
        </div>
        <p className="text-slate-600">Loading map...</p>
      </div>
    );
  }

  if (hubs.length === 0 && stores.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="ph-duotone ph-map-pin-slash text-3xl text-slate-400"></i>
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">No Locations to Display</h3>
        <p className="text-slate-500">Add hubs and stores with GPS coordinates to see them on the map</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-xl font-bold text-slate-900 mb-1">Location Overview</h3>
            <p className="text-sm text-slate-500">All hubs and stores on the map</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-600"></div>
              <span className="text-sm text-slate-600 font-medium">Hubs ({hubs.length})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-600"></div>
              <span className="text-sm text-slate-600 font-medium">Stores ({stores.length})</span>
            </div>
          </div>
        </div>
      </div>
      <div id="dashboard-map" className="w-full h-[500px]"></div>
    </div>
  );
}
