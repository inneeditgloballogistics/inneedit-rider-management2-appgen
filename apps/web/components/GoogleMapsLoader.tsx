'use client';

import { useEffect, useState } from 'react';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

declare global {
  interface Window {
    google: any;
    googleMapsLoaded?: boolean;
  }
}

let isLoading = false;

export function GoogleMapsLoader({ children }: { children: React.ReactNode }) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      console.error('Google Maps API key is missing. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to .env file');
      setLoaded(true); // Still render children
      return;
    }

    // Check if already loaded
    if (window.google && window.google.maps) {
      setLoaded(true);
      return;
    }

    // Check if script tag already exists
    if (window.googleMapsLoaded || isLoading) {
      // Wait for the existing script to load
      const checkLoaded = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(checkLoaded);
          setLoaded(true);
        }
      }, 100);
      return () => clearInterval(checkLoaded);
    }

    // Check if script tag already exists in DOM
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      const checkLoaded = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(checkLoaded);
          setLoaded(true);
        }
      }, 100);
      return () => clearInterval(checkLoaded);
    }

    // Load the script
    isLoading = true;
    window.googleMapsLoaded = true;

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,marker`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      isLoading = false;
      setLoaded(true);
    };
    script.onerror = () => {
      isLoading = false;
      console.error('Failed to load Google Maps API');
      setLoaded(true);
    };

    document.head.appendChild(script);
  }, []);

  return <>{children}</>;
}
