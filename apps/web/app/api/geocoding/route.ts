import { NextResponse } from "next/server";

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

// Helper function to make geocoding requests
async function makeGeocodingRequest(url: string) {
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Geocoding API error: ${response.statusText}`);
  }
  
  return response.json();
}

// Reverse Geocoding: Convert lat/lng to address
export async function POST(request: Request) {
  try {
    const { lat, lng, action } = await request.json();

    if (!GOOGLE_MAPS_API_KEY) {
      return NextResponse.json(
        { error: "Google Maps API key not configured" },
        { status: 500 }
      );
    }

    // Reverse Geocoding
    if (action === "reverse") {
      if (!lat || !lng) {
        return NextResponse.json(
          { error: "Latitude and longitude are required" },
          { status: 400 }
        );
      }

      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`;
      const data = await makeGeocodingRequest(url);

      if (data.status !== "OK") {
        return NextResponse.json(
          { error: `Geocoding failed: ${data.status}` },
          { status: 400 }
        );
      }

      // Parse the first result
      const result = data.results[0];
      if (!result) {
        return NextResponse.json(
          { error: "No address found for these coordinates" },
          { status: 404 }
        );
      }

      // Extract detailed address components
      const addressComponents = {
        formatted_address: result.formatted_address,
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
        street_address: "",
        city: "",
        state: "",
        country: "",
        pincode: "",
      };

      // Parse address components
      result.address_components.forEach(
        (component: { long_name: string; short_name: string; types: string[] }) => {
          if (component.types.includes("route")) {
            addressComponents.street_address = component.long_name;
          }
          if (
            component.types.includes("locality") ||
            component.types.includes("administrative_area_level_3")
          ) {
            addressComponents.city = component.long_name;
          }
          if (component.types.includes("administrative_area_level_1")) {
            addressComponents.state = component.short_name;
          }
          if (component.types.includes("country")) {
            addressComponents.country = component.long_name;
          }
          if (component.types.includes("postal_code")) {
            addressComponents.pincode = component.long_name;
          }
        }
      );

      return NextResponse.json({
        success: true,
        data: addressComponents,
        allResults: data.results,
      });
    }

    // Forward Geocoding: Convert address to lat/lng
    if (action === "forward") {
      const { address } = await request.json();
      if (!address) {
        return NextResponse.json(
          { error: "Address is required for forward geocoding" },
          { status: 400 }
        );
      }

      const encodedAddress = encodeURIComponent(address);
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${GOOGLE_MAPS_API_KEY}`;
      const data = await makeGeocodingRequest(url);

      if (data.status !== "OK") {
        return NextResponse.json(
          { error: `Geocoding failed: ${data.status}` },
          { status: 400 }
        );
      }

      const results = data.results.map((result: any) => ({
        formatted_address: result.formatted_address,
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
        place_id: result.place_id,
      }));

      return NextResponse.json({
        success: true,
        data: results,
      });
    }

    return NextResponse.json(
      { error: "Invalid action. Use 'reverse' or 'forward'" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Geocoding API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET endpoint for simple reverse geocoding
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");

    if (!lat || !lng) {
      return NextResponse.json(
        { error: "Latitude and longitude query parameters are required" },
        { status: 400 }
      );
    }

    if (!GOOGLE_MAPS_API_KEY) {
      return NextResponse.json(
        { error: "Google Maps API key not configured" },
        { status: 500 }
      );
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`;
    const data = await makeGeocodingRequest(url);

    if (data.status !== "OK") {
      return NextResponse.json(
        { error: `Geocoding failed: ${data.status}` },
        { status: 400 }
      );
    }

    const result = data.results[0];
    if (!result) {
      return NextResponse.json(
        { error: "No address found for these coordinates" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      address: result.formatted_address,
      latitude: result.geometry.location.lat,
      longitude: result.geometry.location.lng,
      placeId: result.place_id,
    });
  } catch (error) {
    console.error("Geocoding API GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
