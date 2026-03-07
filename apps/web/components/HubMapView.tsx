'use client';

import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    google: any;
  }
}

export default function HubMapView() {
  const [hubs, setHubs] = useState<any[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    fetchHubs();
  }, []);

  const fetchHubs = async () => {
    try {
      const res = await fetch('/api/hubs?action=map');
      const data = await res.json();
      setHubs(data);
      setMapLoaded(true);
    } catch (error) {
      console.error('Error fetching hubs:', error);
      setMapLoaded(true);
    }
  };

  const hubsWithCoordinates = hubs.filter(hub => hub.latitude && hub.longitude);

  if (!mapLoaded) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
          <i className="ph-duotone ph-map-trifold text-3xl text-slate-400"></i>
        </div>
        <p className="text-slate-600">Loading map...</p>
      </div>
    );
  }

  if (hubsWithCoordinates.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
        <i className="ph-duotone ph-map-trifold text-6xl text-slate-300 block mb-4"></i>
        <p className="text-slate-600">No hubs with location data to display on map</p>
      </div>
    );
  }

  // Create map embed URL with multiple markers
  const mapQuery = hubsWithCoordinates
    .map(h => `${h.latitude},${h.longitude}`)
    .join('|');

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div style={{ width: '100%', height: '600px' }} className="relative">
        <iframe
          width="100%"
          height="100%"
          frameBorder="0"
          src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBBcRoKmzJ9gj0s0YN-Pm5fPb6LKJPo9bE&q=${mapQuery}`}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        ></iframe>
      </div>

      {/* Hub List Below Map */}
      <div className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Hubs on Map ({hubsWithCoordinates.length})</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {hubsWithCoordinates.map((hub) => (
            <div key={hub.id} className="p-4 border border-slate-200 rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900">{hub.hub_name}</h4>
                  <p className="text-sm text-slate-600 mt-1">{hub.location}</p>
                  <div className="mt-2 space-y-1 text-sm">
                    <p><strong>Code:</strong> {hub.hub_code}</p>
                    <p><strong>In-charge:</strong> {hub.manager_name}</p>
                    <p><strong>Phone:</strong> {hub.manager_phone}</p>
                    <p className="text-xs text-slate-500 mt-1">Lat: {(typeof hub.latitude === 'number' ? hub.latitude : parseFloat(hub.latitude)).toFixed(4)}, Lng: {(typeof hub.longitude === 'number' ? hub.longitude : parseFloat(hub.longitude)).toFixed(4)}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ml-2 ${
                  hub.status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-slate-100 text-slate-700'
                }`}>
                  {hub.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
