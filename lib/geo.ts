import type { Direction8 } from "@/lib/types";

const EARTH_RADIUS_MILES = 3958.7613;

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function toDegrees(value: number) {
  return (value * 180) / Math.PI;
}

export function haversineMiles(
  origin: { lat: number; lon: number },
  target: { lat: number; lon: number },
): number {
  const latDelta = toRadians(target.lat - origin.lat);
  const lonDelta = toRadians(target.lon - origin.lon);
  const originLat = toRadians(origin.lat);
  const targetLat = toRadians(target.lat);

  const haversine =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(originLat) * Math.cos(targetLat) * Math.sin(lonDelta / 2) ** 2;

  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(haversine));
}

export function bearingDegrees(
  origin: { lat: number; lon: number },
  target: { lat: number; lon: number },
): number {
  const originLat = toRadians(origin.lat);
  const targetLat = toRadians(target.lat);
  const lonDelta = toRadians(target.lon - origin.lon);

  const y = Math.sin(lonDelta) * Math.cos(targetLat);
  const x =
    Math.cos(originLat) * Math.sin(targetLat) -
    Math.sin(originLat) * Math.cos(targetLat) * Math.cos(lonDelta);

  return modDegrees(toDegrees(Math.atan2(y, x)));
}

function modDegrees(value: number) {
  return (value + 360) % 360;
}

export function bearingToDirection8(bearing: number): Direction8 {
  const directions: Direction8[] = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
}

export function roundMiles(value: number): number {
  return Math.round(value / 10) * 10;
}
