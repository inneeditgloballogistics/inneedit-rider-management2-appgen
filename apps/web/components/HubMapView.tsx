'use client';

import { useEffect, useRef, useState } from 'react';

interface Hub {
  id: number;
  hub_name: string;
  hub_code: string;
  location: string;
  latitude: number;
  longitude: number;
  manager_name?: string;
  manager_phone?: string;
  status: string;
}

declare global {
  interface Window {
    google: any;
    markerClusterer: any;
  }
}

export default function HubMapView() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHubs();
  }, []);

  const fetchHubs = async () => {
    try {
      const res = await fetch('/api/hubs?action=map');
      const data = await res.json();
      setHubs(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching hubs:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!mapRef.current || !window.google || hubs.length === 0 || map) return;

    // Initialize map centered on first hub or default location
    const center = hubs[0]
      ? { lat: parseFloat(hubs[0].latitude.toString()), lng: parseFloat(hubs[0].longitude.toString()) }
      : { lat: 12.9716, lng: 77.5946 }; // Bangalore default

    const newMap = new window.google.maps.Map(mapRef.current, {
      zoom: 12,
      center,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
    });

    setMap(newMap);

    // Create markers for each hub
    const markers = hubs.map((hub) => {
      const position = {
        lat: parseFloat(hub.latitude.toString()),
        lng: parseFloat(hub.longitude.toString()),
      };

      const marker = new window.google.maps.Marker({
        position,
        map: newMap,
        title: hub.hub_name,
        animation: window.google.maps.Animation.DROP,
      });

      // Create info window content with all required details
      const infoContent = `
        <div style="font-family: system-ui, sans-serif; padding: 16px; max-width: 350px;">
          <div style="border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 12px;">
            <h3 style="margin: 0 0 6px 0; font-size: 18px; font-weight: 700; color: #0f172a;">
              ${hub.hub_name}
            </h3>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              <span style="display: inline-block; padding: 2px 8px; background: #e0e7ff; color: #4338ca; border-radius: 4px; font-size: 11px; font-weight: 600;">
                ${hub.hub_code}
              </span>
              <span style="display: inline-block; padding: 2px 8px; background: ${hub.status === 'active' ? '#dcfce7' : '#fee2e2'}; color: ${hub.status === 'active' ? '#15803d' : '#b91c1c'}; border-radius: 4px; font-size: 11px; font-weight: 600;">
                ${hub.status}
              </span>
            </div>
          </div>
          
          <div style="margin-bottom: 12px;">
            <p style="margin: 0 0 8px 0; font-size: 13px; color: #475569; line-height: 1.5;">
              <strong style="color: #1e293b;">📍 Location:</strong><br/>
              ${hub.location}
            </p>
          </div>

          ${hub.manager_name || hub.manager_phone ? `
            <div style="padding: 10px; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); border-radius: 8px; margin-bottom: 12px; border: 1px solid #cbd5e1;">
              <p style="margin: 0 0 2px 0; font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                Hub In-charge
              </p>
              ${hub.manager_name ? `
                <p style="margin: 0 0 4px 0; font-size: 14px; color: #0f172a; font-weight: 600;">
                  👤 ${hub.manager_name}
                </p>
              ` : ''}
              ${hub.manager_phone ? `
                <p style="margin: 0; font-size: 13px; color: #334155;">
                  📞 <a href="tel:${hub.manager_phone}" style="color: #2563eb; text-decoration: none; font-weight: 500;">${hub.manager_phone}</a>
                </p>
              ` : ''}
            </div>
          ` : ''}

          <div style="border-top: 1px solid #e2e8f0; padding-top: 12px;">
            <p style="margin: 0; font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
              📍 Coordinates
            </p>
            <p style="margin: 4px 0 0 0; font-size: 11px; color: #475569; font-family: monospace;">
              Lat: ${parseFloat(hub.latitude.toString()).toFixed(4)}<br/>
              Lng: ${parseFloat(hub.longitude.toString()).toFixed(4)}
            </p>
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
      hubs.forEach((hub) => {
        bounds.extend({
          lat: parseFloat(hub.latitude.toString()),
          lng: parseFloat(hub.longitude.toString()),
        });
      });
      newMap.fitBounds(bounds);
    }
  }, [hubs, map]);

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

  if (hubs.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="ph-duotone ph-map-pin-line text-3xl text-slate-400"></i>
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">No Hubs with Locations</h3>
        <p className="text-slate-600">Add hubs with Google Maps locations to see them here</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <i className="ph-duotone ph-map-trifold text-2xl text-brand-600"></i>
          <h3 className="font-semibold text-slate-900">Hub Locations Map</h3>
        </div>
        <div className="text-sm text-slate-600">
          <span className="font-medium">{hubs.length}</span> hub{hubs.length !== 1 ? 's' : ''} displayed
        </div>
      </div>
      <div ref={mapRef} style={{ height: '600px', width: '100%' }} />
    </div>
  );
}
