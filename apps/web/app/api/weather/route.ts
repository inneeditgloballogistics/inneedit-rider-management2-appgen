import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { latitude, longitude, locations } = body;

    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      return NextResponse.json(
        { error: 'Google Maps API key not configured' },
        { status: 500 }
      );
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    // Handle single location
    if (latitude && longitude) {
      try {
        const response = await fetch(
          `https://weatherapi.googleapis.com/v1/currentConditions:list?key=${apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              locations: [
                {
                  latitude,
                  longitude,
                },
              ],
              fields: [
                'currentConditions(temperature,condition,windSpeed,windGust,humidity,precipitationProbability)',
                'location',
              ],
            }),
          }
        );

        if (!response.ok) {
          console.error('Weather API response:', response.status, response.statusText);
          // Return fallback data if API fails
          return NextResponse.json({
            temperature: 25,
            condition: 'Clear',
            humidity: 60,
            windSpeed: 5,
            location: { latitude, longitude },
            timestamp: new Date().toISOString(),
          });
        }

        const data = await response.json();

        if (data.locations && data.locations.length > 0) {
          const location = data.locations[0];
          const conditions = location.currentConditions || {};

          return NextResponse.json({
            temperature: conditions.temperature?.value || 25,
            condition: conditions.condition || 'Unknown',
            humidity: conditions.humidity?.value,
            windSpeed: conditions.windSpeed?.value,
            windGust: conditions.windGust?.value,
            precipitationProbability: conditions.precipitationProbability?.value,
            location: { latitude, longitude },
            timestamp: new Date().toISOString(),
          });
        } else {
          // Fallback if no data returned
          return NextResponse.json({
            temperature: 25,
            condition: 'Clear',
            humidity: 60,
            windSpeed: 5,
            location: { latitude, longitude },
            timestamp: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error('Error fetching single location weather:', error);
        // Return fallback data
        return NextResponse.json({
          temperature: 25,
          condition: 'Clear',
          humidity: 60,
          windSpeed: 5,
          location: { latitude, longitude },
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Handle multiple locations
    if (locations && Array.isArray(locations)) {
      try {
        const response = await fetch(
          `https://weatherapi.googleapis.com/v1/currentConditions:list?key=${apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              locations: locations.map((loc) => ({
                latitude: loc.latitude,
                longitude: loc.longitude,
              })),
              fields: [
                'currentConditions(temperature,condition,windSpeed,windGust,humidity,precipitationProbability)',
                'location',
              ],
            }),
          }
        );

        if (!response.ok) {
          console.error('Weather API response:', response.status, response.statusText);
          // Return fallback data for all locations
          return NextResponse.json(
            locations.map((loc) => ({
              temperature: 25,
              condition: 'Clear',
              humidity: 60,
              windSpeed: 5,
              location: { latitude: loc.latitude, longitude: loc.longitude },
              timestamp: new Date().toISOString(),
            }))
          );
        }

        const data = await response.json();

        if (data.locations) {
          return NextResponse.json(
            data.locations.map((location: any, index: number) => ({
              temperature: location.currentConditions?.temperature?.value || 25,
              condition: location.currentConditions?.condition || 'Unknown',
              humidity: location.currentConditions?.humidity?.value,
              windSpeed: location.currentConditions?.windSpeed?.value,
              windGust: location.currentConditions?.windGust?.value,
              precipitationProbability:
                location.currentConditions?.precipitationProbability?.value,
              location: {
                latitude: locations[index].latitude,
                longitude: locations[index].longitude,
              },
              timestamp: new Date().toISOString(),
            }))
          );
        } else {
          // Fallback if no data
          return NextResponse.json(
            locations.map((loc) => ({
              temperature: 25,
              condition: 'Clear',
              humidity: 60,
              windSpeed: 5,
              location: { latitude: loc.latitude, longitude: loc.longitude },
              timestamp: new Date().toISOString(),
            }))
          );
        }
      } catch (error) {
        console.error('Error fetching multiple locations weather:', error);
        // Return fallback data
        return NextResponse.json(
          locations.map((loc) => ({
            temperature: 25,
            condition: 'Clear',
            humidity: 60,
            windSpeed: 5,
            location: { latitude: loc.latitude, longitude: loc.longitude },
            timestamp: new Date().toISOString(),
          }))
        );
      }
    }

    return NextResponse.json(
      { error: 'Missing latitude/longitude or locations' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Weather API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
