'use client';

import { useEffect, useRef, useState } from 'react';
import WeatherCard from './WeatherCard';

interface Store {
  id: number;
  store_name: string;
  store_code: string;
  client: string;
  location: string;
  latitude: number;
  longitude: number;
  store_manager_name?: string;
  store_manager_phone?: string;
  active_riders_count: number;
  inactive_riders_count: number;
  total_riders_count: number;
}

declare global {
  interface Window {
    google: any;
    markerClusterer: any;
  }
}

export default function StoreMapView() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const res = await fetch('/api/stores?action=map');
      const data = await res.json();
      setStores(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching stores:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!mapRef.current || !window.google || stores.length === 0 || map) return;

    // Initialize map centered on first store or default location
    const center = stores[0]
      ? { lat: parseFloat(stores[0].latitude.toString()), lng: parseFloat(stores[0].longitude.toString()) }
      : { lat: 12.9716, lng: 77.5946 }; // Bangalore default

    const newMap = new window.google.maps.Map(mapRef.current, {
      zoom: 12,
      center,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
    });

    setMap(newMap);

    // Create markers for each store
    const markers = stores.map((store) => {
      const position = {
        lat: parseFloat(store.latitude.toString()),
        lng: parseFloat(store.longitude.toString()),
      };

      const marker = new window.google.maps.Marker({
        position,
        map: newMap,
        title: store.store_name,
        animation: window.google.maps.Animation.DROP,
      });

      // Create info window content with all required details
      const infoContent = `
        <div style="font-family: system-ui, sans-serif; padding: 16px; max-width: 350px;">
          <div style="border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 12px;">
            <h3 style="margin: 0 0 6px 0; font-size: 18px; font-weight: 700; color: #0f172a;">
              ${store.store_name}
            </h3>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              <span style="display: inline-block; padding: 2px 8px; background: #e0e7ff; color: #4338ca; border-radius: 4px; font-size: 11px; font-weight: 600;">
                ${store.store_code}
              </span>
              <span style="display: inline-block; padding: 2px 8px; background: #dbeafe; color: #1e40af; border-radius: 4px; font-size: 11px; font-weight: 600;">
                ${store.client}
              </span>
            </div>
          </div>
          
          <div style="margin-bottom: 12px;">
            <p style="margin: 0 0 8px 0; font-size: 13px; color: #475569; line-height: 1.5;">
              <strong style="color: #1e293b;">📍 Location:</strong><br/>
              ${store.location}
            </p>
          </div>

          ${store.store_manager_name || store.store_manager_phone ? `
            <div style="padding: 10px; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); border-radius: 8px; margin-bottom: 12px; border: 1px solid #cbd5e1;">
              <p style="margin: 0 0 2px 0; font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                Store Manager
              </p>
              ${store.store_manager_name ? `
                <p style="margin: 0 0 4px 0; font-size: 14px; color: #0f172a; font-weight: 600;">
                  👤 ${store.store_manager_name}
                </p>
              ` : ''}
              ${store.store_manager_phone ? `
                <p style="margin: 0; font-size: 13px; color: #334155;">
                  📞 <a href="tel:${store.store_manager_phone}" style="color: #2563eb; text-decoration: none; font-weight: 500;">${store.store_manager_phone}</a>
                </p>
              ` : ''}
            </div>
          ` : ''}
          
          <div style="border-top: 1px solid #e2e8f0; padding-top: 12px;">
            <p style="margin: 0 0 10px 0; font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
              Rider Statistics
            </p>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
              <div style="text-align: center; padding: 12px 8px; background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-radius: 8px; border: 2px solid #3b82f6;">
                <div style="font-size: 22px; font-weight: 800; color: #1e40af; line-height: 1;">${store.total_riders_count || 0}</div>
                <div style="font-size: 10px; color: #1e40af; font-weight: 600; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Total Riders</div>
              </div>
              <div style="text-align: center; padding: 12px 8px; background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); border-radius: 8px; border: 2px solid #22c55e;">
                <div style="font-size: 22px; font-weight: 800; color: #15803d; line-height: 1;">${store.active_riders_count || 0}</div>
                <div style="font-size: 10px; color: #15803d; font-weight: 600; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Active</div>
              </div>
              <div style="text-align: center; padding: 12px 8px; background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); border-radius: 8px; border: 2px solid #ef4444;">
                <div style="font-size: 22px; font-weight: 800; color: #b91c1c; line-height: 1;">${store.inactive_riders_count || 0}</div>
                <div style="font-size: 10px; color: #b91c1c; font-weight: 600; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Inactive</div>
              </div>
            </div>
          </div>
        </div>
      `;

      const infoWindow = new window.google.maps.InfoWindow({
        content: infoContent,
      });

      marker.addListener('click', () => {
        infoWindow.open(newMap, marker);
      });

      return marker;
    });

    // Add marker clustering if MarkerClusterer is available
    if (window.markerClusterer && markers.length > 1) {
      new window.markerClusterer.MarkerClusterer({ markers, map: newMap });
    }

    // Fit bounds to show all markers
    if (markers.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      stores.forEach((store) => {
        bounds.extend({
          lat: parseFloat(store.latitude.toString()),
          lng: parseFloat(store.longitude.toString()),
        });
      });
      newMap.fitBounds(bounds);
    }
  }, [stores, map]);

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

  if (!window.google) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="ph-duotone ph-warning text-3xl text-red-500"></i>
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Google Maps Not Loaded</h3>
        <p className="text-slate-600 mb-4">
          Please add your Google Maps API key to the .env file:
        </p>
        <code className="bg-slate-100 px-4 py-2 rounded text-sm text-slate-800 inline-block">
          NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
        </code>
      </div>
    );
  }

  if (stores.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="ph-duotone ph-map-pin-line text-3xl text-slate-400"></i>
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">No Stores with Locations</h3>
        <p className="text-slate-600">Add stores with Google Maps locations to see them here</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <i className="ph-duotone ph-map-trifold text-2xl text-brand-600"></i>
          <h3 className="font-semibold text-slate-900">Store Locations Map</h3>
        </div>
        <div className="text-sm text-slate-600">
          <span className="font-medium">{stores.length}</span> store{stores.length !== 1 ? 's' : ''} displayed
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 p-4 border-b border-slate-200">
        {stores.slice(0, 4).map((store) => (
          <WeatherCard
            key={store.id}
            latitude={store.latitude}
            longitude={store.longitude}
            locationName={store.store_name}
            showDetails={false}
          />
        ))}
      </div>
      <div ref={mapRef} style={{ height: '600px', width: '100%' }} />
    </div>
  );
}
