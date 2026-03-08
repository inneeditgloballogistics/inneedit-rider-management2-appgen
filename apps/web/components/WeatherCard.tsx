'use client';

import { useEffect, useState } from 'react';
import { useWeather, type WeatherData } from '@/hooks/useWeather';

interface WeatherCardProps {
  latitude: number;
  longitude: number;
  locationName?: string;
  showDetails?: boolean;
}

export default function WeatherCard({
  latitude,
  longitude,
  locationName = 'This Location',
  showDetails = true,
}: WeatherCardProps) {
  const { getWeather, loading, error } = useWeather();
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      const data = await getWeather(latitude, longitude);
      setWeather(data);
    };

    fetchWeather();

    // Refresh weather every 10 minutes
    const interval = setInterval(fetchWeather, 600000);
    return () => clearInterval(interval);
  }, [latitude, longitude, getWeather]);

  const getWeatherIcon = (condition: string) => {
    const conditionLower = condition?.toLowerCase() || '';

    if (
      conditionLower.includes('clear') ||
      conditionLower.includes('sunny')
    ) {
      return '☀️';
    } else if (
      conditionLower.includes('cloud') ||
      conditionLower.includes('overcast')
    ) {
      return '☁️';
    } else if (conditionLower.includes('rain')) {
      return '🌧️';
    } else if (conditionLower.includes('thunderstorm')) {
      return '⛈️';
    } else if (conditionLower.includes('snow')) {
      return '❄️';
    } else if (
      conditionLower.includes('mist') ||
      conditionLower.includes('fog')
    ) {
      return '🌫️';
    } else if (conditionLower.includes('wind')) {
      return '💨';
    }

    return '🌡️';
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-200 animate-pulse">
        <div className="h-4 bg-blue-200 rounded mb-2 w-1/2"></div>
        <div className="h-8 bg-blue-200 rounded w-1/3"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-lg p-4 border border-red-200">
        <p className="text-sm text-red-700 font-medium">Weather unavailable</p>
        <p className="text-xs text-red-600 mt-1">{error}</p>
      </div>
    );
  }

  if (!weather) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg p-4 text-white shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold opacity-90">{locationName}</h3>
        <span className="text-xs opacity-75">
          {weather.timestamp && new Date(weather.timestamp).toLocaleTimeString()}
        </span>
      </div>

      {/* Main Weather Display */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-3xl font-bold">{weather.temperature}°C</span>
            <span className="text-2xl">{getWeatherIcon(weather.condition)}</span>
          </div>
          <p className="text-sm opacity-90 capitalize">{weather.condition}</p>
        </div>
      </div>

      {/* Details */}
      {showDetails && (
        <div className="bg-white bg-opacity-20 rounded-lg p-3 backdrop-blur-sm">
          <div className="grid grid-cols-2 gap-2 text-xs">
            {weather.humidity !== undefined && (
              <div className="flex items-center gap-1">
                <span>💧</span>
                <span>Humidity: {weather.humidity}%</span>
              </div>
            )}
            {weather.windSpeed !== undefined && (
              <div className="flex items-center gap-1">
                <span>💨</span>
                <span>Wind: {weather.windSpeed.toFixed(1)} m/s</span>
              </div>
            )}
            {weather.precipitationProbability !== undefined && (
              <div className="flex items-center gap-1">
                <span>🌧️</span>
                <span>Rain: {weather.precipitationProbability}%</span>
              </div>
            )}
            {weather.windGust !== undefined && (
              <div className="flex items-center gap-1">
                <span>🌪️</span>
                <span>Gust: {weather.windGust.toFixed(1)} m/s</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
