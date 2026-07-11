import exifr from 'exifr';

export type ExifData = {
  photoDate: string | null;
  gpsLat: number | null;
  gpsLng: number | null;
};

export async function extractExif(file: File): Promise<ExifData> {
  try {
    const exif = await exifr.parse(file, {
      tiff: true,
      exif: true,
      gps: true,
    });

    if (!exif) {
      return { photoDate: null, gpsLat: null, gpsLng: null };
    }

    let photoDate: string | null = null;
    if (exif.DateTimeOriginal) {
      photoDate = new Date(exif.DateTimeOriginal).toISOString();
    } else if (exif.CreateDate) {
      photoDate = new Date(exif.CreateDate).toISOString();
    }

    let gpsLat: number | null = null;
    let gpsLng: number | null = null;
    if (exif.latitude && exif.longitude) {
      gpsLat = exif.latitude;
      gpsLng = exif.longitude;
    } else if (exif.GPSLatitude && exif.GPSLongitude) {
      gpsLat = Array.isArray(exif.GPSLatitude) ? dmsToDecimal(exif.GPSLatitude, exif.GPSLatitudeRef) : exif.GPSLatitude;
      gpsLng = Array.isArray(exif.GPSLongitude) ? dmsToDecimal(exif.GPSLongitude, exif.GPSLongitudeRef) : exif.GPSLongitude;
    }

    return { photoDate, gpsLat, gpsLng };
  } catch {
    return { photoDate: null, gpsLat: null, gpsLng: null };
  }
}

function dmsToDecimal(dms: number[], ref: string): number {
  const [degrees, minutes, seconds] = dms;
  let decimal = degrees + minutes / 60 + seconds / 3600;
  if (ref === 'S' || ref === 'W') {
    decimal = -decimal;
  }
  return decimal;
}

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    const response = await fetch(url, {
      headers: {
        'Accept-Language': 'fr,en',
      },
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (data.display_name) {
      return data.display_name as string;
    }
    return null;
  } catch {
    return null;
  }
}

export async function getCurrentLocation(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  });
}
