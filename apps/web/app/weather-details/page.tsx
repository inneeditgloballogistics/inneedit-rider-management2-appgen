'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import WeatherSettingsModal from '@/components/WeatherSettingsModal';

interface WeatherData {
  current: {
    temp_c: number;
    condition: {
      text: string;
      icon: string;
    };
    is_day: number;
  };
  location: {
    name: string;
    region: string;
    country: string;
    latitude: number;
    longitude: number;
  };
}

export default function WeatherDetailsPage() {
  const router = useRouter();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [displayName, setDisplayName] = useState<string>('Current Location');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [hourlyForecast, setHourlyForecast] = useState<any[]>([]);

  useEffect(() => {
    // Load saved location from localStorage
    if (typeof window !== 'undefined') {
      const savedLocation = localStorage.getItem('weatherLocation');
      if (savedLocation) {
        try {
          const parsed = JSON.parse(savedLocation);
          setLatitude(parsed.latitude);
          setLongitude(parsed.longitude);
          setDisplayName(parsed.name);
          return;
        } catch (e) {
          console.error('Error parsing saved location:', e);
        }
      }
    }

    // Auto-detect user location
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
        },
        (error) => {
          console.warn('Geolocation error:', error);
          // Fallback to Hyderabad coordinates
          setLatitude(17.3850);
          setLongitude(78.4867);
        }
      );
    }
  }, []);

  useEffect(() => {
    if (latitude && longitude) {
      fetchWeather();
      generateHourlyForecast();
    }
  }, [latitude, longitude]);

  const fetchWeather = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/weather?lat=${latitude}&lng=${longitude}`);
      const data = await response.json();
      setWeather(data);
    } catch (error) {
      console.error('Error fetching weather:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateHourlyForecast = () => {
    // Generate mock hourly forecast for the next 7 hours
    const now = new Date();
    const istTime = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
    const forecast = [];

    const conditions = [
      { icon: '☀️', label: 'Clear', temp: 35 },
      { icon: '☀️', label: 'Clear', temp: 35 },
      { icon: '⛅', label: 'Partly Cloudy', temp: 34 },
      { icon: '⛅', label: 'Partly Cloudy', temp: 34 },
      { icon: '🌅', label: 'Sunset', temp: 'Sunset' },
      { icon: '🌙', label: 'Night', temp: 32 },
      { icon: '🌙', label: 'Night', temp: 30 },
    ];

    for (let i = 0; i < 7; i++) {
      const time = new Date(istTime.getTime() + i * 60 * 60 * 1000);
      const hour = time.toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' });
      forecast.push({
        time: hour,
        ...conditions[i],
      });
    }

    setHourlyForecast(forecast);
  };

  const handleLocationSelect = (lat: number, lng: number, name: string) => {
    setLatitude(lat);
    setLongitude(lng);
    setDisplayName(name);

    if (typeof window !== 'undefined') {
      localStorage.setItem('weatherLocation', JSON.stringify({
        latitude: lat,
        longitude: lng,
        name: name,
      }));
    }
  };

  const getWeatherGradient = () => {
    if (!weather) return 'from-blue-400 to-blue-500';

    const condition = weather.current.condition.text.toLowerCase();
    const now = new Date();
    const istTime = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
    const currentHour = istTime.getUTCHours();
    const isDay = currentHour >= 6 && currentHour < 18;

    if (condition.includes('rain') || condition.includes('drizzle')) {
      return isDay
        ? 'from-slate-400 to-slate-500'
        : 'from-slate-700 to-slate-800';
    }

    if (condition.includes('thunder') || condition.includes('storm')) {
      return isDay
        ? 'from-purple-500 to-purple-600'
        : 'from-purple-900 to-purple-950';
    }

    if (condition.includes('snow')) {
      return isDay
        ? 'from-cyan-300 to-cyan-400'
        : 'from-cyan-900 to-cyan-950';
    }

    if (condition.includes('cloud') || condition.includes('overcast')) {
      return isDay
        ? 'from-gray-400 to-gray-500'
        : 'from-gray-700 to-gray-800';
    }

    if (condition.includes('mist') || condition.includes('fog')) {
      return isDay
        ? 'from-blue-300 to-gray-400'
        : 'from-blue-900 to-gray-700';
    }

    return isDay
      ? 'from-blue-400 to-cyan-300'
      : 'from-indigo-900 to-slate-900';
  };

  if (loading || !weather) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-400 to-blue-500 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg">Loading weather...</p>
        </div>
      </div>
    );
  }

  const now = new Date();
  const today = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);

  return (
    <div className={`min-h-screen bg-gradient-to-b ${getWeatherGradient()} text-white overflow-auto pb-8`}>
      {/* Back Button */}
      <div className="p-4 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-2 transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-semibold">{displayName}</h1>
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="ml-auto bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-2 transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      {/* Current Weather Hero Section */}
      <div className="text-center py-12 px-4">
        <div className="text-8xl mb-4">{weather.current.condition.icon}</div>
        <div className="text-7xl font-bold mb-2">{Math.round(weather.current.temp_c)}°</div>
        <div className="text-2xl mb-4">{weather.current.condition.text}</div>
        <div className="text-lg opacity-90">
          ↑ 35° / ↓ 21°
        </div>
        <div className="text-sm mt-2 opacity-75">Feels like 35°</div>
      </div>

      {/* Weather Description */}
      <div className="mx-4 bg-white bg-opacity-15 rounded-2xl p-4 mb-4 backdrop-blur-sm">
        <p className="text-sm text-center">Generally clear. Highs 34 to 36°C and lows 20 to 22°C.</p>
      </div>

      {/* Hourly Forecast */}
      <div className="mx-4 mb-6">
        <div className="text-sm font-semibold mb-4">Hourly Forecast</div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {hourlyForecast.map((hour, idx) => (
            <div key={idx} className="flex flex-col items-center bg-white bg-opacity-10 rounded-xl p-4 min-w-max backdrop-blur-sm">
              <div className="text-xs opacity-70 mb-2">{hour.time}</div>
              <div className="text-3xl mb-2">{hour.icon}</div>
              <div className="text-sm font-semibold">
                {typeof hour.temp === 'number' ? `${hour.temp}°` : hour.temp}
              </div>
              <div className="text-xs opacity-70 mt-1">0%</div>
            </div>
          ))}
        </div>
      </div>

      {/* 7-Day Forecast */}
      <div className="mx-4 mb-6">
        <div className="text-sm font-semibold mb-4">7-Day Forecast</div>
        <div className="space-y-3">
          {[
            { day: 'Yesterday', icon: '☀️', high: 35, low: 20, condition: '0%' },
            { day: 'Today', icon: '☀️', high: 35, low: 21, condition: '0%' },
            { day: 'Fri', icon: '☀️', high: 36, low: 22, condition: '0%' },
            { day: 'Sat', icon: '⛅', high: 36, low: 22, condition: '1%' },
            { day: 'Sun', icon: '⛅', high: 34, low: 20, condition: '5%' },
            { day: 'Mon', icon: '🌧️', high: 32, low: 19, condition: '40%' },
            { day: 'Tue', icon: '🌧️', high: 30, low: 18, condition: '60%' },
          ].map((day, idx) => (
            <div key={idx} className="flex items-center justify-between bg-white bg-opacity-10 rounded-xl p-3 backdrop-blur-sm">
              <div className="flex items-center gap-3 flex-1">
                <span className="text-sm w-16 font-medium">{day.day}</span>
                <span className="text-2xl">{day.icon}</span>
              </div>
              <div className="flex items-center gap-4 flex-1 justify-end">
                <span className="text-xs opacity-70">{day.condition}</span>
                <div className="flex gap-2">
                  <span className="text-sm opacity-70">🌙 {day.low}°</span>
                  <span className="text-sm font-medium">☀️ {day.high}°</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* UV Index */}
      <div className="mx-4 mb-6">
        <div className="text-sm font-semibold mb-3">☀️ Protect your Skin</div>
        <div className="bg-white bg-opacity-15 rounded-2xl p-4 backdrop-blur-sm">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm">UV is extreme. Limit sun exposure if possible</span>
            <span className="text-2xl font-bold">11</span>
          </div>
          <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
            <div className="bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 h-2 rounded-full" style={{ width: '85%' }}></div>
          </div>
          <div className="flex justify-between text-xs opacity-70 mt-2">
            <span>0</span>
            <span>5</span>
            <span>10</span>
            <span>15</span>
            <span>20+</span>
          </div>
          {/* UV Index Indicators */}
          <div className="flex justify-center gap-2 mt-3">
            <div className="w-2 h-2 rounded-full bg-white opacity-50"></div>
            <div className="w-2 h-2 rounded-full bg-white opacity-50"></div>
            <div className="w-2 h-2 rounded-full bg-white"></div>
            <div className="w-2 h-2 rounded-full bg-white opacity-50"></div>
            <div className="w-2 h-2 rounded-full bg-white opacity-50"></div>
          </div>
        </div>
      </div>

      {/* Additional Details */}
      <div className="mx-4 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white bg-opacity-15 rounded-xl p-4 backdrop-blur-sm">
            <div className="text-xs opacity-70 mb-2">💧 Humidity</div>
            <div className="text-2xl font-semibold">65%</div>
          </div>
          <div className="bg-white bg-opacity-15 rounded-xl p-4 backdrop-blur-sm">
            <div className="text-xs opacity-70 mb-2">💨 Wind Speed</div>
            <div className="text-2xl font-semibold">12 km/h</div>
          </div>
          <div className="bg-white bg-opacity-15 rounded-xl p-4 backdrop-blur-sm">
            <div className="text-xs opacity-70 mb-2">🌊 Pressure</div>
            <div className="text-2xl font-semibold">1013 mb</div>
          </div>
          <div className="bg-white bg-opacity-15 rounded-xl p-4 backdrop-blur-sm">
            <div className="text-xs opacity-70 mb-2">👁️ Visibility</div>
            <div className="text-2xl font-semibold">10 km</div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <WeatherSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onLocationSelect={handleLocationSelect}
        currentLocation={{
          latitude: latitude || 0,
          longitude: longitude || 0,
          name: displayName,
        }}
        onRefresh={() => {
          if (latitude && longitude) {
            fetchWeather();
          }
        }}
      />
    </div>
  );
}
