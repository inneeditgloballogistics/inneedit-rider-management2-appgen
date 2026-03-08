import { useCallback, useState } from 'react';

export interface WeatherData {
  temperature: number;
  condition: string;
  humidity?: number;
  windSpeed?: number;
  windGust?: number;
  precipitationProbability?: number;
  location: {
    latitude: number;
    longitude: number;
  };
  timestamp?: string;
}

export function useWeather() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getWeather = useCallback(
    async (latitude: number, longitude: number): Promise<WeatherData | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/weather', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ latitude, longitude }),
        });

        if (!response.ok) {
          throw new Error(`Weather API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch weather';
        setError(errorMessage);
        console.error('Weather fetch error:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getWeatherMultiple = useCallback(
    async (locations: { latitude: number; longitude: number }[]): Promise<WeatherData[]> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/weather', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ locations }),
        });

        if (!response.ok) {
          throw new Error(`Weather API error: ${response.statusText}`);
        }

        const data = await response.json();
        return Array.isArray(data) ? data : [data];
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch weather data';
        setError(errorMessage);
        console.error('Weather fetch error:', err);
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    getWeather,
    getWeatherMultiple,
    loading,
    error,
  };
}
